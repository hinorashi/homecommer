export const CHARACTER_ROLE_OPTIONS = [
  { value: 'main', label: 'Nhân vật chính' },
  { value: 'supporting', label: 'Nhân vật phụ' },
  { value: 'background', label: 'Nhân vật nền' },
]

export const CHARACTER_GENDER_OPTIONS = [
  { value: 'female', label: 'Nữ' },
  { value: 'male', label: 'Nam' },
  { value: 'other', label: 'Khác' },
  { value: 'unknown', label: 'Chưa rõ' },
]

export const CHARACTER_SORT_OPTIONS = [
  { value: 'favourites', label: 'Được yêu thích nhất' },
  { value: 'name', label: 'Tên A → Z' },
]

export const DEFAULT_CHARACTER_SORT = 'favourites'

const ROLE_LABELS = { MAIN: 'Chính', SUPPORTING: 'Phụ', BACKGROUND: 'Nền' }

export function roleLabel(role) {
  return role ? ROLE_LABELS[role] ?? role : null
}

export function genderLabel(gender) {
  if (!gender) return null
  const normalized = gender.trim().toLowerCase()
  if (normalized === 'male') return 'Nam'
  if (normalized === 'female') return 'Nữ'
  if (normalized === 'unknown' || !normalized) return null
  return gender
}
