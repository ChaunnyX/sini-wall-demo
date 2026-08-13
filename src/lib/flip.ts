import { useLayoutEffect, useRef } from 'react'

/**
 * Перестроение сетки без рывка: запоминаем, где карточки лежали, и доводим их
 * на новые места. Работает при смене плотности, фильтра и сортировки.
 */
export function useFlip(container: React.RefObject<HTMLElement | null>, key: string) {
  const prev = useRef<Map<string, DOMRect>>(new Map())

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-flip]'))
    const next = new Map<string, DOMRect>()
    nodes.forEach((n) => next.set(n.dataset.flip!, n.getBoundingClientRect()))

    if (!reduced && prev.current.size) {
      nodes.forEach((n) => {
        const id = n.dataset.flip!
        const was = prev.current.get(id)
        const now = next.get(id)!
        if (!was) {
          n.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], {
            duration: 320,
            easing: 'cubic-bezier(.22,.7,.3,1)',
          })
          return
        }
        const dx = was.left - now.left
        const dy = was.top - now.top
        const ds = was.width / (now.width || 1)
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(ds - 1) < 0.01) return
        n.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(${ds})` }, { transform: 'none' }],
          { duration: 480, easing: 'cubic-bezier(.22,.75,.25,1)' },
        )
      })
    }
    prev.current = next
  }, [key, container])
}

/** Снимок перелетает из сетки в открытую карточку — видно, что именно ты открыл. */
export function flyImage(from: HTMLImageElement | null, toSelector: string) {
  if (!from) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const a = from.getBoundingClientRect()
  const ghost = from.cloneNode(true) as HTMLImageElement
  ghost.className = 'ghost'
  Object.assign(ghost.style, {
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    transform: 'none',
    opacity: '1',
  })
  document.body.appendChild(ghost)

  let tries = 0
  const chase = () => {
    const target = document.querySelector(toSelector) as HTMLElement | null
    if (!target && tries++ < 30) return requestAnimationFrame(chase)
    if (!target) return ghost.remove()
    const b = target.getBoundingClientRect()
    ghost.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${
      b.top + b.height / 2 - (a.top + a.height / 2)
    }px) scale(${b.width / a.width})`
    target.style.opacity = '0'
    setTimeout(() => {
      target.style.transition = 'opacity .2s'
      target.style.opacity = '1'
      ghost.style.opacity = '0'
      setTimeout(() => ghost.remove(), 240)
    }, 560)
  }
  requestAnimationFrame(chase)
}
