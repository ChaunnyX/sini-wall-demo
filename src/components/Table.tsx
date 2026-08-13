import { useEffect, useRef, useState } from 'react'

/** Стол: свет студии идёт за курсором, поверх — разметка и зерно. Ниже всего контента. */
export function TableBg() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let tx = 0.5, ty = 0.3, x = 0.5, y = 0.3
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth
      ty = e.clientY / window.innerHeight
    }
    const loop = () => {
      x += (tx - x) * 0.05
      y += (ty - y) * 0.05
      const el = ref.current
      if (el) {
        el.style.setProperty('--lx', (x * 100).toFixed(2) + '%')
        el.style.setProperty('--ly', (y * 100).toFixed(2) + '%')
      }
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
    <div ref={ref} aria-hidden className="table-bg">
      <div className="table-bg__light" />
      <div className="table-bg__grid" />
      <div className="table-bg__vignette" />
      <div className="table-bg__grain" />
    </div>
  )
}

/** Переход между экранами: короткая штора, чтобы смена страницы читалась как движение. */
export function Shutter() {
  const [n, setN] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const on = () => {
      if (first.current) {
        first.current = false
        return
      }
      setN((v) => v + 1)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  if (!n) return null
  return <div key={n} aria-hidden className="shutter" />
}

/** Курсор-подсказка: точка, которая рассказывает, что случится по клику. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [down, setDown] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let tx = -100, ty = -100, x = -100, y = -100
    const move = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      const el = (e.target as HTMLElement)?.closest?.('[data-hint]') as HTMLElement | null
      setHint(el ? el.dataset.hint || null : null)
    }
    const loop = () => {
      x += (tx - x) * 0.22
      y += (ty - y) * 0.22
      const el = dot.current
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    const dn = () => setDown(true)
    const up = () => setDown(false)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', dn)
    window.addEventListener('pointerup', up)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', dn)
      window.removeEventListener('pointerup', up)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={dot}
      aria-hidden
      className="dot hidden md:grid"
      style={{
        width: hint ? 74 : down ? 10 : 14,
        height: hint ? 74 : down ? 10 : 14,
        background: hint ? 'var(--color-mark)' : 'rgba(16,17,20,.85)',
        opacity: 0.95,
      }}
    >
      {hint && <span className="label text-[9px] text-white">{hint}</span>}
    </div>
  )
}
