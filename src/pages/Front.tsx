import { useEffect, useMemo, useRef, useState } from 'react'
import { BRANDS, CATEGORIES, PRODUCTS, TOTAL_PAIRS, byId, img, inStock, type Product } from '../data/catalog'
import { FAQ, REVIEWS, SHOP, STEPS } from '../data/shop'
import { money } from '../lib/format'
import { href } from '../lib/router'
import { useStore } from '../lib/store'

/** Афиши дропов: у каждой вещи своё поле цвета и своё крупное слово. */
const DROPS = [
  { id: 'krossovki-new-balance-m2002rdd', word: '2002R', field: '#D9E2DE', ink: '#14201c', note: 'Protection Pack' },
  { id: 'kurtka-c-p-company-green-goggle-jacket', word: 'GOGGLE', field: '#D6E4D2', ink: '#16210f', note: 'Green Goggle Jacket' },
  { id: 'krossovki-salomon-l49107000', word: 'XT—MM6', field: '#DCDEE4', ink: '#141620', note: 'Salomon × MM6' },
  { id: 'krossovki-nike-fd0780-100', word: 'AIR MAX', field: '#E8E2D0', ink: '#211d10', note: 'Air Max 95' },
]

export function Front() {
  const drops = DROPS.map((d) => ({ ...d, p: byId(d.id) })).filter((d) => d.p) as (typeof DROPS[0] & { p: Product })[]
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % drops.length), 6000)
    return () => clearInterval(t)
  }, [drops.length])

  const singles = useMemo(() => PRODUCTS.filter((p) => inStock(p) === 1 && p.heroOk).slice(0, 14), [])

  return (
    <div className="relative z-10">
      <Poster drops={drops} i={i} setI={setI} />
      <Corridor list={singles} />
      <Brands />
      <How />
      <Shop />
      <Finish />
    </div>
  )
}

/* ── Первый экран: афиша дропа ───────────────────────────────────────── */
function Poster({
  drops,
  i,
  setI,
}: {
  drops: (typeof DROPS[0] & { p: Product })[]
  i: number
  setI: (n: number) => void
}) {
  const { take } = useStore()
  const stage = useRef<HTMLDivElement>(null)
  const cur = drops[i]

  useEffect(() => {
    const el = stage.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let tx = 0, ty = 0, x = 0, y = 0
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
    }
    const loop = () => {
      x += (tx - x) * 0.045
      y += (ty - y) * 0.045
      el.style.setProperty('--px', x.toFixed(4))
      el.style.setProperty('--py', y.toFixed(4))
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      ref={stage}
      className="relative overflow-hidden border-b border-line transition-colors duration-1000"
      style={{ background: cur.field, color: cur.ink, ['--px' as string]: 0, ['--py' as string]: 0 }}
    >
      <div className="relative mx-auto flex min-h-[calc(100svh-58px)] max-w-[1680px] flex-col px-3 pb-6 pt-6 lg:px-6 lg:pb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="label opacity-60">дроп недели · {SHOP.city}</p>
          <p className="label opacity-60">
            {PRODUCTS.length} позиций · {TOTAL_PAIRS} вещей · каждая одна
          </p>
        </div>

        {/* Слово-афиша, товар идёт поверх него */}
        <div className="relative flex flex-1 items-center justify-center">
          <span
            key={cur.word}
            className="display pointer-events-none absolute select-none whitespace-nowrap text-[clamp(74px,19vw,300px)] leading-none opacity-[0.13]"
            style={{ transform: 'translate3d(calc(var(--px) * -30px), calc(var(--py) * -14px), 0)' }}
          >
            {cur.word}
          </span>

          {drops.map((d, n) => (
            <a
              key={d.id}
              href={href(`/p/${d.p.id}`)}
              data-hint="открыть"
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[900ms] ${
                n === i ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              style={{ transform: 'translate3d(calc(var(--px) * 24px), calc(var(--py) * 14px), 0)' }}
            >
              <img
                src={img(d.p.images[0])}
                alt={d.p.title}
                width={1200}
                height={1200}
                className="max-h-[54svh] w-auto max-w-[78%] object-contain"
                style={{ filter: 'drop-shadow(0 40px 30px rgba(0,0,0,.26))' }}
              />
            </a>
          ))}
        </div>

        {/* Афишные данные: что, сколько, какой размер, и одно действие */}
        <div className="grid gap-4 border-t border-current/15 pt-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <div>
            <p className="label opacity-60">{cur.p.brand} · {cur.note}</p>
            <h1 className="mt-1 text-[clamp(20px,2.6vw,32px)] font-semibold leading-tight">{cur.p.title}</h1>
          </div>
          <div className="mono text-[13px]">
            <p className="text-[clamp(22px,2.6vw,30px)] font-semibold leading-none">{money(cur.p.price)}</p>
            <p className="mt-1.5 opacity-60">
              размер {cur.p.sizes.map((s) => s.label).join(', ')} · {inStock(cur.p) === 1 ? 'одна пара' : `${inStock(cur.p)} шт`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => take(cur.p, cur.p.sizes[0].label, e.currentTarget)}
              data-hint="взять"
              className="label bg-graphite px-5 py-4 text-white transition hover:bg-mark"
            >
              ВЗЯТЬ · {cur.p.sizes[0]?.label}
            </button>
            <a href={href('/catalog')} className="label border border-current px-5 py-4 transition hover:bg-graphite hover:text-white">
              ВЕСЬ КАТАЛОГ
            </a>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {drops.map((d, n) => (
            <button
              key={d.id}
              onClick={() => setI(n)}
              aria-label={d.p.title}
              className={`h-[3px] flex-1 transition-opacity ${n === i ? 'bg-current opacity-100' : 'bg-current opacity-20 hover:opacity-50'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Зал 2: проход вдоль полки — вертикальный скролл едет вбок ───────── */
function Corridor({ list }: { list: Product[] }) {
  const outer = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const o = outer.current
    const t = track.current
    if (!o || !t) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = o.getBoundingClientRect()
        const total = r.height - window.innerHeight
        const p = Math.max(0, Math.min(1, -r.top / (total || 1)))
        const dist = Math.max(0, t.scrollWidth - window.innerWidth + 48)
        t.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`
        setProgress(p)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [list])

  return (
    <section ref={outer} className="relative border-b border-line bg-deep text-white" style={{ height: '320vh' }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60vw_50vw_at_50%_0%,rgba(255,226,168,.14),transparent_66%)]" />

        <div className="relative mx-auto w-full max-w-[1680px] px-3 lg:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-mark">осталось по одной</p>
              <h2 className="display mt-2 text-[clamp(28px,5vw,64px)]">Пройдите вдоль полки</h2>
            </div>
            <p className="max-w-[40ch] text-[14px] text-white/55">
              Здесь позиции, у которых остался ровно один размер и ровно одна вещь. Прокручивайте — полка едет.
            </p>
          </div>
        </div>

        <div className="relative mt-8 overflow-hidden">
          <div ref={track} className="flex w-max items-end gap-10 px-6 will-change-transform lg:gap-16">
            {list.map((p) => (
              <a key={p.id} href={href(`/p/${p.id}`)} data-hint="открыть" className="group flex w-[min(38vw,240px)] shrink-0 flex-col items-center">
                <img
                  src={img(p.images[0])}
                  alt={p.title}
                  width={600}
                  height={600}
                  loading="lazy"
                  className="h-[clamp(110px,17vw,210px)] w-auto object-contain transition-transform duration-500 group-hover:-translate-y-3"
                  style={{ filter: 'drop-shadow(0 22px 18px rgba(0,0,0,.6))' }}
                />
                <span
                  className="mt-2 h-[10px] w-[70%] transition-all duration-500 group-hover:w-[86%]"
                  style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,.85), transparent 76%)' }}
                />
                <span className="label mt-2 text-white/45">{p.brand}</span>
                <span className="mt-0.5 line-clamp-2 text-center text-[13px] leading-tight">{p.title}</span>
                <span className="mono mt-1 text-[13px] font-semibold text-mark">{money(p.price)}</span>
                <span className="mono mt-0.5 text-[10px] text-white/40">размер {p.sizes[0]?.label} · 1 шт</span>
              </a>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-8 w-full max-w-[1680px] px-3 lg:px-6">
          <div className="h-px w-full bg-white/15">
            <div className="h-full bg-mark transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mono mt-2 flex justify-between text-[10px] text-white/40">
            <span>1 / {list.length}</span>
            <a href={href('/catalog')} className="border-b border-white/40 pb-0.5 hover:text-mark">ВСЯ СТЕНА →</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Зал 3: бренды с живым превью ────────────────────────────────────── */
function Brands() {
  const [active, setActive] = useState(BRANDS[0].name)
  const preview = useMemo(() => PRODUCTS.filter((p) => p.brand === active && p.heroOk).slice(0, 3), [active])

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1680px] gap-8 px-3 py-14 lg:grid-cols-[1fr_1fr] lg:px-6">
        <div>
          <p className="label text-mark">бренды</p>
          <h2 className="display mt-2 text-[clamp(26px,4vw,52px)]">Кого мы возим</h2>
          <div className="mt-6 border-t border-line">
            {BRANDS.map((b) => (
              <a
                key={b.slug}
                href={href(`/catalog?brand=${encodeURIComponent(b.name)}`)}
                onMouseEnter={() => setActive(b.name)}
                className={`flex items-baseline justify-between gap-3 border-b border-line py-3 transition-colors ${
                  active === b.name ? 'text-mark' : 'hover:text-mark'
                }`}
              >
                <span className="display text-[clamp(18px,2.4vw,28px)]">{b.name}</span>
                <span className="mono shrink-0 text-[11px] text-mute">{b.count} · от {money(b.min)}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="relative min-h-[280px] border border-line bg-sheet p-5">
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(closest-side at 50% 40%, rgba(255,247,232,.9), transparent 72%)' }}
          />
          <p className="label relative text-mute">{active}</p>
          <div className="relative mt-4 grid grid-cols-3 gap-3">
            {preview.map((p) => (
              <a key={p.id} href={href(`/p/${p.id}`)} className="group flex flex-col">
                <img
                  src={img(p.images[0])}
                  alt={p.title}
                  width={400}
                  height={400}
                  loading="lazy"
                  className="h-28 w-full object-contain transition-transform duration-500 group-hover:-translate-y-2"
                  style={{ filter: 'drop-shadow(0 16px 14px rgba(16,17,20,.2))' }}
                />
                <span className="mt-2 line-clamp-2 text-[12px] leading-tight">{p.title}</span>
                <span className="mono mt-1 text-[12px] font-semibold">{money(p.price)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Зал 4: как это работает ─────────────────────────────────────────── */
function How() {
  return (
    <section className="border-b border-line bg-sheet">
      <div className="mx-auto max-w-[1680px] px-3 py-14 lg:px-6">
        <p className="label text-mark">как это работает</p>
        <h2 className="display mt-2 text-[clamp(26px,4vw,52px)]">Три шага и вещь ваша</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t-2 border-graphite pt-4">
              <span className="display text-[36px] leading-none text-mark">{s.n}</span>
              <h3 className="mt-2 text-[17px] font-semibold leading-tight">{s.t}</h3>
              <p className="mt-1.5 text-[14px] leading-snug text-mute">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Зал 5: магазин, отзывы, вопросы ─────────────────────────────────── */
function Shop() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1680px] gap-10 px-3 py-14 lg:grid-cols-[1fr_1fr] lg:px-6">
        <div>
          <p className="label text-mark">оффлайн</p>
          <h2 className="display mt-2 text-[clamp(26px,4vw,52px)]">Всё это лежит в Воронеже</h2>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-snug text-mute">
            {SHOP.address}. Здесь то же самое можно взять в руки, померить и забрать сразу. Перед визитом за конкретной
            вещью напишите — отложим.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="display text-[46px] leading-none">{SHOP.rating.value}</span>
            <span className="text-[13px] text-mute">
              ★★★★★
              <br />
              {SHOP.rating.count} отзывов на {SHOP.rating.source}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={SHOP.tg.channel} target="_blank" rel="noreferrer" className="label bg-graphite px-4 py-3 text-white hover:bg-mark">КАНАЛ SINI</a>
            <a href={SHOP.mapUrl} target="_blank" rel="noreferrer" className="label border border-graphite px-4 py-3 hover:bg-graphite hover:text-white">НА КАРТЕ</a>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {CATEGORIES.slice(0, 6).map((c) => (
              <a key={c.slug} href={href(`/catalog?cat=${c.slug}`)} className="flex items-center justify-between gap-2 border border-line bg-sheet px-3 py-2.5 text-[13px] hover:border-graphite">
                {c.ru}
                <span className="mono text-[10px] text-mute">{c.count}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {REVIEWS.slice(0, 2).map((r) => (
            <figure key={r.date} className="border-l-2 border-mark pl-4">
              <blockquote className="text-[14px] leading-snug">«{r.text}»</blockquote>
              <figcaption className="mono mt-2 text-[10px] text-mute">{r.name} · {r.date}</figcaption>
            </figure>
          ))}
          <div className="border-t border-line pt-4">
            {FAQ.slice(0, 4).map((x) => (
              <details key={x.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-medium">
                  {x.q}
                  <span className="text-mark transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-[64ch] pb-3 text-[13px] leading-snug text-mute">{x.a}</p>
              </details>
            ))}
            <a href={href('/info/faq')} className="label mt-3 inline-block border-b border-graphite pb-0.5">ВСЕ ВОПРОСЫ →</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Финал: вход в каталог ───────────────────────────────────────────── */
function Finish() {
  const { mySize } = useStore()
  return (
    <section className="border-b border-line bg-deep py-16 text-white">
      <div className="mx-auto max-w-[1680px] px-3 text-center lg:px-6">
        <p className="label text-mark">теперь выбирайте</p>
        <h2 className="display mt-3 text-[clamp(30px,6.4vw,84px)]">
          {PRODUCTS.length} позиций.
          <br />
          Каждая в одном экземпляре.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <a href={href(mySize ? `/catalog?size=${mySize}` : '/catalog')} className="label bg-mark px-7 py-4 text-white hover:bg-mark-dim">
            {mySize ? `ОТКРЫТЬ КАТАЛОГ В РАЗМЕРЕ ${mySize}` : 'ОТКРЫТЬ КАТАЛОГ'}
          </a>
          <a href={href('/concierge')} className="label border border-white/40 px-7 py-4 hover:bg-white hover:text-graphite">
            НЕТ МОЕГО РАЗМЕРА
          </a>
        </div>
      </div>
    </section>
  )
}
