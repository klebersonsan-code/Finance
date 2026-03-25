import { useEffect, useMemo, useRef, useState } from 'react'
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
import { groupTransactionsByMonth } from '../lib/transactions'

function Dashboard(props) {
  const {
    user,
    transactions,
    monthOptions,
    summary,
    expenseCategoryData,
    totalTransactions,
    typeFilter,
    monthFilter,
    onTypeFilterChange,
    onMonthFilterChange,
    onResetFilters,
    loadingTransactions,
    loadingMoreHistory,
    hasMoreHistory,
    onLoadMoreHistory,
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
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('inicio')
  const homeRef = useRef(null)
  const formRef = useRef(null)
  const historyRef = useRef(null)
  const chartsRef = useRef(null)
  const sheetRef = useRef(null)
  const descriptionInputRef = useRef(null)
  const lastFocusedRef = useRef(null)

  const groupedTransactions = useMemo(() => {
    return groupTransactionsByMonth(transactions, getMonthKey)
  }, [transactions])

  const currentCategories = categoryMap[form.type]
  const hasTransactions = totalTransactions > 0
  const activeFilters = [
    typeFilter !== 'todos'
      ? { label: `Tipo: ${typeFilter === 'receita' ? 'Receitas' : 'Despesas'}` }
      : null,
    monthFilter !== 'todos'
      ? { label: `Mes: ${formatMonthLabel(monthFilter)}` }
      : null,
  ].filter(Boolean)
  const balance = summary.receitas - summary.despesas
  const comparisonData = [
    { name: 'Receitas', value: summary.receitas, fill: '#34d399' },
    { name: 'Despesas', value: summary.despesas, fill: '#fb7185' },
  ]

  const expenseLegendData = useMemo(() => {
    return expenseCategoryData.map((item) => {
      const category = getCategoryMeta('despesa', item.category)
      return {
        name: category.label,
        value: Number(item.value),
        icon: category.icon,
      }
    })
  }, [expenseCategoryData])

  useEffect(() => {
    if (!isFormSheetOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lastFocusedRef.current = document.activeElement

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsFormSheetOpen(false)
        return
      }

      if (event.key === 'Tab' && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
        )
        const focusable = Array.from(focusableElements).filter(
          (element) => !element.hasAttribute('disabled'),
        )

        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => {
      descriptionInputRef.current?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (lastFocusedRef.current instanceof HTMLElement) {
        lastFocusedRef.current.focus()
      }
    }
  }, [isFormSheetOpen])

  function resetForm() {
    setForm(createFormInitialState())
    setEditingId(null)
  }

  function openTransactionSheet() {
    setActiveTab('adicionar')
    setIsFormSheetOpen(true)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function closeTransactionSheet() {
    setIsFormSheetOpen(false)
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

    if (success) {
      resetForm()
      closeTransactionSheet()
    }
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
    setActiveTab('adicionar')
    setIsFormSheetOpen(true)
  }

  async function handleDelete(id) {
    const success = await onDeleteTransaction(id)
    if (success && editingId === id) {
      resetForm()
    }
  }

  function scrollToSection(section, tab) {
    setActiveTab(tab)
    section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const transactionForm = (
    <form
      onSubmit={handleSubmit}
      style={styles.formCard}
      className="premium-card transaction-form-card transaction-sheet-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-sheet-title"
    >
      <div style={styles.sheetHandle} className="sheet-handle" />
      <div style={styles.cardHeader}>
        <div>
          <span style={styles.formEyebrow}>Movimentacao</span>
          <h2 id="transaction-sheet-title" style={styles.cardTitle}>
            {editingId ? 'Editar transacao' : 'Nova transacao'}
          </h2>
          <p style={styles.cardSubtitle}>
            {editingId
              ? 'Atualize os detalhes da movimentacao selecionada.'
              : 'Adicione uma nova movimentacao ao seu painel.'}
          </p>
        </div>
        <div style={styles.sheetHeaderActions}>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                resetForm()
                closeTransactionSheet()
              }}
              style={styles.ghostButton}
              className="interactive-button"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!editingId) resetForm()
              closeTransactionSheet()
            }}
            style={styles.closeButton}
            className="interactive-button"
            aria-label="Fechar formulario"
          >
            Fechar
          </button>
        </div>
      </div>

      <Field label="Descricao">
        <input
          ref={descriptionInputRef}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Ex.: Mercado, salario, internet"
          style={styles.input}
        />
      </Field>

      <div style={styles.row}>
        <Field label="Valor">
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0,00"
            style={styles.input}
          />
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
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={styles.input}
          >
            {currentCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data">
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>
      </div>

      <button
        type="submit"
        style={styles.primaryButton(savingTransaction)}
        className="interactive-button"
      >
        {savingTransaction
          ? 'Salvando...'
          : editingId
            ? 'Salvar alteracoes'
            : 'Salvar transacao'}
      </button>
    </form>
  )

  return (
    <main style={styles.page} className="dashboard-shell">
      <section style={styles.container} className="dashboard-container app-phone-shell">
        <header
          ref={homeRef}
          style={styles.appHeader}
          className="premium-card app-header-card fade-up"
        >
          <div style={styles.appHeaderTop}>
            <div>
              <span style={styles.kicker}>Finance Pro</span>
              <h1 style={styles.appTitle}>Seu dinheiro sob controle</h1>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              style={styles.headerAction}
              className="interactive-button"
            >
              Sair
            </button>
          </div>

          <div style={styles.balanceCard} className="premium-subcard">
            <div style={styles.balanceLayout} className="balance-layout">
              <div style={styles.balanceMain}>
                <span style={styles.balanceLabel}>Saldo disponivel</span>
                <strong style={styles.balanceValue}>{formatCurrency(balance)}</strong>
                <p style={styles.balanceCopy}>
                  {'Acompanhe suas finan\u00E7as em tempo real, com seguran\u00E7a e praticidade.'}
                </p>
              </div>
              <div style={styles.balanceSide}>
                <div style={styles.balanceTop}>
                  <span style={styles.syncPill(syncStatus)}>
                    {syncStatus === 'tempo real ativo' ? 'Ao vivo' : syncStatus}
                  </span>
                </div>
                <div style={styles.quickActionRow}>
                  <button
                    type="button"
                    onClick={openTransactionSheet}
                    style={styles.primaryQuickAction}
                    className="interactive-button primary-cta"
                  >
                    Nova transacao
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection(historyRef, 'historico')}
                    style={styles.secondaryQuickAction}
                    className="interactive-button secondary-cta"
                  >
                    Ver historico
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {error ? <div style={styles.alert} className="premium-card fade-up">{error}</div> : null}
        {notice ? (
          <div
            style={notice.type === 'success' ? styles.toastSuccess : styles.toastWarning}
            className="premium-card toast-card"
            role="status"
            aria-live="polite"
          >
            <span style={styles.toastIcon}>{notice.type === 'success' ? '✓' : '!'}</span>
            <div style={styles.toastContent}>
              <strong style={styles.toastTitle}>
                {notice.type === 'success' ? 'Transacao atualizada' : 'Algo precisa de atencao'}
              </strong>
              <span style={styles.toastMessage}>{notice.message}</span>
            </div>
          </div>
        ) : null}

        <section style={styles.summaryGrid} className="summary-grid">
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
            label="Periodo"
            value={monthFilter === 'todos' ? 'Geral' : formatMonthLabel(monthFilter)}
            small
            loading={loadingTransactions}
          />
          <StatCard
            label="Transacoes"
            value={String(totalTransactions)}
            small
            loading={loadingTransactions}
          />
        </section>

        <section ref={chartsRef} style={styles.grid2} className="dashboard-chart-grid">
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
            ) : expenseLegendData.length === 0 ? (
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
                        data={expenseLegendData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {expenseLegendData.map((entry, index) => (
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
                  {expenseLegendData.map((item, index) => (
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
            <section
              ref={formRef}
              style={styles.formLauncherCard}
              className="premium-card fade-up transaction-form-card"
            >
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.formEyebrow}>Movimentacao</span>
                  <h2 style={styles.cardTitle}>Nova transacao</h2>
                  <p style={styles.cardSubtitle}>
                    Abra um fluxo rapido para registrar receitas e despesas sem sair
                    da tela principal.
                  </p>
                </div>
              </div>

              <div style={styles.formLauncherBody}>
                <div style={styles.formLauncherPreview}>
                  <span style={styles.formLauncherBadge}>
                    {editingId ? 'Edicao pronta' : 'Fluxo rapido'}
                  </span>
                  <strong style={styles.formLauncherTitle}>
                    {editingId
                      ? 'Continue a edicao da transacao selecionada'
                      : 'Adicione uma movimentacao em poucos toques'}
                  </strong>
                  <p style={styles.formLauncherText}>
                    Categoria, valor e data ficam organizados em um modal com foco total.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openTransactionSheet}
                  style={styles.launcherButton}
                  className="interactive-button primary-cta"
                >
                  {editingId ? 'Continuar edicao' : 'Nova transacao'}
                </button>
              </div>
            </section>

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
                    onResetFilters()
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
                <select
                  value={typeFilter}
                  onChange={(event) => onTypeFilterChange(event.target.value)}
                  style={styles.input}
                >
                  <option value="todos">Todos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
              </Field>

              <Field label="Mes">
                <select
                  value={monthFilter}
                  onChange={(event) => onMonthFilterChange(event.target.value)}
                  style={styles.input}
                >
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

          <section
            ref={historyRef}
            style={styles.historyCard}
            className="premium-card fade-up dashboard-history"
          >
            <div style={styles.cardHeader}>
              <div>
                <span style={styles.historyEyebrow}>Historico</span>
                <h2 style={styles.cardTitle}>Historico mensal</h2>
                <p style={styles.muted}>
                  {loadingTransactions
                    ? 'Atualizando do Supabase...'
                    : `${totalTransactions} transacoes encontradas`}
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
            ) : totalTransactions === 0 ? (
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
                          <article
                            key={item.id}
                            style={styles.transactionItem}
                            className="transaction-card list-item-rise"
                          >
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

            {!loadingTransactions && hasMoreHistory ? (
              <button
                type="button"
                onClick={onLoadMoreHistory}
                style={styles.loadMoreButton(loadingMoreHistory)}
                className="interactive-button"
              >
                {loadingMoreHistory ? 'Carregando mais...' : 'Carregar mais historico'}
              </button>
            ) : null}
          </section>
        </section>

        <button
          type="button"
          onClick={openTransactionSheet}
          style={styles.fabButton}
          className="interactive-button app-fab"
        >
          +
        </button>

        <nav style={styles.bottomNav} className="app-bottom-nav">
          <button
            type="button"
            onClick={() => scrollToSection(homeRef, 'inicio')}
            style={styles.navButton(activeTab === 'inicio')}
          >
            <span style={styles.navIcon}>Inicio</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(historyRef, 'historico')}
            style={styles.navButton(activeTab === 'historico')}
          >
            <span style={styles.navIcon}>Historico</span>
          </button>
          <button
            type="button"
            onClick={openTransactionSheet}
            style={styles.navButton(activeTab === 'adicionar')}
          >
            <span style={styles.navIcon}>Adicionar</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(chartsRef, 'perfil')}
            style={styles.navButton(activeTab === 'perfil')}
          >
            <span style={styles.navIcon}>Analises</span>
          </button>
        </nav>

        {isFormSheetOpen ? (
          <div
            style={styles.sheetOverlay}
            className="sheet-overlay"
            onClick={closeTransactionSheet}
          >
            <div
            style={styles.sheetWrapper}
            className="sheet-wrapper"
            ref={sheetRef}
            onClick={(event) => event.stopPropagation()}
          >
              {transactionForm}
            </div>
          </div>
        ) : null}
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
    padding: '32px 20px 48px',
    background:
      'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 26%), #07111f',
  },
  container: { maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '22px', position: 'relative' },
  appHeader: { ...cardBase, display: 'grid', gap: '18px', padding: '28px', background: 'linear-gradient(180deg, rgba(10,19,35,0.98), rgba(8,16,31,0.92))', border: '1px solid rgba(103,232,249,0.1)' },
  appHeaderTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' },
  kicker: { color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '12px', fontWeight: 700 },
  appTitle: { margin: '8px 0 0', color: '#f8fafc', fontSize: '1.3rem', lineHeight: 1.1 },
  headerAction: { border: '1px solid rgba(148,163,184,0.16)', borderRadius: '14px', padding: '10px 14px', background: 'rgba(15,23,42,0.72)', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' },
  balanceCard: { ...cardBase, padding: '18px', background: 'linear-gradient(135deg, rgba(20,33,58,0.95), rgba(9,18,33,0.92))', border: '1px solid rgba(103,232,249,0.14)' },
  balanceLayout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, 0.8fr)', gap: '18px', alignItems: 'start' },
  balanceMain: { display: 'grid', gap: '10px', maxWidth: '420px' },
  balanceSide: { display: 'grid', gap: '14px', justifyItems: 'stretch' },
  balanceTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: '14px' },
  balanceLabel: { display: 'block', color: '#8fb4d8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em' },
  balanceValue: { display: 'block', marginTop: '6px', color: '#f8fafc', fontSize: '2.1rem', lineHeight: 1, letterSpacing: '-0.04em' },
  balanceCopy: { margin: '0', color: '#9ab0c8', lineHeight: 1.7, fontSize: '0.92rem', maxWidth: '320px' },
  syncPill: (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '0.76rem',
    fontWeight: 700,
    color:
      status === 'tempo real ativo'
        ? '#a7f3d0'
        : status === 'erro'
          ? '#fecaca'
          : '#cbe9ff',
    background:
      status === 'tempo real ativo'
        ? 'rgba(6,95,70,0.22)'
        : status === 'erro'
          ? 'rgba(127,29,29,0.24)'
          : 'rgba(37,99,235,0.18)',
    border:
      status === 'tempo real ativo'
        ? '1px solid rgba(52,211,153,0.2)'
        : status === 'erro'
          ? '1px solid rgba(248,113,113,0.2)'
          : '1px solid rgba(125,211,252,0.14)',
    textTransform: 'capitalize',
  }),
  quickActionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  primaryQuickAction: { border: 'none', borderRadius: '16px', padding: '14px 16px', background: 'linear-gradient(135deg, #2563eb, #0f766e)', color: '#eff6ff', fontWeight: 700, cursor: 'pointer' },
  secondaryQuickAction: { border: '1px solid rgba(148,163,184,0.16)', borderRadius: '16px', padding: '14px 16px', background: 'rgba(15,23,42,0.72)', color: '#dce9f8', fontWeight: 700, cursor: 'pointer' },
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
  toastBase: { position: 'fixed', top: '22px', right: '22px', width: 'min(380px, calc(100vw - 28px))', display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '14px', alignItems: 'start', padding: '16px 18px', zIndex: 55, backdropFilter: 'blur(18px)', boxShadow: '0 26px 64px rgba(2, 6, 23, 0.42)' },
  toastSuccess: { ...cardBase, position: 'fixed', top: '22px', right: '22px', width: 'min(380px, calc(100vw - 28px))', display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '14px', alignItems: 'start', padding: '16px 18px', zIndex: 55, background: 'rgba(6, 95, 70, 0.2)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#d1fae5', backdropFilter: 'blur(18px)', boxShadow: '0 26px 64px rgba(2, 6, 23, 0.42)' },
  toastWarning: { ...cardBase, position: 'fixed', top: '22px', right: '22px', width: 'min(380px, calc(100vw - 28px))', display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '14px', alignItems: 'start', padding: '16px 18px', zIndex: 55, background: 'rgba(127,29,29,0.22)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#fee2e2', backdropFilter: 'blur(18px)', boxShadow: '0 26px 64px rgba(2, 6, 23, 0.42)' },
  toastIcon: { width: '34px', height: '34px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.08)', color: 'currentColor', fontWeight: 800, fontSize: '1rem', flexShrink: 0 },
  toastContent: { display: 'grid', gap: '4px', minWidth: 0 },
  toastTitle: { color: '#f8fafc', fontSize: '0.95rem', lineHeight: 1.2 },
  toastMessage: { color: 'inherit', fontSize: '0.9rem', lineHeight: 1.55 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' },
  statCard: { ...cardBase, padding: '18px', display: 'grid', gap: '10px', background: 'linear-gradient(180deg, rgba(12,22,40,0.96), rgba(9,18,33,0.88))', minHeight: '112px' },
  statLabel: { color: '#7f93b3', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.1em' },
  statValue: { color: '#67e8f9', fontSize: '1.28rem', lineHeight: 1.1 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) minmax(0, 1fr)', gap: '20px', alignItems: 'start' },
  sidebar: { display: 'grid', gap: '20px' },
  card: { ...cardBase, padding: '22px', display: 'grid', gap: '18px', background: 'linear-gradient(180deg, rgba(11,20,36,0.96), rgba(9,18,33,0.88))' },
  formCard: { ...cardBase, padding: '28px', display: 'grid', gap: '22px', background: 'linear-gradient(180deg, rgba(13,25,45,0.98), rgba(9,18,33,0.9))', border: '1px solid rgba(103,232,249,0.12)', boxShadow: '0 28px 70px rgba(2, 6, 23, 0.42)' },
  formLauncherCard: { ...cardBase, padding: '24px', display: 'grid', gap: '18px', background: 'linear-gradient(180deg, rgba(13,25,45,0.98), rgba(9,18,33,0.9))', border: '1px solid rgba(103,232,249,0.12)', boxShadow: '0 28px 70px rgba(2, 6, 23, 0.32)' },
  formLauncherBody: { display: 'grid', gap: '16px' },
  formLauncherPreview: { display: 'grid', gap: '10px', padding: '18px', borderRadius: '20px', background: 'linear-gradient(180deg, rgba(8,16,31,0.72), rgba(11,20,36,0.4))', border: '1px solid rgba(148,163,184,0.1)' },
  formLauncherBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', padding: '7px 11px', borderRadius: '999px', background: 'rgba(37,99,235,0.16)', border: '1px solid rgba(125,211,252,0.14)', color: '#cbe9ff', fontSize: '0.78rem', fontWeight: 700 },
  formLauncherTitle: { color: '#f8fafc', fontSize: '1rem', lineHeight: 1.35 },
  formLauncherText: { color: '#8ea1bf', fontSize: '0.9rem', lineHeight: 1.7 },
  launcherButton: { border: 'none', borderRadius: '18px', padding: '15px 18px', background: 'linear-gradient(135deg, #2563eb, #0f766e)', color: '#eff6ff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 20px 40px rgba(2, 6, 23, 0.24)' },
  historyCard: { ...cardBase, padding: '28px', display: 'grid', gap: '22px', background: 'linear-gradient(180deg, rgba(12,22,40,0.98), rgba(9,18,33,0.9))', border: '1px solid rgba(148,163,184,0.14)', boxShadow: '0 26px 64px rgba(2, 6, 23, 0.38)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' },
  sheetHeaderActions: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  sheetHandle: { width: '56px', height: '5px', borderRadius: '999px', background: 'rgba(148,163,184,0.32)', margin: '0 auto 4px' },
  formEyebrow: { display: 'inline-block', marginBottom: '10px', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', fontWeight: 700 },
  historyEyebrow: { display: 'inline-block', marginBottom: '10px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', fontWeight: 700 },
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
  closeButton: { border: '1px solid rgba(148,163,184,0.18)', borderRadius: '12px', padding: '10px 14px', background: 'rgba(8,16,31,0.76)', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' },
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
  monthCard: { borderRadius: '24px', padding: '22px', background: 'linear-gradient(180deg, rgba(17,27,46,0.76), rgba(12,20,36,0.56))', border: '1px solid rgba(148,163,184,0.12)', display: 'grid', gap: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' },
  monthHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingBottom: '2px' },
  monthTitle: { margin: 0, color: '#f8fafc', fontSize: '1.08rem', textTransform: 'capitalize' },
  monthBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '9px 13px', borderRadius: '999px', background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(125,211,252,0.12)', color: '#d7f9ff', fontSize: '0.88rem', fontWeight: 700 },
  transactionList: { display: 'grid', gap: '12px' },
  transactionItem: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '14px', padding: '18px', borderRadius: '20px', background: 'linear-gradient(180deg, rgba(9,18,33,0.96), rgba(10,20,37,0.88))', border: '1px solid rgba(148,163,184,0.14)', boxShadow: '0 14px 28px rgba(2, 6, 23, 0.2)' },
  transactionLeft: { display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: 0 },
  iconBubble: { width: '48px', height: '48px', borderRadius: '16px', display: 'grid', placeItems: 'center', fontSize: '1.3rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.24), rgba(20,184,166,0.16))', border: '1px solid rgba(125,211,252,0.12)', flexShrink: 0 },
  transactionTop: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  transactionTitle: { color: '#f8fafc', fontSize: '1rem', lineHeight: 1.35, letterSpacing: '-0.01em' },
  metaLine: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.85rem', marginTop: '10px' },
  typePill: (income) => ({ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', color: income ? '#86efac' : '#fca5a5', background: income ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)' }),
  transactionRight: { display: 'grid', justifyItems: 'end', alignContent: 'space-between', gap: '12px' },
  amount: (income) => ({ color: income ? '#4ade80' : '#f87171', fontSize: '1.02rem', lineHeight: 1.2 }),
  actionRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  smallButton: { border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '9px 12px', background: 'rgba(15,23,42,0.7)', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' },
  deleteButton: { border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '9px 12px', background: 'rgba(127,29,29,0.2)', color: '#fca5a5', fontWeight: 600, cursor: 'pointer' },
  loadMoreButton: (loading) => ({ justifySelf: 'center', width: 'min(280px, 100%)', border: '1px solid rgba(125,211,252,0.16)', borderRadius: '16px', padding: '13px 18px', background: loading ? 'rgba(30,41,59,0.9)' : 'rgba(15,23,42,0.8)', color: '#d7f9ff', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }),
  sheetOverlay: { position: 'fixed', inset: 0, padding: '24px', background: 'rgba(2, 6, 23, 0.64)', backdropFilter: 'blur(12px)', display: 'grid', alignItems: 'center', justifyItems: 'center', zIndex: 40 },
  sheetWrapper: { width: 'min(560px, 100%)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', padding: 0 },
  fabButton: { position: 'fixed', right: 'max(18px, calc(50% - 222px))', bottom: '90px', width: '56px', height: '56px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #0f766e)', color: '#fff', fontSize: '2rem', lineHeight: 1, boxShadow: '0 20px 40px rgba(2, 6, 23, 0.35)', cursor: 'pointer', zIndex: 25 },
  bottomNav: { position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: '18px', width: 'min(460px, calc(100% - 24px))', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '10px', borderRadius: '24px', background: 'rgba(8,16,31,0.92)', border: '1px solid rgba(148,163,184,0.14)', backdropFilter: 'blur(18px)', boxShadow: '0 20px 40px rgba(2, 6, 23, 0.45)', zIndex: 20 },
  navButton: (active) => ({ border: 'none', borderRadius: '16px', padding: '12px 8px', background: active ? 'rgba(37,99,235,0.18)' : 'transparent', color: active ? '#eff6ff' : '#8ea1bf', fontWeight: 700, cursor: 'pointer' }),
  navIcon: { fontSize: '0.76rem', letterSpacing: '0.02em' },
}

export default Dashboard
