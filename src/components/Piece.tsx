import { useRef, useState } from 'react'
import { img, inStock, type Product } from '../data/catalog'
import { discount, money } from '../lib/format'
import { useStore } from '../lib/store'

export type Density = 'big' | 'grid' | 'dense' | 'list'

/**
 * Предмет на столе. Свет падает от курсора: тень уезжает в противоположную
 * сторону, предмет чуть приподнимается. Размеры видно сразу — открывать
 * карточку, чтобы это узнать, не нужно.
 */
export function Piece({
  p,
  density,
  onQuick,
}: {
  p: Product
  density: Density
  onQuick: (p: Product, el: HTMLImageElement | null) => void
}) {
  const { fav, toggleFav, mySize, take } = useStore()
  const box = useRef<HTMLDivElement>(null)
  const shot = useRef<HTMLImageElement>(null)
  const [hover, setHover] = useState(false)
  const off = discount(p.price, p.old)
  const liked = fav.includes(p.id)
  const sizes = p.sizes.filter((s) => s.stock > 0)
  const mine = mySize ? sizes.find((s) => s.label === mySize) : null
  const second = p.images[1] ?? p.images[0]

  const light = (e: React.MouseEvent) => {
    const el = box.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height
    el.style.setProperty('--tx', `${(dx * 14).toFixed(1)}px`)
    el.style.setProperty('--shadow-x', `${(-dx * 12).toFixed(1)}px`)
    el.style.setProperty('--shadow-y', `${(14 - dy * 8).toFixed(1)}px`)
  }

  if (density === 'list') {
    return (
      <article data-flip={p.id} className="flex items-center gap-4 border-b border-line py-3">
        <a href={`#/p/${p.id}`} data-hint="открыть" className="w-16 shrink-0">
          <img src={img(p.images[0])} alt="" width={120} height={120} loading="lazy" className="h-14 w-full object-contain" />
        </a>
        <div className="min-w-0 flex-1">
          <p className="label text-mute">{p.brand}</p>
          <a href={`#/p/${p.id}`} className="block truncate text-[14px] font-medium hover:text-mark">{p.title}</a>
        </div>
        <div className="mono hidden shrink-0 gap-1 sm:flex">
          {sizes.slice(0, 6).map((s) => (
            <button
              key={s.label}
              onClick={(e) => take(p, s.label, e.currentTarget)}
              className={`border px-1.5 py-1 text-[10px] ${mySize === s.label ? 'border-graphite bg-mark text-white' : 'border-line hover:border-graphite'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mono w-24 shrink-0 text-right text-[14px] font-semibold">{money(p.price)}</div>
      </article>
    )
  }

  const big = density === 'big'

  return (
    <article
      data-flip={p.id}
      ref={box}
      onMouseEnter={() => setHover(true)}
      onMouseMove={light}
      onMouseLeave={() => setHover(false)}
      className="piece group relative flex flex-col border border-line bg-sheet"
    >
      <a
        href={`#/p/${p.id}`}
        data-hint="открыть"
        onClick={() => sessionStorage.setItem('sini-from', p.id)}
        className={`relative block ${big ? 'aspect-4/3' : 'aspect-square'} overflow-visible`}
      >
        <span className="absolute inset-0 flex items-center justify-center p-[7%]">
          <img
            ref={shot}
            data-shot={p.id}
            src={img(hover ? second : p.images[0])}
            alt={p.title}
            width={900}
            height={900}
            loading="lazy"
            className="piece__shot max-h-full w-full object-contain"
          />
        </span>

        {/* Маркировка студии: что это за предмет и сколько его */}
        <span className="absolute left-0 top-0 flex flex-col items-start gap-px">
          {mine ? (
            <span className="mono bg-mark px-1.5 py-1 text-[9px] font-semibold tracking-[0.1em] text-white">ВАШ {mine.label}</span>
          ) : off > 0 ? (
            <span className="mono bg-graphite px-1.5 py-1 text-[9px] font-semibold tracking-[0.1em] text-white">−{off}%</span>
          ) : inStock(p) === 1 ? (
            <span className="mono bg-graphite/85 px-1.5 py-1 text-[9px] tracking-[0.1em] text-white">ПОСЛЕДНЯЯ</span>
          ) : null}
        </span>
      </a>

      <button
        onClick={() => toggleFav(p.id)}
        data-hint={liked ? 'убрать' : 'отложить'}
        aria-label={liked ? 'Убрать из избранного' : 'Отложить'}
        className={`absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center text-[13px] transition ${
          liked ? 'bg-graphite text-white' : 'bg-sheet/80 text-graphite opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
        }`}
      >
        {liked ? '●' : '○'}
      </button>

      <button
        onClick={() => onQuick(p, shot.current)}
        data-hint="быстрый просмотр"
        className="absolute bottom-[38%] left-1/2 -translate-x-1/2 translate-y-2 border border-graphite bg-sheet px-3 py-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <span className="label">СМОТРЕТЬ</span>
      </button>

      <div className={`flex flex-1 flex-col gap-1 border-t border-line ${big ? 'p-4' : 'p-2.5'}`}>
        <p className="label text-mute">{p.brand}</p>
        <a href={`#/p/${p.id}`} className={`font-medium leading-tight hover:text-mark ${big ? 'text-[17px]' : 'text-[13px]'}`}>
          {p.title}
        </a>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5">
          <span className={`mono font-semibold ${big ? 'text-[18px]' : 'text-[14px]'}`}>{money(p.price)}</span>
          {off > 0 && <span className="mono text-[11px] text-mute line-through">{money(p.old!)}</span>}
        </div>
        {density !== 'dense' && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {sizes.slice(0, big ? 8 : 4).map((s) => (
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
            {sizes.length > (big ? 8 : 4) && <span className="mono text-[10px] text-mute">+{sizes.length - (big ? 8 : 4)}</span>}
          </div>
        )}
      </div>
    </article>
  )
}
