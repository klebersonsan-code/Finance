import { useEffect, useMemo, useRef, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import Dashboard from './components/Dashboard'
import { getMonthKey } from './lib/finance'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  buildRpcFilterParams,
  HISTORY_PAGE_SIZE,
  matchesTransactionFilters,
  mergeTransactionIntoHistory,
  removeTransactionFromHistory,
} from './lib/transactions'

const emptyMetrics = {
  receitas: 0,
  despesas: 0,
  totalCount: 0,
  expenseCategoryData: [],
}

const DEFAULT_APP_URL = 'https://finance-pro-top.vercel.app/'

function getAuthRedirectUrl() {
  const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim()

  if (configuredAppUrl) {
    return configuredAppUrl.endsWith('/') ? configuredAppUrl : `${configuredAppUrl}/`
  }

  const currentOrigin = window.location.origin
  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  const isLocalNetworkHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)

  if (isLocalhost || isLocalNetworkHost) {
    return DEFAULT_APP_URL
  }

  if (currentOrigin.includes('vercel.app')) {
    return `${currentOrigin}/`
  }

  return DEFAULT_APP_URL
}

function normalizeMetricsRow(row) {
  return {
    receitas: Number(row?.receitas ?? 0),
    despesas: Number(row?.despesas ?? 0),
    totalCount: Number(row?.total_count ?? 0),
    expenseCategoryData: Array.isArray(row?.expense_categories)
      ? row.expense_categories
      : [],
  }
}

function App() {
  const [session, setSession] = useState(null)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [clearingTransactions, setClearingTransactions] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [authError, setAuthError] = useState('')
  const [syncStatus, setSyncStatus] = useState('desconectado')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [monthFilter, setMonthFilter] = useState('todos')
  const [monthOptions, setMonthOptions] = useState([])
  const [metrics, setMetrics] = useState(emptyMetrics)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyHasMore, setHistoryHasMore] = useState(false)

  const requestVersionRef = useRef(0)
  const filterSnapshotRef = useRef({ typeFilter: 'todos', monthFilter: 'todos' })
  const metricsRefreshTimeoutRef = useRef(null)
  const historyPageRef = useRef(1)
  const historyLengthRef = useRef(0)

  const user = useMemo(() => session?.user ?? null, [session])

  useEffect(() => {
    filterSnapshotRef.current = { typeFilter, monthFilter }
  }, [monthFilter, typeFilter])

  useEffect(() => {
    historyPageRef.current = historyPage
  }, [historyPage])

  useEffect(() => {
    historyLengthRef.current = transactions.length
  }, [transactions.length])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false)
      return
    }

    let active = true

    async function bootstrap() {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!active) return

      if (sessionError) {
        setError(sessionError.message)
      }

      setSession(data.session ?? null)
      setAuthLoading(false)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      if (_event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true)
        setAuthError('')
      }
      if (_event === 'SIGNED_OUT') {
        setPasswordRecoveryMode(false)
      }
      setSession(nextSession ?? null)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!notice) return undefined

    const timeoutId = window.setTimeout(() => {
      setNotice(null)
    }, 3200)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setTransactions([])
      setMetrics(emptyMetrics)
      setMonthOptions([])
      setHistoryPage(1)
      setHistoryHasMore(false)
      setSyncStatus('desconectado')
      return
    }

    let active = true

    async function loadMonthOptions() {
      const { data, error: monthsError } = await supabase.rpc('get_transaction_months')

      if (!active) return

      if (monthsError) {
        setError(monthsError.message)
        return
      }

      setMonthOptions((data ?? []).map((item) => item.month_key))
    }

    loadMonthOptions()

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      return
    }

    const currentVersion = ++requestVersionRef.current
    let active = true

    async function loadDashboardData() {
      setLoadingTransactions(true)
      setError('')
      setSyncStatus('sincronizando')

      const filters = buildRpcFilterParams(typeFilter, monthFilter)
      const historyLimit = HISTORY_PAGE_SIZE

      const [metricsResult, historyResult] = await Promise.all([
        supabase.rpc('get_transaction_metrics', filters),
        supabase.rpc('get_transaction_history_page', {
          ...filters,
          p_limit: historyLimit,
          p_offset: 0,
        }),
      ])

      if (!active || requestVersionRef.current !== currentVersion) return

      if (metricsResult.error || historyResult.error) {
        setError(
          metricsResult.error?.message ||
            historyResult.error?.message ||
            'Nao foi possivel carregar os dados.',
        )
        setSyncStatus('erro')
        setLoadingTransactions(false)
        return
      }

      const nextMetrics = normalizeMetricsRow(metricsResult.data?.[0])
      const nextTransactions = historyResult.data ?? []

      setMetrics(nextMetrics)
      setTransactions(nextTransactions)
      setHistoryPage(1)
      setHistoryHasMore(nextTransactions.length < nextMetrics.totalCount)
      setError('')
      setSyncStatus('sincronizado')
      setLoadingTransactions(false)
    }

    loadDashboardData()

    const channel = supabase
      .channel(`transactions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!active) return

          const loadedCount = Math.max(historyPageRef.current, 1) * HISTORY_PAGE_SIZE
          const { typeFilter: currentTypeFilter, monthFilter: currentMonthFilter } =
            filterSnapshotRef.current

          if (payload.eventType === 'INSERT' && payload.new) {
            setTransactions((current) =>
              mergeTransactionIntoHistory(current, payload.new, {
                typeFilter: currentTypeFilter,
                monthFilter: currentMonthFilter,
                loadedCount,
              }),
            )
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            setTransactions((current) =>
              mergeTransactionIntoHistory(current, payload.new, {
                typeFilter: currentTypeFilter,
                monthFilter: currentMonthFilter,
                loadedCount,
              }),
            )
          }

          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setTransactions((current) => removeTransactionFromHistory(current, payload.old.id))
          }

          if (metricsRefreshTimeoutRef.current) {
            window.clearTimeout(metricsRefreshTimeoutRef.current)
          }

          metricsRefreshTimeoutRef.current = window.setTimeout(async () => {
            const refreshFilters = buildRpcFilterParams(
              filterSnapshotRef.current.typeFilter,
              filterSnapshotRef.current.monthFilter,
            )
            const shouldRefreshMonths =
              payload.eventType !== 'UPDATE' ||
              getMonthKey(payload.new?.date || '') !== getMonthKey(payload.old?.date || '')

            const requests = [
              supabase.rpc('get_transaction_metrics', refreshFilters),
              shouldRefreshMonths ? supabase.rpc('get_transaction_months') : Promise.resolve(null),
            ]
            const [metricsResult, monthsResult] = await Promise.all(requests)

            if (!active) return

            if (monthsResult && !monthsResult.error) {
              setMonthOptions((monthsResult.data ?? []).map((item) => item.month_key))
            }

            if (!metricsResult.error) {
              const nextMetrics = normalizeMetricsRow(metricsResult.data?.[0])
              setMetrics(nextMetrics)
              setHistoryHasMore(historyLengthRef.current < nextMetrics.totalCount)
              setError('')
            }
          }, 180)
        },
      )
      .subscribe((status) => {
        if (!active) return

        if (status === 'SUBSCRIBED') {
          setSyncStatus('tempo real ativo')
          return
        }

        if (status === 'CHANNEL_ERROR') {
          setSyncStatus('erro')
        }
      })

    return () => {
      active = false
      if (metricsRefreshTimeoutRef.current) {
        window.clearTimeout(metricsRefreshTimeoutRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [monthFilter, typeFilter, user])

  useEffect(() => {
    if (monthFilter === 'todos') return
    if (monthOptions.includes(monthFilter)) return
    setMonthFilter('todos')
  }, [monthFilter, monthOptions])

  async function refreshMetricsOnly() {
    if (!user) return

    const filters = buildRpcFilterParams(
      filterSnapshotRef.current.typeFilter,
      filterSnapshotRef.current.monthFilter,
    )

    const { data, error: metricsError } = await supabase.rpc(
      'get_transaction_metrics',
      filters,
    )

    if (metricsError) {
      setError(metricsError.message)
      return
    }

    const nextMetrics = normalizeMetricsRow(data?.[0])
    setMetrics(nextMetrics)
    setHistoryHasMore(historyLengthRef.current < nextMetrics.totalCount)
  }

  async function refreshMonthOptionsOnly() {
    if (!user) return

    const { data, error: monthsError } = await supabase.rpc('get_transaction_months')

    if (monthsError) {
      setError(monthsError.message)
      return
    }

    setMonthOptions((data ?? []).map((item) => item.month_key))
  }

  async function loadMoreHistory() {
    if (!user || loadingMoreHistory || !historyHasMore) return

    const nextPage = historyPage + 1
    const offset = historyPage * HISTORY_PAGE_SIZE

    setLoadingMoreHistory(true)

    const { data, error: historyError } = await supabase.rpc(
      'get_transaction_history_page',
      {
        ...buildRpcFilterParams(typeFilter, monthFilter),
        p_limit: HISTORY_PAGE_SIZE,
        p_offset: offset,
      },
    )

    if (historyError) {
      setError(historyError.message)
      setLoadingMoreHistory(false)
      return
    }

    const nextItems = data ?? []
    setTransactions((current) => [...current, ...nextItems])
    setHistoryPage(nextPage)
    setHistoryHasMore(offset + nextItems.length < metrics.totalCount)
    setLoadingMoreHistory(false)
  }

  async function handleSignIn(email, password) {
    if (!isSupabaseConfigured) return

    setAuthLoading(true)
    setAuthError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setAuthError(signInError.message)
    }

    setAuthLoading(false)
  }

  async function handleSignUp(email, password) {
    if (!isSupabaseConfigured) return

    setAuthLoading(true)
    setAuthError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    if (signUpError) {
      setAuthError(signUpError.message)
    } else {
      setAuthError(
        'Conta criada. Se a confirmacao por e-mail estiver ativa, confirme antes de entrar.',
      )
    }

    setAuthLoading(false)
  }

  async function handleRequestPasswordReset(email) {
    if (!isSupabaseConfigured) return

    setAuthLoading(true)
    setAuthError('')

    const redirectTo = getAuthRedirectUrl()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setAuthError(resetError.message)
    } else {
      setAuthError('Enviamos um link para redefinir sua senha no e-mail informado.')
    }

    setAuthLoading(false)
  }

  async function handleUpdatePassword(nextPassword) {
    if (!isSupabaseConfigured) return

    setAuthLoading(true)
    setAuthError('')

    const { error: updateError } = await supabase.auth.updateUser({
      password: nextPassword,
    })

    if (updateError) {
      setAuthError(updateError.message)
    } else {
      setAuthError('Senha atualizada com sucesso. Voce ja pode entrar novamente.')
      setPasswordRecoveryMode(false)
    }

    setAuthLoading(false)
  }

  async function handleSaveTransaction(transaction) {
    if (!user) return false

    setSavingTransaction(true)
    setError('')
    setNotice(null)

    const payload = {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      user_id: user.id,
    }

    const query = transaction.id
      ? supabase
          .from('transactions')
          .update(payload)
          .eq('id', transaction.id)
          .eq('user_id', user.id)
          .select('id, description, amount, type, category, date, created_at')
          .single()
      : supabase
          .from('transactions')
          .insert(payload)
          .select('id, description, amount, type, category, date, created_at')
          .single()

    const { data: savedTransaction, error: saveError } = await query

    if (saveError) {
      setError(saveError.message)
      setNotice({ type: 'error', message: 'Nao foi possivel salvar a transacao.' })
      setSavingTransaction(false)
      return false
    }

    const loadedCount = Math.max(historyPageRef.current, 1) * HISTORY_PAGE_SIZE

    setTransactions((current) =>
      mergeTransactionIntoHistory(current, savedTransaction, {
        typeFilter,
        monthFilter,
        loadedCount,
      }),
    )

    await Promise.all([refreshMetricsOnly(), refreshMonthOptionsOnly()])

    setNotice({
      type: 'success',
      message: transaction.id
        ? 'Transacao atualizada com sucesso.'
        : 'Transacao adicionada com sucesso.',
    })
    setSavingTransaction(false)
    return true
  }

  async function handleDeleteTransaction(id) {
    if (!user) return false

    const currentTransaction = transactions.find((item) => item.id === id)

    setError('')
    setNotice(null)

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      setNotice({ type: 'error', message: 'Nao foi possivel excluir a transacao.' })
      return false
    }

    setTransactions((current) => removeTransactionFromHistory(current, id))

    if (
      currentTransaction &&
      matchesTransactionFilters(currentTransaction, typeFilter, monthFilter)
    ) {
      setHistoryHasMore(true)
    }

    await Promise.all([refreshMetricsOnly(), refreshMonthOptionsOnly()])

    setNotice({ type: 'success', message: 'Transacao excluida com sucesso.' })
    return true
  }

  async function handleClearAllTransactions() {
    if (!user) return false

    setClearingTransactions(true)
    setError('')
    setNotice(null)

    const { error: clearError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)

    if (clearError) {
      setError(clearError.message)
      setNotice({ type: 'error', message: 'Nao foi possivel zerar os dados.' })
      setClearingTransactions(false)
      return false
    }

    setTransactions([])
    setMetrics(emptyMetrics)
    setMonthOptions([])
    setHistoryPage(1)
    setHistoryHasMore(false)
    setNotice({ type: 'success', message: 'Todas as transacoes foram removidas.' })
    setClearingTransactions(false)
    return true
  }

  async function handleSignOut() {
    if (!isSupabaseConfigured) return

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)
    } else {
      setTransactions([])
      setMetrics(emptyMetrics)
      setMonthOptions([])
      setSession(null)
      setSyncStatus('desconectado')
    }
  }

  if (!user || passwordRecoveryMode) {
    return (
      <AuthScreen
        configured={isSupabaseConfigured}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onRequestPasswordReset={handleRequestPasswordReset}
        onUpdatePassword={handleUpdatePassword}
        authLoading={authLoading}
        authError={authError}
        passwordRecoveryMode={passwordRecoveryMode}
      />
    )
  }

  return (
    <Dashboard
      user={user}
      transactions={transactions}
      monthOptions={monthOptions}
      summary={metrics}
      expenseCategoryData={metrics.expenseCategoryData}
      totalTransactions={metrics.totalCount}
      typeFilter={typeFilter}
      monthFilter={monthFilter}
      onTypeFilterChange={setTypeFilter}
      onMonthFilterChange={setMonthFilter}
      onResetFilters={() => {
        setTypeFilter('todos')
        setMonthFilter('todos')
      }}
      loadingTransactions={loadingTransactions}
      loadingMoreHistory={loadingMoreHistory}
      hasMoreHistory={historyHasMore}
      onLoadMoreHistory={loadMoreHistory}
      savingTransaction={savingTransaction}
      clearingTransactions={clearingTransactions}
      syncStatus={syncStatus}
      error={error}
      notice={notice}
      onSaveTransaction={handleSaveTransaction}
      onDeleteTransaction={handleDeleteTransaction}
      onClearAllTransactions={handleClearAllTransactions}
      onSignOut={handleSignOut}
    />
  )
}

export default App
