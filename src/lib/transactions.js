export const HISTORY_PAGE_SIZE = 20

export function normalizeFilterValue(value) {
  return value === 'todos' ? null : value
}

export function buildRpcFilterParams(typeFilter, monthFilter) {
  return {
    p_type_filter: normalizeFilterValue(typeFilter),
    p_month_filter: normalizeFilterValue(monthFilter),
  }
}

export function sortTransactions(items) {
  return [...items].sort((a, b) =>
    `${b.date}-${b.created_at || ''}-${b.id}`.localeCompare(
      `${a.date}-${a.created_at || ''}-${a.id}`,
    ),
  )
}

export function matchesTransactionFilters(item, typeFilter, monthFilter) {
  if (!item) return false
  if (typeFilter !== 'todos' && item.type !== typeFilter) return false
  if (monthFilter !== 'todos' && !String(item.date).startsWith(monthFilter)) return false
  return true
}

export function mergeTransactionIntoHistory(
  currentItems,
  nextItem,
  { typeFilter, monthFilter, loadedCount },
) {
  const withoutCurrent = currentItems.filter((item) => item.id !== nextItem.id)

  if (!matchesTransactionFilters(nextItem, typeFilter, monthFilter)) {
    return withoutCurrent
  }

  return sortTransactions([...withoutCurrent, nextItem]).slice(0, loadedCount)
}

export function removeTransactionFromHistory(currentItems, id) {
  return currentItems.filter((item) => item.id !== id)
}

export function groupTransactionsByMonth(items, getMonthKey) {
  return items.reduce((groups, item) => {
    const monthKey = getMonthKey(item.date)
    if (!groups[monthKey]) groups[monthKey] = []
    groups[monthKey].push(item)
    return groups
  }, {})
}
