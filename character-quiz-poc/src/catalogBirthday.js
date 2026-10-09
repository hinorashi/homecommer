export function localDateString(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function birthdayMonthDay(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('birthdayDate must be a valid date in YYYY-MM-DD format.')
  }
  const parsed = new Date(`${date}T12:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('birthdayDate must be a valid date in YYYY-MM-DD format.')
  }
  return date.slice(5)
}

export function initialBirthdayFilter(params) {
  return params.get('birthday') === 'today' || params.size === 0
}
