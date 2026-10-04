import { useEffect, useState } from 'react'
import { Home, Search } from 'lucide-react'
import './CharacterCatalog.css'

const NAV_ITEMS = [
  { path: '/', label: 'Làm bài', icon: Home, match: (pathname) => pathname === '/' },
  {
    path: '/characters',
    label: 'Tìm nhân vật',
    icon: Search,
    match: (pathname) => pathname === '/characters' || pathname.startsWith('/anime/') || pathname.startsWith('/character/'),
  },
  { path: '/admin', label: 'Admin', match: (pathname) => pathname === '/admin' },
]

/** Shared shell for catalog/detail/admin pages with a sticky top navigation. */
export default function AppLayout({ pathname, onNavigate, before = null, children, mainClassName = '' }) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 4)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function go(event, path) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <div className="catalog-shell">
      <header className={`catalog-topbar${scrolled ? ' is-scrolled' : ''}`}>
        <a className="catalog-brand" href="/" onClick={(event) => go(event, '/')}>
          <span className="catalog-brand-mark">N<span>.</span></span>
          <span>NHÂN VẬT<br />GIỐNG MÌNH</span>
        </a>
        <nav className="catalog-navigation" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.path}
                href={item.path}
                aria-current={item.match(pathname) ? 'page' : undefined}
                onClick={(event) => go(event, item.path)}
              >
                {Icon ? <Icon size={15} /> : null} {item.label}
              </a>
            )
          })}
        </nav>
      </header>
      {before}
      <main className={`catalog-main ${mainClassName}`.trim()}>{children}</main>
    </div>
  )
}
