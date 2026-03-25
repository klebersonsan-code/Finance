import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  categoryMap,
  chartPalette,
  createFormInitialState,
  formatCurrency,
  formatMonthLabel,
  formatShortDate,
  getCategoryMeta,
  getDefaultCategory,
  getMonthKey,
} from '../lib/finance'

function Dashboard(props) {
  const {
    user,
    transactions,
    loadingTransactions,
    savingTransaction,
    syncStatus,
    error,
    notice,
    onSaveTransaction,
    onDeleteTransaction,
    onSignOut,
  } = props

  const [form, setForm] = useState(createFormInitialState)
  const [editingId, setEditingId] = useState(null)
  const [typeFilter, setTypeFilter] = useState('todos')
  const [monthFilter, setMonthFilter] = useState('todos')

  const monthOptions = useMemo(
    () =>
      Array.from(new Set(transactions.map((item) => getMonthKey(item.date)))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [transactions],
  )

  const hasTransactions = transactions.length > 0

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((item) => (typeFilter === 'todos' ? true : item.type === typeFilter))
      .filter((item) =>
        monthFilter === 'todos' ? true : getMonthKey(item.date) === monthFilter,
      )
      .sort(
        (a, b) =>
          `${b.date}-${b.created_at || ''}-${b.id}`.localeCompare(
            `${a.date}-${a.created_at || ''}-${a.id}`,
          ),
      )
  }, [monthFilter, transactions, typeFilter])

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, item) => {
      const monthKey = getMonthKey(item.date)
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(item)
      return groups
    }, {})
  }, [filteredTransactions])

  const summary = useMemo(() => {
    const receitas = filteredTransactions
      .filter((item) => item.type === 'receita')
      .reduce((total, item) => total + Number(item.amount), 0)

    const despesas = filteredTransactions
      .filter((item) => item.type === 'despesa')
      .reduce((total, item) => total + Number(item.amount), 0)

    return { receitas, despesas, saldo: receitas - despesas }
  }, [filteredTransactions])

  const currentCategories = categoryMap[form.type]
  const activeFilters = [
    typeFilter !== 'todos'
      ? { label: `Tipo: ${typeFilter === 'receita' ? 'Receitas' : 'Despesas'}` }
      : null,
    monthFilter !== 'todos'
      ? { label: `Mes: ${formatMonthLabel(monthFilter)}` }
      : null,
  ].filter(Boolean)
  const syncTone =
    syncStatus === 'erro'
      ? styles.syncBadgeError
      : syncStatus === 'tempo real ativo'
        ? styles.syncBadgeLive
        : styles.syncBadgeDefault
  const comparisonData = [
    { name: 'Receitas', value: summary.receitas, fill: '#34d399' },
    { name: 'Despesas', value: summary.despesas, fill: '#fb7185' },
  ]

  const expenseCategoryData = useMemo(() => {
    const grouped = filteredTransactions
      .filter((item) => item.type === 'despesa')
      .reduce((acc, item) => {
        const category = getCategoryMeta(item.type, item.category)
        if (!acc[item.category]) {
          acc[item.category] = { name: category.label, value: 0, icon: category.icon }
        }
        acc[item.category].value += Number(item.amount)
        return acc
      }, {})

    return Object.values(grouped).sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  function resetForm() {
    setForm(createFormInitialState())
    setEditingId(null)
  }

  function handleChange(event) {
    const { name, value } = event.target
    if (name === 'type') {
      setForm((current) => ({
        ...current,
        type: value,
        category: getDefaultCategory(value),
      }))
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.description.trim() || !amount || amount <= 0) return

    const success = await onSaveTransaction({
      id: editingId,
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
      date: form.date,
    })

    if (success) resetForm()
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setForm({
      description: item.description,
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      date: item.date,
    })
  }

  async function handleDelete(id) {
    const success = await onDeleteTransaction(id)
    if (success && editingId === id) {
      resetForm()
    }
  }

  return (
    <main style={styles.page} className="dashboard-shell">
      <section style={styles.container} className="dashboard-container">
        <header style={styles.hero} className="premium-card hero-card fade-up">
          <div className="hero-main">
            <span style={styles.kicker}>Dashboard Financeiro</span>
            <span style={styles.heroPill}>Visao premium do seu fluxo financeiro</span>
            <h1 style={styles.title}>Controle suas entradas e saidas com foco</h1>
            <p style={styles.subtitle} className="hero-subtitle">
              Acompanhe suas finanças em tempo real, com segurança e praticidade.
            </p>
            <div style={styles.heroStats} className="hero-stats">
              <div style={styles.heroStat}>
                <span style={styles.heroStatLabel}>Transacoes</span>
                <strong style={styles.heroStatValue}>{transactions.length}</strong>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatLabel}>Periodo exibido</span>
                <strong style={styles.heroStatValue}>
                  {monthFilter === 'todos' ? 'Todos os meses' : formatMonthLabel(monthFilter)}
                </strong>
              </div>
            </div>
          </div>

          <div style={styles.heroSide} className="hero-side">
            <div style={styles.userBox} className="premium-subcard user-session-card">
              <span style={styles.userLabel}>Sessao</span>
              <strong style={styles.userValue}>{user.email}</strong>
            </div>
            <button type="button" onClick={onSignOut} style={styles.secondaryButton} className="interactive-button signout-button">
              Sair
            </button>
          </div>
        </header>

        {error ? <div style={styles.alert} className="premium-card fade-up">{error}</div> : null}
        {notice ? (
          <div
            style={notice.type === 'success' ? styles.successAlert : styles.warningAlert}
            className="premium-card fade-up"
          >
            {notice.message}
          </div>
        ) : null}

        <section style={styles.grid4} className="summary-grid">
          <StatCard
            label="Saldo filtrado"
            value={formatCurrency(summary.saldo)}
            loading={loadingTransactions}
          />
          <StatCard
            label="Receitas"
            value={formatCurrency(summary.receitas)}
            green
            loading={loadingTransactions}
          />
          <StatCard
            label="Despesas"
            value={formatCurrency(summary.despesas)}
            red
            loading={loadingTransactions}
          />
          <StatCard
            label="Sincronizacao"
            value={syncStatus}
            small
            tone={syncTone}
            loading={loadingTransactions}
          />
        </section>

        <section style={styles.grid2} className="dashboard-chart-grid">
          <div style={styles.card} className="premium-card fade-up">
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Receitas vs despesas</h2>
                <p style={styles.cardSubtitle}>
                  Compare rapidamente a entrada e a saida do periodo filtrado.
                </p>
              </div>
            </div>
            {loadingTransactions ? (
              <ChartSkeleton />
            ) : comparisonData.every((item) => item.value === 0) ? (
              <ChartEmptyState
                title="Nada para comparar ainda"
                description="Quando houver receitas ou despesas no periodo, este comparativo aparecera aqui."
              />
            ) : (
              <div style={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} barSize={52}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                    <Tooltip contentStyle={tooltipStyle.content} labelStyle={tooltipStyle.label} formatter={(value) => [formatCurrency(value), 'Valor']} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {comparisonData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={styles.card} className="premium-card fade-up">
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Gastos por categoria</h2>
                <p style={styles.cardSubtitle}>
                  Entenda onde seu dinheiro esta sendo distribuido.
                </p>
              </div>
            </div>
            {loadingTransactions ? (
              <PieSkeleton />
            ) : expenseCategoryData.length === 0 ? (
              <ChartEmptyState
                title="Sem despesas categorizadas"
                description="Adicione despesas para visualizar a distribuicao por categoria neste grafico."
              />
            ) : (
              <div style={styles.pieWrap}>
                <div style={styles.chartBox}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={chartPalette[index % chartPalette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle.content} labelStyle={tooltipStyle.label} formatter={(value) => [formatCurrency(value), 'Gasto']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={styles.legendList}>
                  {expenseCategoryData.map((item, index) => (
                    <div key={item.name} style={styles.legendItem}>
                      <span style={styles.dot(chartPalette[index % chartPalette.length])} />
                      <span style={styles.legendName}>{item.icon} {item.name}</span>
                      <strong style={styles.legendValue}>{formatCurrency(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section style={styles.contentGrid} className="dashboard-content-grid">
          <aside style={styles.sidebar} className="dashboard-sidebar">
            <form onSubmit={handleSubmit} style={styles.formCard} className="premium-card fade-up transaction-form-card">
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.formEyebrow}>Movimentacao</span>
                  <h2 style={styles.cardTitle}>
                    {editingId ? 'Editar transacao' : 'Nova transacao'}
                  </h2>
                  <p style={styles.cardSubtitle}>
                    {editingId
                      ? 'Atualize os detalhes da movimentacao selecionada.'
                      : 'Adicione uma nova movimentacao ao seu painel.'}
                  </p>
                </div>
                {editingId ? (
                  <button type="button" onClick={resetForm} style={styles.ghostButton} className="interactive-button">
                    Cancelar
                  </button>
                ) : null}
              </div>

              <Field label="Descricao">
                <input name="description" value={form.description} onChange={handleChange} placeholder="Ex.: Mercado, salario, internet" style={styles.input} />
              </Field>

              <div style={styles.row}>
                <Field label="Valor">
                  <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} placeholder="0,00" style={styles.input} />
                </Field>
                <Field label="Tipo">
                  <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </Field>
              </div>

              <div style={styles.row}>
                <Field label="Categoria">
                  <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
                    {currentCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Data">
                  <input name="date" type="date" value={form.date} onChange={handleChange} style={styles.input} />
                </Field>
              </div>

              <button type="submit" style={styles.primaryButton(savingTransaction)} className="interactive-button">
                {savingTransaction
                  ? 'Salvando...'
                  : editingId
                    ? 'Salvar alteracoes'
                    : 'Salvar transacao'}
              </button>
            </form>

            <section style={styles.card} className="premium-card fade-up">
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Filtros</h2>
                  <p style={styles.cardSubtitle}>
                    Ajuste o recorte exibido no dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('todos')
                    setMonthFilter('todos')
                  }}
                  style={styles.ghostButton}
                  className="interactive-button"
                >
                  Limpar
                </button>
              </div>

              <div style={styles.filterSummary}>
                {activeFilters.length === 0 ? (
                  <span style={styles.filterHint}>Sem filtros ativos no momento.</span>
                ) : (
                  activeFilters.map((filter) => (
                    <span key={filter.label} style={styles.filterChip}>
                      {filter.label}
                    </span>
                  ))
                )}
              </div>

              <Field label="Tipo">
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={styles.input}>
                  <option value="todos">Todos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
              </Field>

              <Field label="Mes">
                <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} style={styles.input}>
                  <option value="todos">Todos os meses</option>
                  {monthOptions.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {formatMonthLabel(monthKey)}
                    </option>
                  ))}
                </select>
              </Field>
            </section>
          </aside>

          <section style={styles.card} className="premium-card fade-up dashboard-history">
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Historico mensal</h2>
                <p style={styles.muted}>
                  {loadingTransactions
                    ? 'Atualizando do Supabase...'
                    : `${filteredTransactions.length} transacoes encontradas`}
                </p>
              </div>
              <span style={styles.badge}>{typeFilter}</span>
            </div>

            {!hasTransactions && !loadingTransactions ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyOrb}>+</div>
                <div style={styles.emptyContent}>
                  <h3 style={styles.emptyTitle}>Seu painel esta pronto para comecar</h3>
                  <p style={styles.emptyDescription}>
                    Adicione sua primeira transacao para visualizar saldo, graficos e
                    historico mensal com mais contexto.
                  </p>
                  <div style={styles.emptySteps}>
                    <div style={styles.emptyStep}>
                      <span style={styles.emptyStepNumber}>1</span>
                      <span style={styles.emptyStepText}>Cadastre uma receita ou despesa</span>
                    </div>
                    <div style={styles.emptyStep}>
                      <span style={styles.emptyStepNumber}>2</span>
                      <span style={styles.emptyStepText}>Classifique por categoria e data</span>
                    </div>
                    <div style={styles.emptyStep}>
                      <span style={styles.emptyStepNumber}>3</span>
                      <span style={styles.emptyStepText}>Acompanhe a evolucao do mes no dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : loadingTransactions ? (
              <HistorySkeleton />
            ) : filteredTransactions.length === 0 ? (
              <div style={styles.empty}>
                Nenhuma transacao encontrada com os filtros atuais.
              </div>
            ) : (
              <div style={styles.groupList}>
                {Object.entries(groupedTransactions).map(([monthKey, items]) => (
                  <section key={monthKey} style={styles.monthCard} className="month-card">
                    <header style={styles.monthHeader}>
                      <div>
                        <h3 style={styles.monthTitle}>{formatMonthLabel(monthKey)}</h3>
                        <p style={styles.muted}>{items.length} lancamentos</p>
                      </div>
                      <span style={styles.monthBadge}>
                        {formatCurrency(
                          items.reduce(
                            (total, current) =>
                              total +
                              (current.type === 'receita'
                                ? Number(current.amount)
                                : -Number(current.amount)),
                            0,
                          ),
                        )}
                      </span>
                    </header>

                    <div style={styles.transactionList}>
                      {items.map((item) => {
                        const category = getCategoryMeta(item.type, item.category)
                        return (
                          <article key={item.id} style={styles.transactionItem} className="transaction-card">
                            <div style={styles.transactionLeft}>
                              <div style={styles.iconBubble}>{category.icon}</div>
                              <div>
                                <div style={styles.transactionTop}>
                                  <strong style={styles.transactionTitle}>{item.description}</strong>
                                  <span style={styles.typePill(item.type === 'receita')}>
                                    {item.type}
                                  </span>
                                </div>
                                <div style={styles.metaLine}>
                                  <span>{category.label}</span>
                                  <span>{formatShortDate(item.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div style={styles.transactionRight}>
                              <strong style={styles.amount(item.type === 'receita')}>
                                {item.type === 'receita' ? '+' : '-'} {formatCurrency(item.amount)}
                              </strong>
                              <div style={styles.actionRow}>
                                <button type="button" onClick={() => handleEdit(item)} style={styles.smallButton} className="interactive-button">
                                  Editar
                                </button>
                                <button type="button" onClick={() => handleDelete(item.id)} style={styles.deleteButton} className="interactive-button">
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  )
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  )
}

function StatCard({ label, value, green, red, small, tone, loading }) {
  return (
    <article style={{ ...styles.statCard, ...(tone || {}) }}>
      <span style={styles.statLabel}>{label}</span>
      {loading ? (
        <span
          style={{
            ...styles.skeletonLine,
            ...styles.skeletonPulse,
            width: small ? '70%' : '82%',
            height: small ? '22px' : '34px',
            borderRadius: '12px',
          }}
          className="skeleton-block"
        />
      ) : (
        <strong
          style={{
            ...styles.statValue,
            color: small ? '#7dd3fc' : green ? '#4ade80' : red ? '#f87171' : '#67e8f9',
            fontSize: small ? '1.15rem' : styles.statValue.fontSize,
            textTransform: small ? 'capitalize' : 'none',
          }}
        >
          {value}
        </strong>
      )}
    </article>
  )
}

function ChartSkeleton() {
  return (
    <div style={styles.chartSkeleton}>
      <div style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '18%', height: '68%' }} className="skeleton-block" />
      <div style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '18%', height: '88%' }} className="skeleton-block" />
      <div style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '18%', height: '54%' }} className="skeleton-block" />
      <div style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '18%', height: '76%' }} className="skeleton-block" />
    </div>
  )
}

function PieSkeleton() {
  return (
    <div style={styles.pieSkeletonWrap}>
      <div style={{ ...styles.pieSkeleton, ...styles.skeletonPulse }} className="skeleton-block" />
      <div style={styles.legendSkeletonList}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={styles.legendSkeletonItem}>
            <span style={{ ...styles.skeletonDot, ...styles.skeletonPulse }} className="skeleton-block" />
            <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '58%', height: '14px' }} className="skeleton-block" />
            <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '26%', height: '14px' }} className="skeleton-block" />
          </div>
        ))}
      </div>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div style={styles.groupList}>
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <section key={groupIndex} style={styles.monthCard} className="month-card">
          <header style={styles.monthHeader}>
            <div style={styles.skeletonColumn}>
              <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '180px', height: '20px' }} className="skeleton-block" />
              <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '110px', height: '14px' }} className="skeleton-block" />
            </div>
            <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '120px', height: '34px', borderRadius: '999px' }} className="skeleton-block" />
          </header>
          <div style={styles.transactionList}>
            {Array.from({ length: 3 }).map((_, itemIndex) => (
              <div key={itemIndex} style={styles.transactionItem}>
                <div style={styles.transactionLeft}>
                  <div style={{ ...styles.iconBubble, ...styles.skeletonPulse }} className="skeleton-block" />
                  <div style={styles.skeletonColumn}>
                    <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '220px', height: '18px' }} className="skeleton-block" />
                    <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '160px', height: '14px' }} className="skeleton-block" />
                  </div>
                </div>
                <div style={styles.transactionRight}>
                  <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '110px', height: '18px' }} className="skeleton-block" />
                  <div style={styles.actionRow}>
                    <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '74px', height: '34px' }} className="skeleton-block" />
                    <span style={{ ...styles.skeletonLine, ...styles.skeletonPulse, width: '74px', height: '34px' }} className="skeleton-block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function ChartEmptyState({ title, description }) {
  return (
    <div style={styles.chartEmpty}>
      <div style={styles.chartEmptyIcon}>~</div>
      <div style={styles.chartEmptyContent}>
        <strong style={styles.chartEmptyTitle}>{title}</strong>
        <p style={styles.chartEmptyDescription}>{description}</p>
      </div>
    </div>
  )
}

const tooltipStyle = {
  content: {
    background: 'rgba(9, 18, 33, 0.96)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '14px',
    color: '#e2e8f0',
  },
  label: { color: '#f8fafc' },
}

const cardBase = {
  background: 'rgba(9, 18, 33, 0.88)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: '24px',
  boxShadow: '0 22px 50px rgba(2, 6, 23, 0.34)',
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '36px 20px 48px',
    background:
      'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 28%), #07111f',
  },
  container: { maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '26px' },
  hero: { ...cardBase, display: 'flex', justifyContent: 'space-between', gap: '30px', flexWrap: 'wrap', padding: '36px', alignItems: 'flex-start' },
  kicker: { color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '12px', fontWeight: 700 },
  heroPill: { display: 'inline-flex', alignItems: 'center', width: 'fit-content', marginTop: '16px', padding: '9px 14px', borderRadius: '999px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(125,211,252,0.14)', color: '#cbe9ff', fontSize: '0.84rem', fontWeight: 600 },
  title: { margin: '22px 0 0', color: '#f8fafc', fontSize: 'clamp(2.5rem, 5vw, 4.4rem)', lineHeight: 0.96, maxWidth: '560px' },
  subtitle: { margin: '20px 0 0', color: '#94a3b8', lineHeight: 1.85, maxWidth: '520px', fontSize: '1.02rem' },
  heroStats: { display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '28px', maxWidth: '520px' },
  heroStat: { display: 'grid', gap: '6px', minWidth: '160px', padding: '14px 16px', borderRadius: '18px', background: 'rgba(15, 23, 42, 0.58)', border: '1px solid rgba(148,163,184,0.12)' },
  heroStatLabel: { color: '#7f93b3', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em' },
  heroStatValue: { color: '#eff6ff', fontSize: '1rem' },
  heroSide: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', alignSelf: 'flex-start', paddingTop: '6px' },
  userBox: { ...cardBase, padding: '14px 16px', background: 'rgba(15, 23, 42, 0.82)' },
  userLabel: { display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em' },
  userValue: { color: '#e2e8f0', fontSize: '0.9rem' },
  secondaryButton: { border: '1px solid rgba(148,163,184,0.2)', borderRadius: '16px', padding: '14px 18px', background: 'rgba(15,23,42,0.85)', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' },
  alert: { ...cardBase, padding: '14px 16px', background: 'rgba(127,29,29,0.18)', color: '#fca5a5' },
  successAlert: {
    ...cardBase,
    padding: '14px 16px',
    background: 'rgba(6, 95, 70, 0.18)',
    border: '1px solid rgba(52, 211, 153, 0.18)',
    color: '#a7f3d0',
  },
  warningAlert: {
    ...cardBase,
    padding: '14px 16px',
    background: 'rgba(127,29,29,0.18)',
    border: '1px solid rgba(248, 113, 113, 0.18)',
    color: '#fecaca',
  },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' },
  statCard: { ...cardBase, padding: '24px', display: 'grid', gap: '10px', background: 'linear-gradient(180deg, rgba(12,22,40,0.96), rgba(9,18,33,0.88))' },
  statLabel: { color: '#94a3b8', fontSize: '0.92rem' },
  statValue: { color: '#67e8f9', fontSize: '2rem', lineHeight: 1 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) minmax(0, 1fr)', gap: '20px', alignItems: 'start' },
  sidebar: { display: 'grid', gap: '20px' },
  card: { ...cardBase, padding: '26px', display: 'grid', gap: '20px', background: 'linear-gradient(180deg, rgba(11,20,36,0.96), rgba(9,18,33,0.88))' },
  formCard: { ...cardBase, padding: '28px', display: 'grid', gap: '22px', background: 'linear-gradient(180deg, rgba(13,25,45,0.98), rgba(9,18,33,0.9))', border: '1px solid rgba(103,232,249,0.12)', boxShadow: '0 28px 70px rgba(2, 6, 23, 0.42)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' },
  formEyebrow: { display: 'inline-block', marginBottom: '10px', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', fontWeight: 700 },
  cardTitle: { margin: 0, color: '#f8fafc', fontSize: '1.24rem', lineHeight: 1.2 },
  cardSubtitle: { margin: '8px 0 0', color: '#7f93b3', fontSize: '0.92rem', lineHeight: 1.65, maxWidth: '460px' },
  filterSummary: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  filterChip: { display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: '999px', background: 'rgba(37,99,235,0.16)', border: '1px solid rgba(125,211,252,0.14)', color: '#cbe9ff', fontSize: '0.84rem', fontWeight: 600 },
  filterHint: { color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 },
  chartBox: { width: '100%', height: '300px' },
  chartEmpty: { minHeight: '300px', display: 'grid', placeItems: 'center', gap: '16px', textAlign: 'center', padding: '28px', borderRadius: '22px', background: 'rgba(15,23,42,0.42)', border: '1px dashed rgba(148,163,184,0.18)' },
  chartEmptyIcon: { width: '56px', height: '56px', borderRadius: '18px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(20,184,166,0.12))', border: '1px solid rgba(125,211,252,0.12)', color: '#cbe9ff', fontSize: '1.4rem', fontWeight: 700 },
  chartEmptyContent: { display: 'grid', gap: '8px', maxWidth: '340px' },
  chartEmptyTitle: { color: '#f8fafc', fontSize: '1rem' },
  chartEmptyDescription: { color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.7 },
  pieWrap: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: '18px', alignItems: 'center' },
  pieSkeletonWrap: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: '18px', alignItems: 'center' },
  pieSkeleton: {
    width: '100%',
    maxWidth: '220px',
    aspectRatio: '1 / 1',
    borderRadius: '999px',
    margin: '0 auto',
    background: 'rgba(148,163,184,0.1)',
    border: '20px solid rgba(148,163,184,0.06)',
  },
  legendList: { display: 'grid', gap: '10px' },
  legendSkeletonList: { display: 'grid', gap: '10px' },
  legendItem: { display: 'grid', gridTemplateColumns: '12px minmax(0,1fr) auto', gap: '10px', alignItems: 'center', padding: '12px 14px', borderRadius: '16px', background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(148,163,184,0.08)' },
  legendSkeletonItem: { display: 'grid', gridTemplateColumns: '12px minmax(0,1fr) auto', gap: '10px', alignItems: 'center', padding: '12px 14px', borderRadius: '16px', background: 'rgba(15,23,42,0.42)', border: '1px solid rgba(148,163,184,0.08)' },
  dot: (background) => ({ width: '12px', height: '12px', borderRadius: '999px', background }),
  skeletonDot: { width: '12px', height: '12px', borderRadius: '999px', background: 'rgba(148,163,184,0.18)' },
  skeletonLine: { display: 'block', background: 'rgba(148,163,184,0.14)' },
  skeletonPulse: { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' },
  skeletonColumn: { display: 'grid', gap: '10px' },
  chartSkeleton: {
    height: '300px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '18px 6px 10px',
  },
  legendName: { color: '#cbd5e1', fontSize: '0.9rem' },
  legendValue: { color: '#f8fafc', fontSize: '0.88rem' },
  empty: { borderRadius: '18px', padding: '24px', textAlign: 'center', color: '#94a3b8', background: 'rgba(15,23,42,0.56)', border: '1px dashed rgba(148,163,184,0.24)' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' },
  field: { display: 'grid', gap: '8px' },
  label: { color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '14px', padding: '13px 14px', fontSize: '0.98rem', color: '#f8fafc', background: 'rgba(15,23,42,0.82)', outline: 'none' },
  primaryButton: (busy) => ({ border: 'none', borderRadius: '16px', padding: '14px 18px', background: busy ? 'rgba(51,65,85,0.92)' : 'linear-gradient(135deg, #2563eb, #0f766e)', color: '#eff6ff', fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }),
  ghostButton: { border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px', padding: '10px 14px', background: 'rgba(15,23,42,0.7)', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' },
  muted: { margin: '8px 0 0', color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 },
  badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: '999px', background: 'rgba(37,99,235,0.18)', color: '#93c5fd', fontSize: '0.84rem', fontWeight: 700, textTransform: 'capitalize', border: '1px solid rgba(125,211,252,0.12)' },
  syncBadgeDefault: {
    background: 'linear-gradient(180deg, rgba(12,22,40,0.96), rgba(9,18,33,0.88))',
  },
  syncBadgeLive: {
    background:
      'linear-gradient(180deg, rgba(7, 36, 33, 0.95), rgba(7, 27, 32, 0.88))',
    border: '1px solid rgba(52, 211, 153, 0.18)',
    boxShadow: '0 22px 50px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(52, 211, 153, 0.08)',
  },
  syncBadgeError: {
    background:
      'linear-gradient(180deg, rgba(47, 16, 24, 0.95), rgba(27, 10, 18, 0.88))',
    border: '1px solid rgba(248, 113, 113, 0.18)',
    boxShadow: '0 22px 50px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(248, 113, 113, 0.08)',
  },
  groupList: { display: 'grid', gap: '18px' },
  emptyState: {
    display: 'grid',
    gap: '20px',
    padding: '28px',
    borderRadius: '24px',
    background:
      'linear-gradient(180deg, rgba(12, 22, 40, 0.9), rgba(9, 18, 33, 0.82))',
    border: '1px solid rgba(148, 163, 184, 0.14)',
  },
  emptyOrb: {
    width: '54px',
    height: '54px',
    borderRadius: '18px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, rgba(37,99,235,0.24), rgba(20,184,166,0.18))',
    color: '#d7f9ff',
    fontSize: '1.5rem',
    fontWeight: 700,
    border: '1px solid rgba(125,211,252,0.12)',
    boxShadow: '0 18px 40px rgba(2, 6, 23, 0.28)',
  },
  emptyContent: {
    display: 'grid',
    gap: '12px',
  },
  emptyTitle: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '1.16rem',
  },
  emptyDescription: {
    color: '#94a3b8',
    lineHeight: 1.8,
    maxWidth: '560px',
  },
  emptySteps: {
    display: 'grid',
    gap: '10px',
    marginTop: '4px',
  },
  emptyStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '16px',
    background: 'rgba(15,23,42,0.56)',
    border: '1px solid rgba(148,163,184,0.1)',
  },
  emptyStepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(37,99,235,0.18)',
    color: '#93c5fd',
    fontSize: '0.82rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  emptyStepText: {
    color: '#cbd5e1',
    fontSize: '0.92rem',
    lineHeight: 1.5,
  },
  monthCard: { borderRadius: '24px', padding: '20px', background: 'linear-gradient(180deg, rgba(16,24,41,0.68), rgba(13,21,37,0.52))', border: '1px solid rgba(148,163,184,0.12)', display: 'grid', gap: '14px' },
  monthHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  monthTitle: { margin: 0, color: '#e2e8f0', fontSize: '1.05rem', textTransform: 'capitalize' },
  monthBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: '999px', background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.12)', color: '#d7f9ff', fontSize: '0.88rem', fontWeight: 700 },
  transactionList: { display: 'grid', gap: '12px' },
  transactionItem: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '14px', padding: '18px', borderRadius: '20px', background: 'rgba(9,18,33,0.92)', border: '1px solid rgba(148,163,184,0.14)' },
  transactionLeft: { display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: 0 },
  iconBubble: { width: '48px', height: '48px', borderRadius: '16px', display: 'grid', placeItems: 'center', fontSize: '1.3rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.24), rgba(20,184,166,0.16))', border: '1px solid rgba(125,211,252,0.12)', flexShrink: 0 },
  transactionTop: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  transactionTitle: { color: '#f8fafc', fontSize: '1rem', lineHeight: 1.35 },
  metaLine: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.85rem', marginTop: '10px' },
  typePill: (income) => ({ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', color: income ? '#86efac' : '#fca5a5', background: income ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)' }),
  transactionRight: { display: 'grid', justifyItems: 'end', alignContent: 'space-between', gap: '12px' },
  amount: (income) => ({ color: income ? '#4ade80' : '#f87171', fontSize: '1.02rem', lineHeight: 1.2 }),
  actionRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  smallButton: { border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '9px 12px', background: 'rgba(15,23,42,0.7)', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' },
  deleteButton: { border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '9px 12px', background: 'rgba(127,29,29,0.2)', color: '#fca5a5', fontWeight: 600, cursor: 'pointer' },
}

export default Dashboard
