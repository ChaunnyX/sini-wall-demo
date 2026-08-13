import { useEffect, useMemo, useState } from 'react'
import { PRODUCTS, byId, img, inStock, type Product } from '../data/catalog'
import { SHOP } from '../data/shop'
import { crossSell, similar } from '../lib/search'
import { discount, money, perMonth } from '../lib/format'
import { flyImage } from '../lib/flip'
import { href } from '../lib/router'
import { useStore } from '../lib/store'

const SEEN = 'sini-wall-seen'

export function Item({ id }: { id: string }) {
  const p = byId(id)
  const { take, fav, toggleFav, mySize, say } = useStore()
  const [shot, setShot] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [taken, setTaken] = useState(false)

  useEffect(() => {
    setShot(0)
    setTaken(false)
    setSize(p && p.sizes.length === 1 ? p.sizes[0].label : mySize && p?.sizes.some((s) => s.label === mySize) ? mySize : null)
    window.scrollTo({ top: 0 })
    if (p) {
      const prev: string[] = JSON.parse(localStorage.getItem(SEEN) || '[]')
      localStorage.setItem(SEEN, JSON.stringify([p.id, ...prev.filter((x) => x !== p.id)].slice(0, 8)))
      // снимок перелетает из сетки в карточку — видно, что именно открыли
      const from = document.querySelector<HTMLImageElement>(`[data-shot="${p.id}"]`)
      if (from) flyImage(from, '[data-item-shot]')
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const seen = useMemo(() => {
    const ids: string[] = JSON.parse(localStorage.getItem(SEEN) || '[]')
    return ids.filter((x) => x !== id).map(byId).filter(Boolean).slice(0, 4) as Product[]
  }, [id])

  if (!p) {
    return (
      <div className="relative z-10 mx-auto max-w-[680px] px-4 py-24 text-center">
        <h1 className="display text-[34px]">Такой вещи нет</h1>
        <p className="mt-2 text-[15px] text-mute">Возможно, её уже забрали — позиции у нас в одном экземпляре.</p>
        <a href={href('/')} className="label mt-5 inline-block bg-graphite px-4 py-3 text-white">ВЕРНУТЬСЯ НА СТОЛ</a>
      </div>
    )
  }

  const off = discount(p.price, p.old)
  const chosen = p.sizes.find((s) => s.label === size)
  const liked = fav.includes(p.id)
  const cross = crossSell(p, mySize)
  const near = similar(p)

  return (
    <div className="relative z-10 mx-auto max-w-[1680px] px-3 py-6 lg:px-6 lg:py-10">
      <nav className="label text-mute">
        <a href={href('/')} className="hover:text-graphite">Стол</a> /{' '}
        <a href={href(`/?cat=${p.cat}`)} className="hover:text-graphite">{p.catRu}</a> /{' '}
        <a href={href(`/?brand=${encodeURIComponent(p.brand)}`)} className="hover:text-graphite">{p.brand}</a>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div>
          <div className="relative aspect-square border border-line bg-sheet">
            <span
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(closest-side, rgba(255,246,230,.85), transparent 72%)' }}
            />
            <img
              data-item-shot
              src={img(p.images[shot])}
              alt={p.title}
              width={1200}
              height={1200}
              className="relative h-full w-full object-contain p-[9%]"
              style={{ filter: 'drop-shadow(0 30px 26px rgba(16,17,20,.22))' }}
            />
            {off > 0 && <span className="mono absolute left-0 top-0 bg-mark px-2 py-1 text-[11px] text-white">−{off}%</span>}
            <span className="mono absolute right-0 top-0 bg-graphite px-2 py-1 text-[10px] text-white">
              {inStock(p) === 1 ? 'ПОСЛЕДНЯЯ ВЕЩЬ' : `${inStock(p)} ШТ`}
            </span>
          </div>
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {p.images.map((im, i) => (
                <button key={im} onClick={() => setShot(i)} className={`h-20 w-20 shrink-0 border bg-sheet p-1.5 ${i === shot ? 'border-graphite' : 'border-line hover:border-graphite'}`}>
                  <img src={img(im)} alt="" width={80} height={80} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="label text-mute">{p.brand} · {p.catRu}</p>
          <h1 className="display mt-2 text-[clamp(24px,3.4vw,42px)]">{p.title}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="mono text-[30px] font-semibold">{money(p.price)}</span>
            {off > 0 && (
              <>
                <span className="mono text-[15px] text-mute line-through">{money(p.old!)}</span>
                <span className="label bg-mark px-2 py-1 text-white">ВЫГОДА {money(p.old! - p.price)}</span>
              </>
            )}
          </div>
          <p className="mono mt-1 text-[11px] text-mute">или около {money(perMonth(p.price))} в месяц частями — условия подтверждает менеджер</p>

          <div className="mt-6 border border-graphite bg-sheet p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="label text-mute">{p.sizeSystem === 'EU' ? 'Размер, EU' : 'Размер'}</p>
              <p className="mono text-[10px] text-mute">
                {p.sizes.length === 1 ? 'остался один размер' : `${p.sizes.length} размера в наличии`}
              </p>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSize(s.label)}
                  className={`mono min-w-[62px] border px-3 py-2.5 text-[13px] transition ${
                    size === s.label ? 'border-mark bg-mark text-white' : 'border-line hover:border-graphite'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {chosen?.eu && (
              <p className="mono mt-3 border-t border-line pt-3 text-[11px] text-mute">
                EU {chosen.eu}
                {chosen.us && ` · US ${chosen.us}`}
                {chosen.cm && ` · по стельке ≈ ${chosen.cm} см`} — ориентир, у брендов бывает ±0,5.{' '}
                <a href={href('/sizes')} className="underline">Таблица</a>
              </p>
            )}

            {taken ? (
              <div className="mt-4 border border-mark bg-mark/8 p-4">
                <p className="display text-[20px] text-mark">Снято со стола</p>
                <p className="mt-1 text-[13px]">
                  {p.title}, размер {size}. Держим за вами 30 минут, пока вы досматриваете остальное.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={href('/cart')} className="label bg-graphite px-4 py-3 text-white">ОФОРМИТЬ</a>
                  <a href={href('/')} className="label border border-graphite px-4 py-3">ВЕРНУТЬСЯ НА СТОЛ</a>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={(e) => {
                    if (!size) return say('Выберите размер — он у этой вещи один')
                    take(p, size, e.currentTarget)
                    setTaken(true)
                  }}
                  className="label flex-1 bg-mark px-5 py-4 text-white transition hover:bg-mark-dim"
                >
                  {size ? `ВЗЯТЬ РАЗМЕР ${size} · ${money(p.price)}` : 'ВЫБЕРИТЕ РАЗМЕР'}
                </button>
                <button
                  onClick={() => toggleFav(p.id)}
                  className={`label border px-4 py-4 ${liked ? 'border-graphite bg-graphite text-white' : 'border-graphite hover:bg-graphite hover:text-white'}`}
                >
                  {liked ? 'ОТЛОЖЕНО' : 'ОТЛОЖИТЬ'}
                </button>
              </div>
            )}

            <a href={SHOP.tg.manager} target="_blank" rel="noreferrer" className="label mt-2 block border border-line py-3 text-center hover:border-graphite">
              СПРОСИТЬ ПРО ЭТУ ВЕЩЬ В TELEGRAM
            </a>
          </div>

          <ul className="mt-5 grid gap-2">
            {[
              ['Оригинал', 'Фото и видео артикула, бирок и коробки — до отправки'],
              ['Примерка', `Оффлайн-магазин: ${SHOP.address}`],
              ['Доставка', `СДЭК по России, РБ и КЗ. Бесплатно от ${money(SHOP.freeFrom)}, по России 2–7 дней`],
              ['Возврат 14 дней', 'При сохранении вида, бирок и упаковки'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-2.5 border-b border-line pb-2 text-[13px] leading-snug">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-mark" />
                <span>
                  <b>{t}</b> <span className="text-mute">— {d}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <h2 className="label text-mute">Что это</h2>
            <p className="mt-2 max-w-[62ch] text-[14px] leading-snug">{p.desc}</p>
            <dl className="mono mt-4 grid grid-cols-2 gap-px border border-line bg-line text-[11px]">
              {[
                ['Бренд', p.brand],
                ['Категория', p.catRu],
                ['Артикул', p.sku ?? 'уточним у менеджера'],
                ['Состояние', 'Новое, с бирками'],
                ['Размеры', p.sizes.map((s) => s.label).join(', ')],
                ['На столе', `${inStock(p)} шт`],
              ].map(([k, v]) => (
                <div key={k} className="bg-sheet px-3 py-2">
                  <dt className="text-mute">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {cross.length > 0 && (
        <section className="mt-14">
          <h2 className="display border-b border-graphite pb-3 text-[clamp(20px,2.6vw,30px)]">С этим берут</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {cross.map(({ product, reason }) => (
              <a key={product.id} href={href(`/p/${product.id}`)} className="flex gap-3 border border-line bg-sheet p-3 hover:border-graphite">
                <img src={img(product.images[0])} alt="" width={96} height={96} loading="lazy" className="h-24 w-24 shrink-0 object-contain" />
                <span className="flex min-w-0 flex-col">
                  <span className="label text-mute">{product.brand}</span>
                  <span className="line-clamp-2 text-[13px] font-medium leading-tight">{product.title}</span>
                  <span className="mt-1 text-[11px] leading-snug text-mark">✓ {reason}</span>
                  <span className="mono mt-auto text-[13px] font-semibold">{money(product.price)}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {near.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between border-b border-graphite pb-3">
            <h2 className="display text-[clamp(20px,2.6vw,30px)]">Похожее по цене</h2>
            <a href={href(`/?cat=${p.cat}`)} className="label border-b border-graphite pb-0.5">ВСЯ КАТЕГОРИЯ →</a>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {near.map((x) => (
              <MiniCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}

      {seen.length > 0 && (
        <section className="mt-12">
          <h2 className="display border-b border-graphite pb-3 text-[clamp(18px,2.2vw,24px)]">Вы смотрели</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {seen.map((x) => (
              <MiniCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}

      <p className="mono mt-12 text-[10px] text-mute">
        Всего на столе {PRODUCTS.length} позиций · {SHOP.name}, {SHOP.city}
      </p>
    </div>
  )
}

function MiniCard({ p }: { p: Product }) {
  return (
    <a href={href(`/p/${p.id}`)} className="group flex flex-col border border-line bg-sheet p-2 hover:border-graphite">
      <span className="flex aspect-square items-center justify-center p-2">
        <img
          src={img(p.images[0])}
          alt={p.title}
          width={400}
          height={400}
          loading="lazy"
          className="max-h-full w-full object-contain transition-transform duration-500 group-hover:-translate-y-1.5"
          style={{ filter: 'drop-shadow(0 12px 12px rgba(16,17,20,.18))' }}
        />
      </span>
      <span className="label mt-1 text-mute">{p.brand}</span>
      <span className="line-clamp-2 text-[13px] leading-tight">{p.title}</span>
      <span className="mono mt-1 text-[13px] font-semibold">{money(p.price)}</span>
    </a>
  )
}
