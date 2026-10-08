import { useEffect, useId, useRef, useState } from 'react'
import { Clapperboard, Search, UserRound, X } from 'lucide-react'
import { FORMAT_LABELS } from './animeLabels'

const MIN_QUERY = 2
const DEBOUNCE_MS = 200

/** Global quick search in the top bar: one query, two grouped result panes (Anime | Nhân vật). */
export default function QuickSearch({ onNavigate }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ query: '', anime: [], characters: [], animeTotal: 0, characterTotal: 0, loading: false, error: '' })
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const rootRef = useRef(null)
  const listId = useId()
  const query = input.trim()

  useEffect(() => {
    if (query.length < MIN_QUERY) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setState((current) => ({ ...current, loading: true, error: '' }))
      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`, { signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json()
          if (!response.ok) throw new Error(payload.error ?? `Search API returned ${response.status}`)
          setState({ ...payload, query, loading: false, error: '' })
          setActiveIndex(0)
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setState((current) => ({ ...current, loading: false, error: error.message }))
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  const ready = query.length >= MIN_QUERY && state.query === query
  const items = ready ? [
    ...state.anime.map((anime) => ({ key: `a:${anime.id}`, path: `/anime/${encodeURIComponent(anime.id)}` })),
    ...state.characters.map((character) => ({ key: `c:${character.id}`, path: `/character/${encodeURIComponent(character.id)}` })),
  ] : []
  const indexOf = (key) => items.findIndex((item) => item.key === key)

  function go(path) {
    setOpen(false)
    inputRef.current?.blur()
    onNavigate(path)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (items[activeIndex]) go(items[activeIndex].path)
      else if (query) go(`/characters?q=${encodeURIComponent(query)}`)
    } else if (event.key === 'Escape') {
      if (open) setOpen(false)
      else setInput('')
    }
  }

  const showPanel = open && query.length >= MIN_QUERY
  const option = (key, path, content, className) => {
    const index = indexOf(key)
    return (
      <li
        key={key}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={index === activeIndex}
        className={`quick-search-item ${className}${index === activeIndex ? ' is-active' : ''}`}
        onMouseEnter={() => setActiveIndex(index)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => go(path)}
      >
        {content}
      </li>
    )
  }

  return (
    <div className="quick-search" ref={rootRef}>
      <div className="quick-search-box">
        <Search size={15} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Tìm nhanh anime và nhân vật"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && items[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          placeholder="Tìm anime, nhân vật..."
          maxLength={100}
          value={input}
          onChange={(event) => { setInput(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {input ? (
          <button type="button" className="quick-search-clear" aria-label="Xóa nội dung tìm" onClick={() => { setInput(''); inputRef.current?.focus() }}>
            <X size={13} />
          </button>
        ) : <kbd aria-hidden="true">/</kbd>}
      </div>

      {showPanel ? (
        <div className="quick-search-panel" role="listbox" id={listId} aria-label="Kết quả tìm nhanh">
          {!ready ? <p className="quick-search-note">{state.error || 'Đang tìm...'}</p> : (
            <div className="quick-search-columns">
              <section className="quick-search-column" aria-label="Anime">
                <h3><Clapperboard size={13} /> Anime <span>{state.animeTotal}</span></h3>
                {state.anime.length ? (
                  <ul>
                    {state.anime.map((anime) => option(`a:${anime.id}`, `/anime/${encodeURIComponent(anime.id)}`, (
                      <>
                        <span className="quick-search-thumb is-cover">{anime.coverImage ? <img src={anime.coverImage} alt="" loading="lazy" /> : null}</span>
                        <span className="quick-search-text">
                          <strong>{anime.title}</strong>
                          <small>{[FORMAT_LABELS[anime.format] ?? anime.format, anime.seasonYear, anime.averageScore ? `★ ${anime.averageScore}%` : null].filter(Boolean).join(' · ')}</small>
                        </span>
                      </>
                    ), 'is-anime'))}
                  </ul>
                ) : <p className="quick-search-note">Không có anime khớp tên.</p>}
                {state.animeTotal ? (
                  <button type="button" className="quick-search-more" onMouseDown={(event) => event.preventDefault()} onClick={() => go(`/anime?q=${encodeURIComponent(query)}`)}>
                    Xem tất cả {state.animeTotal} anime →
                  </button>
                ) : null}
              </section>
              <section className="quick-search-column" aria-label="Nhân vật">
                <h3><UserRound size={13} /> Nhân vật <span>{state.characterTotal}</span></h3>
                {state.characters.length ? (
                  <ul>
                    {state.characters.map((character) => option(`c:${character.id}`, `/character/${encodeURIComponent(character.id)}`, (
                      <>
                        <span className="quick-search-thumb">{character.imageUrl ? <img src={character.imageUrl} alt="" loading="lazy" /> : character.name.slice(0, 1)}</span>
                        <span className="quick-search-text">
                          <strong>{character.name}</strong>
                          <small>{character.primarySeries?.title ?? character.series}</small>
                        </span>
                      </>
                    ), 'is-character'))}
                  </ul>
                ) : <p className="quick-search-note">Không có nhân vật khớp tên.</p>}
                <button type="button" className="quick-search-more" onMouseDown={(event) => event.preventDefault()} onClick={() => go(`/characters?q=${encodeURIComponent(query)}`)}>
                  {state.characterTotal ? `Xem tất cả ${state.characterTotal} nhân vật →` : 'Tìm trong thư viện nhân vật (gồm tên series) →'}
                </button>
              </section>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
