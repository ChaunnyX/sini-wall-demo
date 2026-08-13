import { useEffect, useMemo, useState } from 'react'
import { PRODUCTS, img } from '../data/catalog'
import { SHOP } from '../data/shop'
import { money, mmss } from '../lib/format'
import { filterProducts } from '../lib/search'
import { go, href } from '../lib/router'
import { plural, useStore } from '../lib/store'

export function Head() {
  const { cart, fav, cartTotal, mySize } = useStore()
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!cart.length) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [cart.length])

  const hits = useMemo(() => (q.trim().length < 2 ? [] : filterProducts({ q }).slice(0, 7)), [q])
  const hold = cart.length ? Math.min(...cart.map((l) => l.reservedUntil)) - now : 0

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-table/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-3 py-2.5 lg:px-6">
        <a href={href('/')} className="display shrink-0 text-[22px] tracking-[-0.02em] lg:text-[26px]">
          SINI
        </a>
        <nav className="hidden shrink-0 items-center gap-4 border-l border-line pl-4 lg:flex">
          {[
            { to: '/catalog', l: 'Каталог' },
            { to: '/catalog?fresh=1', l: 'Новинки' },
            { to: '/catalog?sale=1', l: 'Sale' },
            { to: '/concierge', l: 'Под заказ' },
          ].map((n) => (
            <a key={n.l} href={href(n.to)} className="text-[13px] font-medium hover:text-mark">
              {n.l}
            </a>
          ))}
        </nav>

        {/* Поиск всегда на виду — в магазине это главный инструмент */}
        <div className="relative ml-auto w-full max-w-[520px]">
          <div className="flex items-center gap-2 border border-line bg-sheet px-3 py-2 focus-within:border-graphite">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 21 21" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 160)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q.trim()) go(`/catalog?q=${encodeURIComponent(q.trim())}`)
              }}
              placeholder="Модель, бренд, артикул — «2002R», «нб», «FD0780»"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-mute/70"
            />
            {q && (
              <button onClick={() => setQ('')} className="mono shrink-0 text-[11px] text-mute">
                ✕
              </button>
            )}
          </div>

          {focus && hits.length > 0 && (
            <div className="fade absolute inset-x-0 top-[calc(100%+6px)] z-50 border border-graphite bg-sheet shadow-[0_30px_60px_-40px_rgba(0,0,0,.7)]">
              {hits.map((p) => (
                <a key={p.id} href={href(`/p/${p.id}`)} className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0 hover:bg-table">
                  <img src={img(p.images[0])} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="label block text-mute">{p.brand}</span>
                    <span className="block truncate text-[13px]">{p.title}</span>
                  </span>
                  <span className="mono shrink-0 text-[12px] font-semibold">{money(p.price)}</span>
                </a>
              ))}
              <button onClick={() => go(`/catalog?q=${encodeURIComponent(q.trim())}`)} className="label w-full bg-graphite py-2.5 text-white">
                ПОКАЗАТЬ ВСЁ ПО ЗАПРОСУ
              </button>
            </div>
          )}
          {focus && q.trim().length >= 2 && hits.length === 0 && (
            <div className="fade absolute inset-x-0 top-[calc(100%+6px)] z-50 border border-graphite bg-sheet p-4">
              <p className="text-[14px] font-medium">Такого сейчас нет на столе</p>
              <p className="mt-1 text-[13px] text-mute">Но это не значит, что не достанем — оставьте запрос, привезём под заказ.</p>
              <a href={href('/concierge')} className="label mt-3 inline-block bg-mark px-3 py-2 text-white">ЗАКАЗАТЬ ПОИСК</a>
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {mySize && (
            <span className="mono hidden border border-mark px-2 py-1.5 text-[10px] text-mark sm:block">
              РАЗМЕР {mySize}
            </span>
          )}
          <a href={href('/fav')} data-hint="избранное" aria-label="Избранное" className="mono relative hidden h-9 w-9 place-items-center border border-line bg-sheet text-[12px] hover:border-graphite sm:grid">
            {fav.length || '○'}
          </a>
          <a
            data-cart-anchor
            href={href('/cart')}
            data-hint="корзина"
            className="mono flex h-9 items-center gap-2 bg-graphite px-3 text-[11px] text-white transition hover:bg-mark"
          >
            КОРЗИНА
            {cart.length > 0 && <b>{cart.length}</b>}
          </a>
        </div>
      </div>

      {cart.length > 0 && hold > 0 && (
        <div className="border-t border-line bg-mark text-white">
          <div className="mono mx-auto flex max-w-[1680px] items-center justify-between px-3 py-1 text-[11px] lg:px-6">
            <span>
              Держим {cart.length} {plural(cart.length, 'вещь', 'вещи', 'вещей')} за вами · {mmss(hold)}
            </span>
            <a href={href('/cart')} className="font-semibold underline">
              Оформить {money(cartTotal)}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

export function Foot() {
  return (
    <footer className="relative z-10 mt-16 border-t border-line bg-deep text-white/85">
      <div className="mx-auto max-w-[1680px] px-3 py-12 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/12 pb-8">
          <div>
            <p className="display text-[clamp(40px,8vw,92px)] leading-[0.9] text-white">SINI</p>
            <p className="mono mt-2 text-[11px] text-white/45">
              {SHOP.address} · с {SHOP.since} · {PRODUCTS.length} позиций на столе
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={SHOP.tg.channel} target="_blank" rel="noreferrer" className="label bg-mark px-4 py-3 text-white">КАНАЛ {SHOP.tg.channelName}</a>
            <a href={SHOP.tg.manager} target="_blank" rel="noreferrer" className="label border border-white/30 px-4 py-3 hover:bg-white hover:text-graphite">МЕНЕДЖЕР {SHOP.tg.managerName}</a>
          </div>
        </div>
        <div className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="label text-white/40">Покупателю</p>
            <ul className="mt-3 grid gap-1.5 text-[14px]">
              <li><a href={href('/info/delivery')} className="hover:text-mark">Доставка и оплата</a></li>
              <li><a href={href('/sizes')} className="hover:text-mark">Как выбрать размер</a></li>
              <li><a href={href('/info/faq')} className="hover:text-mark">Вопросы и ответы</a></li>
              <li><a href={href('/concierge')} className="hover:text-mark">Привезём под заказ</a></li>
              <li><a href={href('/info/about')} className="hover:text-mark">О магазине</a></li>
            </ul>
          </div>
          <div>
            <p className="label text-white/40">Оффлайн</p>
            <p className="mt-3 text-[14px] leading-snug">
              {SHOP.address}
              <br />
              <a href={SHOP.mapUrl} target="_blank" rel="noreferrer" className="text-mark underline">Открыть на карте</a>
            </p>
            <p className="mono mt-3 text-[11px] text-white/45">★ {SHOP.rating.value} · {SHOP.rating.count} отзывов</p>
          </div>
          <div>
            <p className="label text-white/40">Оплата и получение</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['МИР', 'VISA', 'MASTERCARD', 'СБП', 'СДЭК', 'САМОВЫВОЗ'].map((x) => (
                <span key={x} className="mono border border-white/20 px-2 py-1.5 text-[10px] text-white/60">{x}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="label text-white/40">Условия</p>
            <p className="mt-3 text-[13px] leading-snug text-white/60">
              Бесплатная доставка по России от {SHOP.freeFrom.toLocaleString('ru-RU')} ₽. Возврат 14 дней при сохранении вида,
              бирок и упаковки. Наличие и итог подтверждает менеджер.
            </p>
          </div>
        </div>
        <p className="mono border-t border-white/12 pt-6 text-[10px] text-white/35">
          © {new Date().getFullYear()} {SHOP.name} · {SHOP.city} · демо-версия витрины
        </p>
      </div>
    </footer>
  )
}
