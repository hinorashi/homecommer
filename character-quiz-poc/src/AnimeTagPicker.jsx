import { useId, useMemo, useState } from 'react'
import { Plus, Tag, X } from 'lucide-react'

const SUGGESTION_LIMIT = 10

/** Autocomplete picker for AniList anime tags (Youkai, Ninja, Isekai...). */
export default function AnimeTagPicker({ tags, selected, onToggle }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
  const byId = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])

  const suggestions = useMemo(() => {
    const query = input.trim().toLocaleLowerCase('en')
    return tags
      .filter((tag) => !selected.includes(tag.id))
      .filter((tag) => !query || tag.name.toLocaleLowerCase('en').includes(query) || tag.category?.toLocaleLowerCase('en').includes(query))
      .sort((left, right) => {
        if (!query) return 0
        const leftStarts = left.name.toLocaleLowerCase('en').startsWith(query)
        const rightStarts = right.name.toLocaleLowerCase('en').startsWith(query)
        return leftStarts === rightStarts ? 0 : leftStarts ? -1 : 1
      })
      .slice(0, SUGGESTION_LIMIT)
  }, [tags, selected, input])

  function choose(tag) {
    onToggle(tag.id)
    setInput('')
    setActiveIndex(0)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      if (open && suggestions[activeIndex]) {
        event.preventDefault()
        choose(suggestions[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    } else if (event.key === 'Backspace' && !input && selected.length) {
      onToggle(selected[selected.length - 1])
    }
  }

  return (
    <div className="tag-picker">
      <span className="tag-picker-label"><Tag size={13} /> Tag anime</span>
      <div className="tag-picker-box">
        {selected.map((id) => (
          <button type="button" key={id} className="tag-picker-chip" onClick={() => onToggle(id)} title="Bỏ tag này">
            {byId.get(id)?.name ?? id} <X size={11} />
          </button>
        ))}
        <div className="tag-picker-input">
          <input
            type="text"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label="Thêm tag anime"
            placeholder={selected.length ? 'Thêm tag...' : 'Youkai, Ninja, Isekai, Time Skip...'}
            value={input}
            onChange={(event) => { setInput(event.target.value); setOpen(true); setActiveIndex(0) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
          />
          {open && suggestions.length ? (
            <ul className="tag-picker-suggestions" id={listId} role="listbox">
              {suggestions.map((tag, index) => (
                <li
                  key={tag.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? 'is-active' : ''}
                  onMouseDown={(event) => { event.preventDefault(); choose(tag) }}
                  onMouseEnter={() => setActiveIndex(index)}
                  title={tag.description ?? undefined}
                >
                  <Plus size={12} aria-hidden="true" />
                  <span className="tag-picker-name">{tag.name}{tag.spoiler ? <em>spoiler</em> : null}</span>
                  <small>{tag.category}</small>
                  <b>{tag.seriesCount}</b>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
