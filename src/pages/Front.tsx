import { useEffect, useMemo, useRef, useState } from 'react'
import { BRANDS, CATEGORIES, PRODUCTS, TOTAL_PAIRS, byId, img, inStock, type Product } from '../data/catalog'
import { FAQ, REVIEWS, SHOP, STEPS } from '../data/shop'
import { money } from '../lib/format'
import { href } from '../lib/router'
import { plural, useStore } from '../lib/store'

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

  return (
    <div className="relative z-10">
      <Poster drops={drops} i={i} setI={setI} />
      <Singles />
      <Shelves />
      <Brands />
      <How />
      <Store />
      <Finale />
    </div>
  )
}

/** Появление блока при подходе — сдержанно, без цирка. */
function Rise({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.classList.add('on')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    )
    io.observe(el)
    // Страховка: что бы ни случилось с наблюдателем, блок не останется невидимым
    const safety = setTimeout(() => el.classList.add('on'), 1800)
    return () => {
      io.disconnect()
      clearTimeout(safety)
    }
  }, [delay])
  return (
    <div ref={ref} className={`lay ${className}`}>
      {children}
    </div>
  )
}

/* ── 1. Афиша дропа ──────────────────────────────────────────────────── */
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
      className="relative overflow-hidden transition-colors duration-1000"
      style={{ background: cur.field, color: cur.ink, ['--px' as string]: 0, ['--py' as string]: 0 }}
    >
      <div className="relative mx-auto flex min-h-[calc(100svh-58px)] max-w-[1680px] flex-col px-3 pb-5 pt-5 lg:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="label opacity-55">дроп недели · {SHOP.city}, Орджоникидзе 2/4</p>
          <p className="label opacity-55">
            {PRODUCTS.length} позиций · {TOTAL_PAIRS} вещей · каждая одна
          </p>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <span
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
                className="max-h-[52svh] w-auto max-w-[78%] object-contain"
                style={{ filter: 'drop-shadow(0 40px 30px rgba(0,0,0,.26))' }}
              />
            </a>
          ))}
        </div>

        <div className="grid gap-4 border-t border-current/15 pt-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <div>
            <p className="label opacity-55">{cur.p.brand} · {cur.note}</p>
            <h1 className="mt-1 text-[clamp(19px,2.4vw,30px)] font-semibold leading-tight">{cur.p.title}</h1>
          </div>
          <div className="mono text-[13px]">
            <p className="text-[clamp(21px,2.4vw,28px)] font-semibold leading-none">{money(cur.p.price)}</p>
            <p className="mt-1.5 opacity-55">
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

        {/* Миниатюры дропов — видно, что дальше, и можно переключить руками */}
        <div className="mt-4 flex gap-2">
          {drops.map((d, n) => (
            <button
              key={d.id}
              onClick={() => setI(n)}
              aria-label={d.p.title}
              className={`flex flex-1 items-center gap-2 border px-2 py-2 text-left transition ${
                n === i ? 'border-current' : 'border-current/20 opacity-55 hover:opacity-100'
              }`}
            >
              <img src={img(d.p.images[0])} alt="" width={44} height={44} className="h-9 w-9 shrink-0 object-contain" />
              <span className="mono hidden truncate text-[10px] sm:block">{d.word}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 2. Осталось по одной — плотная сетка на тёмном ──────────────────── */
function Singles() {
  const { take, mySize } = useStore()
  const list = useMemo(() => PRODUCTS.filter((p) => inStock(p) === 1 && p.heroOk).slice(0, 8), [])
  const total = useMemo(() => PRODUCTS.filter((p) => inStock(p) === 1).length, [])

  return (
    <section className="bg-deep py-14 text-white lg:py-20">
      <div className="mx-auto max-w-[1680px] px-3 lg:px-6">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-5">
            <div>
              <p className="label text-mark">осталось по одной</p>
              <h2 className="display mt-2 text-[clamp(28px,5.2vw,66px)]">
                {total} вещей, которых
                <br />
                больше не будет
              </h2>
            </div>
            <p className="max-w-[38ch] text-[14px] leading-snug text-white/55">
              У этих позиций остался ровно один размер и ровно одна штука. Забрали — и повторить мы не сможем: возим
              штучно, а не коробками.
            </p>
          </div>
        </Rise>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {list.map((p, n) => (
            <Rise key={p.id} delay={(n % 4) * 60}>
              <article className="group flex h-full flex-col">
                <a href={href(`/p/${p.id}`)} data-hint="открыть" className="relative flex aspect-square items-center justify-center">
                  <span
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: 'radial-gradient(closest-side, rgba(255,232,180,.14), transparent 72%)' }}
                  />
                  <img
                    src={img(p.images[0])}
                    alt={p.title}
                    width={700}
                    height={700}
                    loading="lazy"
                    className="relative max-h-full w-full object-contain transition-transform duration-500 group-hover:-translate-y-2.5"
                    style={{ filter: 'drop-shadow(0 24px 18px rgba(0,0,0,.65))' }}
                  />
                  <span
                    className="pointer-events-none absolute inset-x-[22%] bottom-1 h-[12px] transition-all duration-500 group-hover:inset-x-[16%]"
                    style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,.9), transparent 76%)' }}
                  />
                </a>
                <p className="label mt-3 text-white/45">{p.brand}</p>
                <a href={href(`/p/${p.id}`)} className="mt-1 line-clamp-2 text-[14px] font-medium leading-tight hover:text-mark">
                  {p.title}
                </a>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <span className="mono text-[15px] font-semibold">{money(p.price)}</span>
                  <button
                    onClick={(e) => take(p, p.sizes[0].label, e.currentTarget)}
                    data-hint="взять"
                    className={`mono border px-2 py-1 text-[11px] transition ${
                      mySize === p.sizes[0]?.label ? 'border-mark bg-mark text-white' : 'border-white/30 hover:border-white'
                    }`}
                  >
                    {p.sizes[0]?.label}
                  </button>
                </div>
              </article>
            </Rise>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5">
          <p className="mono text-[12px] text-white/45">показано 8 из {total}</p>
          <a href={href('/catalog')} className="label bg-mark px-6 py-4 text-white transition hover:bg-mark-dim">
            СМОТРЕТЬ ВСЕ {total} →
          </a>
        </div>
      </div>
    </section>
  )
}

/* ── 3. Категории афишами на песочном поле ───────────────────────────── */
function Shelves() {
  return (
    <section style={{ background: '#EAE4D6' }} className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1680px] px-3 lg:px-6">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label text-mark">полки</p>
              <h2 className="display mt-2 text-[clamp(28px,5vw,62px)]">Что у нас лежит</h2>
            </div>
            <a href={href('/catalog')} className="label border border-graphite px-5 py-3.5 transition hover:bg-graphite hover:text-white">
              ВЕСЬ КАТАЛОГ · {PRODUCTS.length}
            </a>
          </div>
        </Rise>

        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c, n) => (
            <Rise key={c.slug} delay={(n % 5) * 55}>
              <a
                href={href(`/catalog?cat=${c.slug}`)}
                data-hint="открыть"
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden border border-graphite/12 bg-sheet p-3 transition-colors hover:border-graphite"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(closest-side at 50% 34%, rgba(255,246,228,1), transparent 72%)' }}
                />
                <img
                  src={img(c.image)}
                  alt={c.ru}
                  width={700}
                  height={700}
                  loading="lazy"
                  className="absolute inset-x-[8%] top-[8%] h-[58%] w-[84%] object-contain transition-transform duration-500 group-hover:-translate-y-2"
                  style={{ filter: 'drop-shadow(0 18px 14px rgba(16,17,20,.2))' }}
                />
                <span className="relative">
                  <span className="mono block text-[10px] text-mute">{c.count} шт · от {money(c.min)}</span>
                  <span className="mt-1 block text-[15px] font-semibold leading-tight">{c.ru}</span>
                </span>
              </a>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 4. Бренды полками: имя бренда и сразу его вещи ──────────────────── */
function Brands() {
  const { take } = useStore()
  const rows = useMemo(
    () =>
      BRANDS.filter((b) => b.count >= 3)
        .slice(0, 6)
        .map((b) => ({ brand: b, items: PRODUCTS.filter((p) => p.brand === b.name && p.heroOk).slice(0, 5) }))
        .filter((r) => r.items.length),
    [],
  )
  const rest = useMemo(() => BRANDS.filter((b) => b.count < 3), [])

  return (
    <section style={{ background: '#DFE3E6' }} className="py-14 lg:py-20">
      <div className="mx-auto max-w-[1680px] px-3 lg:px-6">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-graphite/15 pb-5">
            <div>
              <p className="label text-mark">бренды</p>
              <h2 className="display mt-2 text-[clamp(28px,5vw,62px)]">Кого мы возим</h2>
            </div>
            <p className="max-w-[38ch] text-[14px] leading-snug text-mute">
              Не логотипы, а то, что лежит прямо сейчас. Нажмите на вещь — откроется карточка, на размер — вещь уйдёт в корзину.
            </p>
          </div>
        </Rise>

        {rows.map((r, n) => (
          <Rise key={r.brand.slug} delay={Math.min(n, 3) * 60}>
            <div className="flex flex-col gap-3 border-b border-graphite/12 py-6 lg:flex-row lg:items-center lg:gap-6">
              <a
                href={href(`/catalog?brand=${encodeURIComponent(r.brand.name)}`)}
                data-hint="открыть"
                className="group flex shrink-0 items-baseline justify-between gap-3 lg:w-[230px] lg:flex-col lg:items-start"
              >
                <span className="display text-[clamp(20px,2.6vw,34px)] leading-none transition-colors group-hover:text-mark">
                  {r.brand.name}
                </span>
                <span className="mono text-[11px] text-mute">
                  {r.brand.count} {plural(r.brand.count, 'вещь', 'вещи', 'вещей')} · от {money(r.brand.min)}
                </span>
                <span className="label hidden border-b border-graphite pb-0.5 transition-colors group-hover:border-mark group-hover:text-mark lg:block">
                  СМОТРЕТЬ ВСЕ →
                </span>
              </a>

              <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 scrollbar-none lg:mx-0 lg:flex-1 lg:px-0">
                {r.items.map((p) => (
                  <article key={p.id} className="group w-[46%] shrink-0 border border-graphite/12 bg-sheet sm:w-[30%] lg:w-auto lg:flex-1">
                    <a href={href(`/p/${p.id}`)} data-hint="открыть" className="relative block aspect-square">
                      <span
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(closest-side at 50% 40%, rgba(255,246,228,1), transparent 72%)' }}
                      />
                      <img
                        src={img(p.images[0])}
                        alt={p.title}
                        width={500}
                        height={500}
                        loading="lazy"
                        className="relative h-full w-full object-contain p-[10%] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.05]"
                        style={{ filter: 'drop-shadow(0 14px 12px rgba(16,17,20,.2))' }}
                      />
                    </a>
                    <div className="flex flex-col gap-1 border-t border-graphite/12 p-2.5">
                      <a href={href(`/p/${p.id}`)} className="line-clamp-2 text-[12px] leading-tight hover:text-mark">
                        {p.title}
                      </a>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="mono text-[13px] font-semibold">{money(p.price)}</span>
                        <button
                          onClick={(e) => take(p, p.sizes[0].label, e.currentTarget)}
                          data-hint="взять"
                          className="mono border border-line px-1.5 py-0.5 text-[10px] transition hover:border-graphite hover:bg-mark hover:text-white"
                        >
                          {p.sizes[0]?.label}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Rise>
        ))}

        {rest.length > 0 && (
          <Rise>
            <div className="flex flex-wrap items-center gap-2 pt-6">
              <span className="label text-mute">ещё у нас есть</span>
              {rest.map((b) => (
                <a
                  key={b.slug}
                  href={href(`/catalog?brand=${encodeURIComponent(b.name)}`)}
                  className="mono border border-graphite/20 bg-sheet px-3 py-2 text-[12px] transition hover:border-graphite"
                >
                  {b.name} <span className="text-mute">· {b.count}</span>
                </a>
              ))}
            </div>
          </Rise>
        )}
      </div>
    </section>
  )
}

/* ── 5. Как это работает ─────────────────────────────────────────────── */
function How() {
  const sample = useMemo(() => PRODUCTS.filter((p) => p.heroOk).slice(10, 13), [])
  return (
    <section className="bg-sheet py-14 lg:py-20">
      <div className="mx-auto max-w-[1680px] px-3 lg:px-6">
        <Rise>
          <p className="label text-mark">как это работает</p>
          <h2 className="display mt-2 text-[clamp(28px,5vw,62px)]">Три шага и вещь ваша</h2>
        </Rise>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, n) => (
            <Rise key={s.n} delay={n * 80}>
              <div className="flex h-full flex-col border border-line bg-table p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="display text-[42px] leading-none text-mark">{s.n}</span>
                  {sample[n] && (
                    <img
                      src={img(sample[n].images[0])}
                      alt=""
                      width={200}
                      height={200}
                      loading="lazy"
                      className="h-16 w-24 object-contain"
                      style={{ filter: 'drop-shadow(0 12px 10px rgba(16,17,20,.18))' }}
                    />
                  )}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold leading-tight">{s.t}</h3>
                <p className="mt-2 text-[14px] leading-snug text-mute">{s.d}</p>
              </div>
            </Rise>
          ))}
        </div>

        <Rise delay={120}>
          <div className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Оригинал', 'Фото и видео артикула, бирок и коробки — по запросу до отправки'],
              ['Примерка', `Оффлайн-магазин: ${SHOP.address}`],
              ['СДЭК по России, РБ и КЗ', `Бесплатно от ${money(SHOP.freeFrom)}, по России 2–7 дней`],
              ['Возврат 14 дней', 'При сохранении вида, бирок и упаковки'],
            ].map(([t, d]) => (
              <div key={t} className="bg-table p-5">
                <p className="text-[15px] font-semibold">{t}</p>
                <p className="mt-1 text-[13px] leading-snug text-mute">{d}</p>
              </div>
            ))}
          </div>
        </Rise>
      </div>
    </section>
  )
}

/* ── 6. Магазин: карта, оценка, отзывы, вопросы ──────────────────────── */
function Store() {
  return (
    <section className="bg-deep py-14 text-white lg:py-20">
      <div className="mx-auto max-w-[1680px] px-3 lg:px-6">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-5">
            <div>
              <p className="label text-mark">оффлайн</p>
              <h2 className="display mt-2 text-[clamp(28px,5vw,62px)]">Всё это лежит в Воронеже</h2>
            </div>
            <div className="flex items-end gap-3">
              <span className="display text-[52px] leading-none">{SHOP.rating.value}</span>
              <span className="pb-1 text-[13px] text-white/55">
                ★★★★★
                <br />
                {SHOP.rating.count} отзывов на {SHOP.rating.source}
              </span>
            </div>
          </div>
        </Rise>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Rise>
            <div className="h-[320px] overflow-hidden border border-white/15 lg:h-full lg:min-h-[380px]">
              <iframe
                title="SINI на карте"
                src="https://yandex.ru/map-widget/v1/?ll=39.196%2C51.669&z=16&text=%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B5%D0%B6%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9E%D1%80%D0%B4%D0%B6%D0%BE%D0%BD%D0%B8%D0%BA%D0%B8%D0%B4%D0%B7%D0%B5%2C%202%2F4"
                className="h-full w-full"
                loading="lazy"
              />
            </div>
          </Rise>

          <div className="grid gap-4">
            <Rise delay={80}>
              <div className="grid gap-3 sm:grid-cols-2">
                {REVIEWS.slice(0, 2).map((r) => (
                  <figure key={r.date} className="border border-white/15 p-4">
                    <blockquote className="text-[13px] leading-snug text-white/85">«{r.text}»</blockquote>
                    <figcaption className="mono mt-3 text-[10px] text-white/40">{r.name} · {r.date}</figcaption>
                  </figure>
                ))}
              </div>
            </Rise>
            <Rise delay={140}>
              <div className="border-t border-white/15 pt-3">
                {FAQ.slice(0, 4).map((x) => (
                  <details key={x.q} className="group border-b border-white/12">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-medium">
                      {x.q}
                      <span className="text-mark transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="max-w-[64ch] pb-3 text-[13px] leading-snug text-white/60">{x.a}</p>
                  </details>
                ))}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={SHOP.tg.channel} target="_blank" rel="noreferrer" className="label bg-mark px-4 py-3 text-white">КАНАЛ {SHOP.tg.channelName}</a>
                  <a href={href('/info/faq')} className="label border border-white/30 px-4 py-3 hover:bg-white hover:text-graphite">ВСЕ ВОПРОСЫ</a>
                </div>
              </div>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── 7. Финал: оранжевое поле, одно действие ─────────────────────────── */
function Finale() {
  const { mySize } = useStore()
  const sale = useMemo(() => PRODUCTS.filter((p) => p.old).length, [])
  return (
    <section className="bg-mark py-16 text-white lg:py-24">
      <div className="mx-auto max-w-[1680px] px-3 text-center lg:px-6">
        <p className="label text-white/70">теперь выбирайте</p>
        <h2 className="display mt-4 text-[clamp(30px,7vw,96px)] leading-[0.94]">
          {PRODUCTS.length} позиций.
          <br />
          Каждая в одном экземпляре.
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-[15px] leading-snug text-white/80">
          Промокод <b>{SHOP.promo}</b> даёт −5% на первый заказ. {sale}{' '}
          {plural(sale, 'позиция', 'позиции', 'позиций')} уже с уценкой.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <a href={href(mySize ? `/catalog?size=${mySize}` : '/catalog')} className="label bg-white px-7 py-4 text-graphite transition hover:bg-graphite hover:text-white">
            {mySize ? `ОТКРЫТЬ КАТАЛОГ В РАЗМЕРЕ ${mySize}` : 'ОТКРЫТЬ КАТАЛОГ'}
          </a>
          <a href={href('/concierge')} className="label border border-white/60 px-7 py-4 transition hover:bg-white hover:text-graphite">
            НЕТ МОЕГО РАЗМЕРА
          </a>
        </div>
      </div>
    </section>
  )
}
