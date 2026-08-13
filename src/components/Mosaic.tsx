import { useEffect, useMemo, useRef } from 'react'
import { img, inStock, type Product } from '../data/catalog'
import { discount, money } from '../lib/format'
import { href } from '../lib/router'
import { useStore } from '../lib/store'

/**
 * Стена экспозиции. Плитки разного роста, колонки едут с разной скоростью —
 * при прокрутке стена «дышит», а не ползёт единым полотном. Вещь при наведении
 * выходит вперёд и отбрасывает длинную тень, как под витринной лампой.
 */
const SHAPES = ['tall', 'wide', 'norm', 'norm', 'tall', 'norm', 'wide', 'norm'] as const
type Shape = (typeof SHAPES)[number]

const ASPECT: Record<Shape, string> = {
  tall: 'aspect-[4/5]',
  wide: 'aspect-[5/4]',
  norm: 'aspect-square',
}

export function Mosaic({
  list,
  onQuick,
  lead,
  promo,
}: {
  list: Product[]
  onQuick: (p: Product) => void
  lead?: React.ReactNode
  promo?: React.ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const cols = useMemo(() => splitColumns(list, 4), [list])

  // Колонки движутся с разной скоростью — глубина без единой лишней картинки
  useEffect(() => {
    const root = wrap.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(max-width: 767px)').matches) return
    const columns = Array.from(root.querySelectorAll<HTMLElement>('[data-col]'))
    const speeds = [0, -0.055, -0.02, -0.085]
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const top = root.getBoundingClientRect().top
        const shift = Math.max(-600, Math.min(600, -top * 0.5))
        columns.forEach((c, i) => {
          c.style.transform = `translate3d(0, ${(shift * speeds[i % speeds.length]).toFixed(1)}px, 0)`
        })
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
    <div ref={wrap} className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
      {cols.map((col, ci) => (
        <div key={ci} data-col className="flex flex-col gap-2.5 will-change-transform" style={{ transition: 'transform .12s linear' }}>
          {ci === 0 && lead}
          {col.map((p, i) => (
            <span key={p.id} className="contents">
              {ci === 2 && i === 2 && promo}
              <Tile p={p} shape={SHAPES[(ci * 3 + i) % SHAPES.length]} onQuick={onQuick} />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function Tile({ p, shape, onQuick }: { p: Product; shape: Shape; onQuick: (p: Product) => void }) {
  const { mySize, take, fav, toggleFav } = useStore()
  const box = useRef<HTMLDivElement>(null)
  const off = discount(p.price, p.old)
  const sizes = p.sizes.filter((s) => s.stock > 0)
  const mine = mySize ? sizes.find((s) => s.label === mySize) : null
  const liked = fav.includes(p.id)

  const light = (e: React.MouseEvent) => {
    const el = box.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height
    el.style.setProperty('--tx', `${(dx * 12).toFixed(1)}px`)
    el.style.setProperty('--shadow-x', `${(-dx * 16).toFixed(1)}px`)
    el.style.setProperty('--shadow-y', `${(16 - dy * 10).toFixed(1)}px`)
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <article
      ref={box}
      data-flip={p.id}
      onMouseMove={light}
      className="piece group relative flex flex-col border border-line bg-sheet"
      style={{ ['--gx' as string]: '50%', ['--gy' as string]: '30%' }}
    >
      <a href={href(`/p/${p.id}`)} data-hint="открыть" className={`relative block ${ASPECT[shape]}`}>
        {/* Луч витрины под курсором */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(closest-side at var(--gx) var(--gy), rgba(255,246,228,.95), transparent 72%)' }}
        />
        <span className="absolute inset-0 flex items-center justify-center p-[8%]">
          <img
            data-shot={p.id}
            src={img(p.images[0])}
            alt={p.title}
            width={900}
            height={900}
            loading="lazy"
            className="piece__shot max-h-full w-full object-contain"
          />
        </span>

        <span className="absolute left-0 top-0 flex flex-col items-start gap-px">
          {mine ? (
            <span className="mono bg-mark px-1.5 py-1 text-[9px] font-semibold tracking-[0.1em] text-white">ВАШ {mine.label}</span>
          ) : off > 0 ? (
            <span className="mono bg-graphite px-1.5 py-1 text-[9px] font-semibold tracking-[0.1em] text-white">−{off}%</span>
          ) : inStock(p) === 1 ? (
            <span className="mono bg-graphite/80 px-1.5 py-1 text-[9px] tracking-[0.1em] text-white">ПОСЛЕДНЯЯ</span>
          ) : null}
        </span>
      </a>

      <button
        onClick={() => toggleFav(p.id)}
        aria-label={liked ? 'Убрать' : 'Отложить'}
        data-hint={liked ? 'убрать' : 'отложить'}
        className={`absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center text-[12px] transition ${
          liked ? 'bg-graphite text-white' : 'bg-sheet/85 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
      >
        {liked ? '●' : '○'}
      </button>

      <button
        onClick={() => onQuick(p)}
        data-hint="быстрый просмотр"
        className="absolute bottom-[32%] left-1/2 -translate-x-1/2 translate-y-2 border border-graphite bg-sheet px-3 py-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <span className="label">СМОТРЕТЬ</span>
      </button>

      <div className="flex flex-1 flex-col gap-1 border-t border-line p-2.5">
        <p className="label text-mute">{p.brand}</p>
        <a href={href(`/p/${p.id}`)} className="text-[13px] font-medium leading-tight hover:text-mark">
          {p.title}
        </a>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5">
          <span className="mono text-[14px] font-semibold">{money(p.price)}</span>
          {off > 0 && <span className="mono text-[11px] text-mute line-through">{money(p.old!)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {sizes.slice(0, 4).map((s) => (
            <button
              key={s.label}
              onClick={(e) => take(p, s.label, e.currentTarget)}
              data-hint="взять"
              className={`mono border px-1.5 py-0.5 text-[10px] leading-none transition ${
                mySize === s.label ? 'border-mark bg-mark text-white' : 'border-line hover:border-graphite'
              }`}
            >
              {s.label}
            </button>
          ))}
          {sizes.length > 4 && <span className="mono text-[10px] text-mute">+{sizes.length - 4}</span>}
        </div>
      </div>
    </article>
  )
}

/** Раскладываем по колонкам по очереди — порядок сортировки читается слева направо. */
function splitColumns<T>(items: T[], n: number): T[][] {
  const cols: T[][] = Array.from({ length: n }, () => [])
  items.forEach((it, i) => cols[i % n].push(it))
  return cols
}
