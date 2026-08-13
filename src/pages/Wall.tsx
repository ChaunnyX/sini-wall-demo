import { useEffect, useMemo, useRef, useState } from 'react'
import { APPAREL_SIZES, BRANDS, CATEGORIES, PRODUCTS, SHOE_SIZES, TOTAL_PAIRS, type Product } from '../data/catalog'
import { FAQ, REVIEWS, SHOP, TRUST } from '../data/shop'
import { money } from '../lib/format'
import { filterProducts, type Filters } from '../lib/search'
import { useFlip } from '../lib/flip'
import { go, href, type Route } from '../lib/router'
import { plural, useStore } from '../lib/store'
import { Piece, type Density } from '../components/Piece'
import { Mosaic } from '../components/Mosaic'
import { QuickView } from '../components/QuickView'

type View = 'wall' | 'big' | 'dense' | 'list'
const VIEWS: { k: View; l: string }[] = [
  { k: 'wall', l: 'Стена' },
  { k: 'big', l: 'Крупно' },
  { k: 'dense', l: 'Плотно' },
  { k: 'list', l: 'Списком' },
]
const CLS: Record<Exclude<View, 'wall'>, string> = {
  big: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
  dense: 'grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8',
  list: 'flex flex-col',
}
const SORTS = [
  { k: '', l: 'Сначала новинки' },
  { k: 'cheap', l: 'Сначала дешевле' },
  { k: 'rich', l: 'Сначала дороже' },
  { k: 'sale', l: 'Больше скидка' },
]

export function Wall({ route }: { route: Route }) {
  const { setMySize } = useStore()
  const [view, setView] = useState<View>(() => (localStorage.getItem('sini-view') as View) || 'wall')
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
  useFlip(gridRef, `${q.toString()}|${view}`)
  useEffect(() => localStorage.setItem('sini-view', view), [view])

  const set = (k: string, v?: string | null) => {
    const n = new URLSearchParams(q.toString())
    if (!v) n.delete(k)
    else n.set(k, v)
    go(`/catalog${n.toString() ? `?${n}` : ''}`, true)
  }

  const chips: { l: string; clear: () => void }[] = []
  if (f.q) chips.push({ l: `«${f.q}»`, clear: () => set('q', null) })
  if (f.cat) chips.push({ l: CATEGORIES.find((c) => c.slug === f.cat)?.ru ?? f.cat, clear: () => set('cat', null) })
  if (f.brand) chips.push({ l: f.brand, clear: () => set('brand', null) })
  if (f.size) chips.push({ l: `Размер ${f.size}`, clear: () => set('size', null) })
  if (f.sale) chips.push({ l: 'Со скидкой', clear: () => set('sale', null) })
  if (f.fresh) chips.push({ l: 'Новинки', clear: () => set('fresh', null) })

  const title = f.q ? `«${f.q}»` : f.cat ? CATEGORIES.find((c) => c.slug === f.cat)?.ru : f.brand ? f.brand : f.sale ? 'Уценённое' : f.fresh ? 'Новинки' : 'Вся стена'

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

  /** Текстовая плитка живёт внутри стены — заголовок не отнимает у товара экран */
  const LeadTile = (
    <div className="relative flex aspect-[4/5] flex-col justify-between border border-graphite bg-graphite p-4 text-white">
      <div>
        <p className="label text-mark">{SHOP.city} · с {SHOP.since}</p>
        <p className="display mt-3 text-[clamp(30px,4.4vw,58px)] leading-[0.92]">
          {PRODUCTS.length}
          <br />
          вещей
        </p>
        <p className="mt-3 max-w-[24ch] text-[13px] leading-snug text-white/65">
          Мультибренд SINI. Возим штучно: почти у каждой позиции остался один размер — забрали, и она ушла со стены.
        </p>
      </div>
      <dl className="mono grid grid-cols-2 gap-y-2 border-t border-white/15 pt-3 text-[10px] text-white/55">
        <div>
          <dt>штук в наличии</dt>
          <dd className="text-[15px] text-white">{TOTAL_PAIRS}</dd>
        </div>
        <div>
          <dt>брендов</dt>
          <dd className="text-[15px] text-white">{BRANDS.length}</dd>
        </div>
        <div>
          <dt>размеров обуви</dt>
          <dd className="text-[15px] text-white">{SHOE_SIZES.length}</dd>
        </div>
        <div>
          <dt>оценка на картах</dt>
          <dd className="text-[15px] text-white">{SHOP.rating.value}</dd>
        </div>
      </dl>
    </div>
  )

  const PromoTile = (
    <a
      href={href('/concierge')}
      data-hint="открыть"
      className="group relative flex aspect-square flex-col justify-between border border-mark bg-mark p-4 text-white"
    >
      <div>
        <p className="label text-white/80">consierge</p>
        <p className="display mt-3 text-[clamp(20px,2.4vw,30px)] leading-[0.95]">
          Нет вашего
          <br />
          размера?
        </p>
      </div>
      <div>
        <p className="text-[13px] leading-snug text-white/85">
          Привезём под заказ: находим редкие модели и нужный размер, показываем фото до отправки.
        </p>
        <span className="label mt-3 inline-block border-b border-white pb-0.5">ОСТАВИТЬ ЗАПРОС →</span>
      </div>
    </a>
  )

  return (
    <div className="relative z-10">
      {/* Панель управления стеной */}
      <div className="sticky top-[57px] z-30 border-b border-line bg-table/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 lg:px-6">
          <h1 className="display text-[clamp(16px,2vw,22px)]">{title}</h1>
          <p className="mono text-[11px] text-mute">
            <b className="text-graphite">{list.length}</b> {plural(list.length, 'позиция', 'позиции', 'позиций')}
            {f.size ? ` в размере ${f.size}` : ''}
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setOpenRail(true)} className="label border border-graphite px-3 py-2 lg:hidden">
              ФИЛЬТРЫ{chips.length ? ` · ${chips.length}` : ''}
            </button>
            <div className="hidden items-center border border-line bg-sheet sm:flex">
              {VIEWS.map((d) => (
                <button
                  key={d.k}
                  onClick={() => setView(d.k)}
                  data-hint="вид"
                  className={`label px-2.5 py-2 transition ${view === d.k ? 'bg-graphite text-white' : 'hover:bg-table'}`}
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
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-1.5 px-3 pb-2.5 lg:px-6">
            {chips.map((c) => (
              <button key={c.l} onClick={c.clear} className="mono flex items-center gap-1.5 border border-graphite bg-sheet px-2.5 py-1.5 text-[11px] hover:bg-mark hover:text-white">
                {c.l} <span>✕</span>
              </button>
            ))}
            <a href={href('/catalog')} className="label px-2 py-1.5 text-mute underline">сбросить всё</a>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1680px] px-3 py-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[204px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2 scrollbar-none">{Rail}</div>
          </aside>

          <div ref={gridRef}>
            {list.length === 0 ? (
              <div className="border border-line bg-sheet p-10 text-center">
                <p className="display text-[26px]">На стене пусто</p>
                <p className="mx-auto mt-2 max-w-[48ch] text-[14px] text-mute">
                  Каждая вещь у нас в одном экземпляре, поэтому узкий фильтр быстро упирается в пустоту.
                  Снимите часть условий — или закажите модель под себя.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <a href={href('/catalog')} className="label border border-graphite px-4 py-3 hover:bg-graphite hover:text-white">СБРОСИТЬ</a>
                  <a href={href('/concierge')} className="label bg-mark px-4 py-3 text-white">ЗАКАЗАТЬ ПОДБОР</a>
                </div>
              </div>
            ) : view === 'wall' ? (
              <Mosaic list={list} onQuick={setQuick} lead={clean ? LeadTile : undefined} promo={clean ? PromoTile : undefined} />
            ) : (
              <div className={CLS[view]}>
                {list.map((p) => (
                  <Piece key={p.id} p={p} density={view as Density} onQuick={(prod) => setQuick(prod)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="border-t border-line bg-sheet">
        <div className="mx-auto grid max-w-[1680px] gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="display mt-2 text-[clamp(24px,3.6vw,42px)]">Всё это лежит в Воронеже</h2>
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
            <div className="mt-6 border border-graphite bg-sheet p-4">
              <p className="label text-mute">ПРОМОКОД НА ПЕРВЫЙ ЗАКАЗ</p>
              <Promo />
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

function Promo() {
  const { say } = useStore()
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(SHOP.promo).catch(() => {})
        setDone(true)
        say('Промокод скопирован')
        setTimeout(() => setDone(false), 2000)
      }}
      className="mt-2 flex w-full items-center justify-between gap-3 border border-dashed border-graphite bg-table px-4 py-3"
    >
      <span className="display text-[24px] leading-none">{SHOP.promo}</span>
      <span className="label">{done ? 'СКОПИРОВАНО ✓' : `${SHOP.promoText} · НАЖМИТЕ`}</span>
    </button>
  )
}

export { money }
