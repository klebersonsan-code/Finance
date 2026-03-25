export const categoryMap = {
  receita: [
    { value: 'salario', label: 'Salario', icon: '\u{1F4BC}' },
    { value: 'freelance', label: 'Freelance', icon: '\u{1F9D1}\u200D\u{1F4BB}' },
    { value: 'investimentos', label: 'Investimentos', icon: '\u{1F4C8}' },
    { value: 'vendas', label: 'Vendas', icon: '\u{1F6CD}\uFE0F' },
  ],
  despesa: [
    { value: 'moradia', label: 'Moradia', icon: '\u{1F3E0}' },
    { value: 'alimentacao', label: 'Alimentacao', icon: '\u{1F354}' },
    { value: 'transporte', label: 'Transporte', icon: '\u{1F697}' },
    { value: 'lazer', label: 'Lazer', icon: '\u{1F3AC}' },
    { value: 'saude', label: 'Saude', icon: '\u{1F48A}' },
    { value: 'contas', label: 'Contas', icon: '\u{1F4A1}' },
  ],
}

export const chartPalette = [
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
  '#f87171',
]

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function getDefaultCategory(type) {
  return categoryMap[type][0].value
}

export function createFormInitialState() {
  return {
    description: '',
    amount: '',
    type: 'receita',
    category: getDefaultCategory('receita'),
    date: new Date().toISOString().slice(0, 10),
  }
}

export function getCategoryMeta(type, categoryValue) {
  return (
    categoryMap[type].find((category) => category.value === categoryValue) ||
    categoryMap[type][0]
  )
}

export function getMonthKey(date) {
  return date.slice(0, 7)
}

export function formatMonthLabel(monthKey) {
  return monthFormatter.format(new Date(`${monthKey}-01T00:00:00Z`))
}

export function formatShortDate(date) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`))
}

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}
