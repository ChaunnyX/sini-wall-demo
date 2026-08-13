import { useEffect, useRef, useState } from 'react'
import { img } from '../data/catalog'
import { money } from '../lib/format'
import { go } from '../lib/router'
import { useStore } from '../lib/store'

/**
 * Момент покупки: вещь поднимают со стола под лампу, на снимок ложится штамп,
 * запускается получасовая бронь. При закрытии снимок улетает в корзину.
 */
export function BoxTake() {
  const { theatre, closeTheatre } = useStore()
  const shot = useRef<HTMLImageElement>(null)
  const [left, setLeft] = useState(30 * 60)

  useEffect(() => {
    if (!theatre) return
    setLeft(30 * 60)
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fly()
    window.addEventListener('keydown', esc)
    return () => {
      clearInterval(t)
      window.removeEventListener('keydown', esc)
    }
  }, [theatre]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!theatre) return null
  const { product, size } = theatre

  function fly(then?: () => void) {
    const src = shot.current
    const target = document.querySelector('[data-cart-anchor]')
    if (!src || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      closeTheatre()
      then?.()
      return
    }
    const a = src.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    const ghost = src.cloneNode(true) as HTMLImageElement
    ghost.className = 'ghost'
    Object.assign(ghost.style, {
      left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
      transform: 'none', opacity: '1',
    })
    document.body.appendChild(ghost)
    closeTheatre()
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${
        b.top + b.height / 2 - (a.top + a.height / 2)
      }px) scale(0.07) rotate(10deg)`
      ghost.style.opacity = '0.2'
    })
    setTimeout(() => {
      ghost.remove()
      then?.()
    }, 660)
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <div className="fade fixed inset-0 z-70 grid place-items-center bg-graphite/55 p-4 backdrop-blur-[2px]" onClick={() => fly()}>
      <div className="w-[min(520px,94vw)] border border-graphite bg-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-4/3 bg-table">
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(closest-side, rgba(255,248,236,.95), transparent 70%)' }}
          />
          <img
            ref={shot}
            src={img(product.images[0])}
            alt={product.title}
            width={900}
            height={900}
            className="relative h-full w-full object-contain p-8"
            style={{ filter: 'drop-shadow(0 26px 20px rgba(16,17,20,.28))' }}
          />
          <span className="stamp pointer-events-none absolute right-4 top-4 border-[3px] border-mark px-3 py-1.5 text-mark">
            <span className="display block text-[19px] leading-none">снято со стола</span>
            <span className="mono mt-1 block text-center text-[9px] tracking-[0.22em]">SINI · {size}</span>
          </span>
        </div>

        <div className="border-t border-line p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p className="label text-mute">{product.brand}</p>
              <p className="truncate text-[15px] font-semibold">{product.title}</p>
            </div>
            <p className="mono text-[17px] font-semibold">{money(product.price)}</p>
          </div>

          <div className="mono mt-3 flex items-center justify-between border border-graphite px-3 py-2 text-[12px]">
            <span>РАЗМЕР {size} · ДЕРЖИМ ЗА ВАМИ</span>
            <b>{mm}:{ss}</b>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => fly(() => go('/cart'))} className="label flex-1 bg-mark px-4 py-3.5 text-white hover:bg-mark-dim">
              ОФОРМИТЬ ЗАКАЗ
            </button>
            <button onClick={() => fly()} className="label border border-graphite px-4 py-3.5 hover:bg-graphite hover:text-white">
              СМОТРЕТЬ ДАЛЬШЕ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
