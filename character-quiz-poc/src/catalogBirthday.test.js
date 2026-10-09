import assert from 'node:assert/strict'
import test from 'node:test'
import { birthdayMonthDay, initialBirthdayFilter, localDateString } from './catalogBirthday.js'

test('birthday matches month/day without depending on year', () => {
  assert.equal(birthdayMonthDay('2026-10-09'), '10-09')
  assert.equal(birthdayMonthDay('2024-02-29'), '02-29')
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-1', '', null, ['2026-10-09']]) {
    assert.throws(() => birthdayMonthDay(value), /valid date/)
  }
})

test('bare catalog defaults to birthdays while filtered links remain unrestricted', () => {
  assert.equal(initialBirthdayFilter(new URLSearchParams()), true)
  assert.equal(initialBirthdayFilter(new URLSearchParams('studio=ufotable')), false)
  assert.equal(initialBirthdayFilter(new URLSearchParams('trait=tsundere')), false)
  assert.equal(initialBirthdayFilter(new URLSearchParams('birthday=all')), false)
  assert.equal(initialBirthdayFilter(new URLSearchParams('birthday=today&studio=ufotable')), true)
  assert.equal(localDateString(new Date(2026, 0, 2, 23, 30)), '2026-01-02')
})
