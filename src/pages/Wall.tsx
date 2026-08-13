import { useEffect, useMemo, useRef, useState } from 'react'
import { APPAREL_SIZES, BRANDS, CATEGORIES, PRODUCTS, SHOE_SIZES, TOTAL_PAIRS, byId, img, type Product } from '../data/catalog'
import { FAQ, REVIEWS, SHOP, TRUST } from '../data/shop'
import { discount, money } from '../lib/format'
import { filterProducts, type Filters } from '../lib/search'
import { useFlip } from '../lib/flip'
import { go, href, type Route } from '../lib/router'
import { plural, useStore } from '../lib/store'
import { Piece, type Density } from '../components/Piece'
import { QuickView } from '../components/QuickView'

const DENSITY: { k: Density; l: string; cls: string }[] = [
  { k: 'big', l: 'Крупно', cls: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3' },
  { k: 'grid', l: 'Сетка', cls: 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5' },
  { k: 'dense', l: 'Плотно', cls: 'grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8' },
  { k: 'list', l: 'Списком', cls: 'flex flex-col' },
]
const SORTS = [
  { k: '', l: 'Сначала новинки' },
  { k: 'cheap', l: 'Сначала дешевле' },
  { k: 'rich', l: 'Сначала дороже' },
  { k: 'sale', l: 'Больше скидка' },
]
const STAR = 'krossovki-new-balance-m2002rdd'

export function Wall({ route }: { route: Route }) {
  const { setMySize } = useStore()
  const [density, setDensity] = useState<Density>(() => (localStorage.getItem('sini-density') as Density) || 'grid')
  const [quick, setQuick] = useState<Product | null>(null)
  const [openRail, setOpenRail] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const q = route.query

  const f: Filters = {
    q: q.get('q') || undefined,
    cat: q.get('cat') || undefined,
    group: q.get('group') || undefined,
    brand: q.get('brand') || undefined,
    size: q.get('size') || undefined,
    sale: q.get('sale') === '1' || undefined,
    fresh: q.get('fresh') === '1' || undefined,
    sort: q.get('sort') || undefined,
  }
  const clean = !f.q && !f.cat && !f.group && !f.brand && !f.size && !f.sale && !f.fresh

  const list = useMemo(() => filterProducts(f), [q.toString()]) // eslint-disable-line react-hooks/exhaustive-deps
  useFlip(gridRef, `${q.toString()}|${density}`)

  useEffect(() => localStorage.setItem('sini-density', density), [density])

  // Выкладываем предметы на стол по мере прокрутки
  useEffect(() => {
    const root = gridRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target as HTMLElement).classList.add('on')),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.02 },
    )
    root.querySelectorAll('.lay').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [list, density])

  const set = (k: string, v?: string | null) => {
    const n = new URLSearchParams(q.toString())
    if (!v) n.delete(k)
    else n.set(k, v)
    go(`/${n.toString() ? `?${n}` : ''}`, true)
  }

  const chips: { l: string; clear: () => void }[] = []
  if (f.q) chips.push({ l: `«${f.q}»`, clear: () => set('q', null) })
  if (f.cat) chips.push({ l: CATEGORIES.find((c) => c.slug === f.cat)?.ru ?? f.cat, clear: () => set('cat', null) })
  if (f.brand) chips.push({ l: f.brand, clear: () => set('brand', null) })
  if (f.size) chips.push({ l: `Размер ${f.size}`, clear: () => set('size', null) })
  if (f.sale) chips.push({ l: 'Со скидкой', clear: () => set('sale', null) })
  if (f.fresh) chips.push({ l: 'Новинки', clear: () => set('fresh', null) })

  const cls = DENSITY.find((d) => d.k === density)!.cls
  const star = byId(STAR)

  const Rail = (
    <div className="flex flex-col gap-5 text-[13px]">
      <div>
        <p className="label mb-2 text-mute">Ваш размер</p>
        <div className="flex flex-wrap gap-1">
          {SHOE_SIZES.map((s) => {
            const n = PRODUCTS.filter((p) => p.sizes.some((x) => x.label === s && x.stock > 0)).length
            return (
              <button
                key={s}
                disabled={!n}
                onClick={() => {
                  set('size', f.size === s ? null : s)
                  if (f.size !== s) setMySize(s)
                }}
                className={`mono border px-1.5 py-1 text-[11px] transition ${
                  f.size === s ? 'border-mark bg-mark text-white' : n ? 'border-line hover:border-graphite' : 'border-line/60 text-mute/35'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {APPAREL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => set('size', f.size === s ? null : s)}
              className={`mono border px-1.5 py-1 text-[11px] ${f.size === s ? 'border-mark bg-mark text-white' : 'border-line hover:border-graphite'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label mb-2 text-mute">Категория</p>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => set('cat', f.cat === c.slug ? null : c.slug)}
            className={`flex w-full items-baseline justify-between gap-2 border-b border-line py-1.5 text-left ${f.cat === c.slug ? 'font-semibold text-mark' : 'hover:text-mark'}`}
          >
            {c.ru}
            <span className="mono text-[10px] text-mute">{c.count}</span>
          </button>
        ))}
      </div>

      <div>
        <p className="label mb-2 text-mute">Бренд</p>
        {BRANDS.map((b) => (
          <button
            key={b.slug}
            onClick={() => set('brand', f.brand === b.name ? null : b.name)}
            className={`flex w-full items-baseline justify-between gap-2 border-b border-line py-1.5 text-left ${f.brand === b.name ? 'font-semibold text-mark' : 'hover:text-mark'}`}
          >
            {b.name}
            <span className="mono text-[10px] text-mute">{b.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-1">
        <button onClick={() => set('sale', f.sale ? null : '1')} className={`border px-3 py-2 text-left ${f.sale ? 'border-mark bg-mark text-white' : 'border-line hover:border-graphite'}`}>
          Только со скидкой
        </button>
        <button onClick={() => set('fresh', f.fresh ? null : '1')} className={`border px-3 py-2 text-left ${f.fresh ? 'border-mark bg-mark text-white' : 'border-line hover:border-graphite'}`}>
          Только новинки
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative z-10">
      {/* Строка состояния стола вместо героя-постера */}
      <div className="border-b border-line bg-table/70 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-5 gap-y-2 px-3 py-3 lg:px-6">
          <h1 className="display text-[clamp(18px,2.4vw,26px)]">
            {f.q ? `«${f.q}»` : f.cat ? CATEGORIES.find((c) => c.slug === f.cat)?.ru : f.brand ? f.brand : f.sale ? 'Уценённое' : 'Весь стол'}
          </h1>
          <p className="mono text-[11px] text-mute">
            <b className="text-graphite">{list.length}</b> {plural(list.length, 'позиция', 'позиции', 'позиций')} ·{' '}
            {TOTAL_PAIRS} {plural(TOTAL_PAIRS, 'вещь', 'вещи', 'вещей')} · каждая в одном экземпляре
          </p>

          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setOpenRail(true)} className="label border border-graphite px-3 py-2 lg:hidden">
              ФИЛЬТРЫ{chips.length ? ` · ${chips.length}` : ''}
            </button>
            <div className="hidden items-center border border-line bg-sheet sm:flex">
              {DENSITY.map((d) => (
                <button
                  key={d.k}
                  onClick={() => setDensity(d.k)}
                  data-hint="вид"
                  className={`label px-2.5 py-2 transition ${density === d.k ? 'bg-graphite text-white' : 'hover:bg-table'}`}
                >
                  {d.l}
                </button>
              ))}
            </div>
            <select
              value={f.sort || ''}
              onChange={(e) => set('sort', e.target.value || null)}
              className="mono border border-line bg-sheet px-2 py-2 text-[11px]"
            >
              {SORTS.map((s) => (
                <option key={s.k} value={s.k}>{s.l}</option>
              ))}
            </select>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-1.5 px-3 pb-3 lg:px-6">
            {chips.map((c) => (
              <button key={c.l} onClick={c.clear} className="mono flex items-center gap-1.5 border border-graphite bg-sheet px-2.5 py-1.5 text-[11px] hover:bg-mark hover:text-white">
                {c.l} <span>✕</span>
              </button>
            ))}
            <a href={href('/')} className="label px-2 py-1.5 text-mute underline">сбросить всё</a>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1680px] px-3 py-5 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[212px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-none">{Rail}</div>
          </aside>

          <div>
            {/* Один предмет под лампой — взгляду есть за что зацепиться до сетки */}
            {clean && star && (
              <section className="lay on mb-4 grid items-center gap-4 border border-line bg-sheet p-4 sm:grid-cols-[1.15fr_1fr] lg:p-6">
                <a href={href(`/p/${star.id}`)} className="sweep relative block overflow-hidden" data-hint="открыть">
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(closest-side, rgba(255,244,224,.9), transparent 70%)' }}
                  />
                  <img
                    src={img(star.images[0])}
                    alt={star.title}
                    width={900}
                    height={900}
                    className="relative mx-auto h-[clamp(150px,26vw,290px)] w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 26px 22px rgba(16,17,20,.24))' }}
                  />
                </a>
                <div>
                  <p className="label text-mark">предмет дня</p>
                  <h2 className="mt-2 text-[clamp(20px,2.6vw,30px)] font-semibold leading-tight">{star.title}</h2>
                  <p className="mt-2 max-w-[46ch] text-[14px] leading-snug text-mute">{star.desc}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    <span className="mono text-[24px] font-semibold">{money(star.price)}</span>
                    <span className="mono text-[11px] text-mute">
                      размер {star.sizes.map((s) => s.label).join(', ')} · {star.sizes.length === 1 ? 'последняя вещь' : 'в наличии'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setQuick(star)} data-hint="быстрый просмотр" className="label bg-mark px-4 py-3 text-white hover:bg-mark-dim">
                      ПОСМОТРЕТЬ БЛИЖЕ
                    </button>
                    <a href={href(`/p/${star.id}`)} className="label border border-graphite px-4 py-3 hover:bg-graphite hover:text-white">
                      ВСЯ КАРТОЧКА
                    </a>
                  </div>
                </div>
              </section>
            )}

            {list.length === 0 ? (
              <div className="border border-line bg-sheet p-10 text-center">
                <p className="display text-[26px]">На столе пусто</p>
                <p className="mx-auto mt-2 max-w-[48ch] text-[14px] text-mute">
                  Каждая вещь у нас в одном экземпляре, поэтому узкий фильтр быстро упирается в пустоту.
                  Снимите часть условий — или закажите модель под себя.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <a href={href('/')} className="label border border-graphite px-4 py-3 hover:bg-graphite hover:text-white">СБРОСИТЬ</a>
                  <a href={href('/concierge')} className="label bg-mark px-4 py-3 text-white">ЗАКАЗАТЬ ПОДБОР</a>
                </div>
              </div>
            ) : (
              <div ref={gridRef}>
                {chunk(list, 16).map((shelf, si) => (
                  <section key={si}>
                    {si > 0 && (
                      <div className="my-5 flex items-center gap-3">
                        <span className="mono text-[10px] tracking-[0.2em] text-mute">РЯД {String(si + 1).padStart(2, '0')}</span>
                        <span className="h-px flex-1 bg-line" />
                      </div>
                    )}
                    <div className={cls}>
                      {shelf.map((p, i) => (
                        <div key={p.id} className="lay" style={{ transitionDelay: `${Math.min(i, 8) * 35}ms` }}>
                          <Piece p={p} density={density} onQuick={(prod) => setQuick(prod)} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ниже стола — то, что снимает тревогу, коротко и по делу */}
      <section className="border-t border-line bg-sheet">
        <div className="mx-auto grid max-w-[1680px] gap-px bg-line px-0 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.t} className="bg-sheet p-5">
              <p className="text-[15px] font-semibold">{t.t}</p>
              <p className="mt-1 text-[13px] leading-snug text-mute">{t.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-3 py-12 lg:grid-cols-[1fr_1fr] lg:px-6">
          <div>
            <p className="label text-mark">оффлайн</p>
            <h2 className="display mt-2 text-[clamp(26px,4vw,46px)]">Всё это лежит в Воронеже</h2>
            <p className="mt-3 max-w-[48ch] text-[15px] leading-snug text-mute">
              {SHOP.address}. Здесь то же самое можно взять в руки, померить и забрать сразу. Перед визитом за конкретной
              вещью напишите — отложим.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="display text-[44px] leading-none">{SHOP.rating.value}</span>
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
          </div>
          <div className="grid gap-4">
            {REVIEWS.slice(0, 2).map((r) => (
              <figure key={r.date} className="border-l-2 border-mark pl-4">
                <blockquote className="text-[14px] leading-snug">«{r.text}»</blockquote>
                <figcaption className="mono mt-2 text-[10px] text-mute">{r.name} · {r.date}</figcaption>
              </figure>
            ))}
            <div className="border-t border-line pt-4">
              {FAQ.slice(0, 3).map((x) => (
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

      {openRail && (
        <div className="fixed inset-0 z-50 bg-graphite/40 lg:hidden" onClick={() => setOpenRail(false)}>
          <div className="drawer absolute inset-y-0 right-0 w-[86%] max-w-[340px] overflow-y-auto border-l border-graphite bg-sheet p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="display text-[20px]">Фильтры</span>
              <button onClick={() => setOpenRail(false)} className="label px-2 py-1">✕</button>
            </div>
            {Rail}
            <button onClick={() => setOpenRail(false)} className="label mt-5 w-full bg-graphite py-3.5 text-white">
              ПОКАЗАТЬ {list.length}
            </button>
          </div>
        </div>
      )}

      <QuickView p={quick} onClose={() => setQuick(null)} />
    </div>
  )
}

const chunk = (arr: Product[], n: number) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

export const discountOf = discount
