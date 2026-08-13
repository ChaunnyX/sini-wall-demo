import { useEffect, useState } from 'react'
import { img, inStock, type Product } from '../data/catalog'
import { SHOP } from '../data/shop'
import { discount, money } from '../lib/format'
import { href } from '../lib/router'
import { useStore } from '../lib/store'

/** Быстрый просмотр сбоку: посмотреть и взять, не уходя со стола. */
export function QuickView({ p, onClose }: { p: Product | null; onClose: () => void }) {
  const { take, mySize, fav, toggleFav } = useStore()
  const [shot, setShot] = useState(0)
  const [size, setSize] = useState<string | null>(null)

  useEffect(() => {
    setShot(0)
    setSize(p && p.sizes.length === 1 ? p.sizes[0].label : mySize && p?.sizes.some((s) => s.label === mySize) ? mySize : null)
  }, [p, mySize])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!p) return null
  const off = discount(p.price, p.old)
  const chosen = p.sizes.find((s) => s.label === size)

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-graphite/35 fade" onClick={onClose}>
      <aside
        className="drawer flex h-full w-[min(460px,100%)] flex-col overflow-y-auto border-l border-graphite bg-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="label text-mute">Быстрый просмотр</span>
          <button onClick={onClose} data-hint="закрыть" className="label px-2 py-1">ЗАКРЫТЬ ✕</button>
        </div>

        <div className="relative aspect-square bg-table">
          <img
            data-quick-shot
            src={img(p.images[shot])}
            alt={p.title}
            width={900}
            height={900}
            className="h-full w-full object-contain p-8"
            style={{ filter: 'drop-shadow(0 20px 20px rgba(16,17,20,.22))' }}
          />
          {p.images.length > 1 && (
            <div className="absolute inset-x-3 bottom-3 flex gap-1.5">
              {p.images.map((im, i) => (
                <button
                  key={im}
                  onClick={() => setShot(i)}
                  aria-label={`Кадр ${i + 1}`}
                  className={`h-1 flex-1 transition-colors ${i === shot ? 'bg-graphite' : 'bg-graphite/20'}`}
                />
              ))}
            </div>
          )}
          {off > 0 && <span className="mono absolute left-0 top-0 bg-graphite px-2 py-1 text-[10px] text-white">−{off}%</span>}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div>
            <p className="label text-mute">{p.brand} · {p.catRu}</p>
            <h2 className="mt-1 text-[20px] font-semibold leading-tight">{p.title}</h2>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="mono text-[24px] font-semibold">{money(p.price)}</span>
            {off > 0 && <span className="mono text-[13px] text-mute line-through">{money(p.old!)}</span>}
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className="label text-mute">{p.sizeSystem === 'EU' ? 'Размер, EU' : 'Размер'}</p>
              <p className="mono text-[10px] text-mute">
                {inStock(p) === 1 ? 'последняя вещь' : `${inStock(p)} шт на столе`}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSize(s.label)}
                  className={`mono min-w-[56px] border px-2.5 py-2 text-[12px] transition ${
                    size === s.label ? 'border-mark bg-mark text-white' : 'border-line hover:border-graphite'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {chosen?.eu && (
              <p className="mono mt-2 text-[10px] text-mute">
                EU {chosen.eu}
                {chosen.us && ` · US ${chosen.us}`}
                {chosen.cm && ` · по стельке ≈ ${chosen.cm} см`}
              </p>
            )}
          </div>

          <p className="text-[13px] leading-snug text-mute">{p.desc}</p>

          <div className="mt-auto grid gap-2">
            <button
              onClick={(e) => {
                if (!size) return
                take(p, size, e.currentTarget)
                onClose()
              }}
              data-hint={size ? 'взять' : 'выберите размер'}
              className={`label px-4 py-4 transition ${size ? 'bg-mark text-white hover:bg-mark-dim' : 'cursor-not-allowed bg-line text-mute'}`}
            >
              {size ? `ВЗЯТЬ РАЗМЕР ${size} · ${money(p.price)}` : 'ВЫБЕРИТЕ РАЗМЕР'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a href={href(`/p/${p.id}`)} onClick={onClose} className="label border border-graphite px-3 py-3 text-center hover:bg-graphite hover:text-white">
                ВСЯ КАРТОЧКА
              </a>
              <button
                onClick={() => toggleFav(p.id)}
                className={`label border px-3 py-3 ${fav.includes(p.id) ? 'border-graphite bg-graphite text-white' : 'border-graphite hover:bg-graphite hover:text-white'}`}
              >
                {fav.includes(p.id) ? 'ОТЛОЖЕНО' : 'ОТЛОЖИТЬ'}
              </button>
            </div>
            <p className="mono text-[10px] leading-snug text-mute">
              Оригинал · примерка на {SHOP.address} · СДЭК бесплатно от {money(SHOP.freeFrom)} · возврат 14 дней
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
