import { useEffect, useMemo, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import Dashboard from './components/Dashboard'
import { isSupabaseConfigured, supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState('')
  const [syncStatus, setSyncStatus] = useState('desconectado')

  const user = useMemo(() => session?.user ?? null, [session])

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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return
        setSession(nextSession ?? null)
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setTransactions([])
      setSyncStatus('desconectado')
      return
    }

    let active = true
    let channel = null

    async function loadTransactions(showLoading = true) {
      if (showLoading) setLoadingTransactions(true)
      setSyncStatus('sincronizando')

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!active) return

      if (fetchError) {
        setError(fetchError.message)
        setSyncStatus('erro')
      } else {
        setTransactions(data ?? [])
        setError('')
        setSyncStatus('sincronizado')
      }

      if (showLoading) setLoadingTransactions(false)
    }

    loadTransactions()

    channel = supabase
      .channel(`transactions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadTransactions(false)
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
      if (channel) supabase.removeChannel(channel)
    }
  }, [user])

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

  async function handleSaveTransaction(transaction) {
    if (!user) return false

    setSavingTransaction(true)
    setError('')

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
      : supabase.from('transactions').insert(payload)

    const { error: saveError } = await query

    if (saveError) {
      setError(saveError.message)
      setSavingTransaction(false)
      return false
    }

    setSavingTransaction(false)
    return true
  }

  async function handleDeleteTransaction(id) {
    if (!user) return

    setError('')

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
    }
  }

  async function handleSignOut() {
    if (!isSupabaseConfigured) return

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)
    } else {
      setTransactions([])
      setSession(null)
      setSyncStatus('desconectado')
    }
  }

  if (!user) {
    return (
      <AuthScreen
        configured={isSupabaseConfigured}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        authLoading={authLoading}
        authError={authError}
      />
    )
  }

  return (
    <Dashboard
      user={user}
      transactions={transactions}
      loadingTransactions={loadingTransactions}
      savingTransaction={savingTransaction}
      syncStatus={syncStatus}
      error={error}
      onSaveTransaction={handleSaveTransaction}
      onDeleteTransaction={handleDeleteTransaction}
      onSignOut={handleSignOut}
    />
  )
}

export default App
