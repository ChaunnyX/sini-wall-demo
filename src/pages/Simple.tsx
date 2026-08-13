import { useState } from 'react'
import { BRANDS, PRODUCTS, SHOE_SIZES, APPAREL_SIZES } from '../data/catalog'
import { FAQ, INFO_PAGES, SHOP } from '../data/shop'
import { go, href } from '../lib/router'
import { useStore } from '../lib/store'
import { Piece } from '../components/Piece'

export function Favorites() {
  const { fav } = useStore()
  const list = PRODUCTS.filter((p) => fav.includes(p.id))
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-10">
      <h1 className="display border-b-2 border-graphite pb-3 text-[clamp(36px,6vw,64px)]">Избранное</h1>
      {list.length === 0 ? (
        <div className="mt-10 border border-line bg-sheet p-10 text-center">
          <p className="display text-[32px]">Пока пусто</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[14px] text-mute">
            Откладывайте вещи сердечком на карточке. Но помните: избранное не бронирует — позиция в одном экземпляре и может уйти.
          </p>
          <a href={href('/')} className="label mt-4 inline-block bg-graphite px-4 py-3 text-white">НА СТОЛ</a>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <Piece key={p.id} p={p} density="grid" onQuick={() => go(`/p/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Concierge() {
  const [sent, setSent] = useState(false)
  const [f, setF] = useState({ model: '', size: '', budget: '', contact: '' })
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-12">
      <nav className="label text-mute">
        <a href={href('/')} className="hover:text-graphite">Главная</a> / <span className="text-graphite">Консьерж-сервис</span>
      </nav>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="label text-mark">SINI CONCIERGE</p>
          <h1 className="display mt-3 text-[clamp(40px,7vw,86px)]">Привезём то, чего нет в России</h1>
          <p className="mt-4 max-w-[54ch] text-[16px] leading-snug text-mute">
            У нас свой сервис выкупа из-за рубежа. Находим редкие и коллекционные модели, ловим нужный размер,
            присылаем фото и видео до отправки. Работает с {SHOP.since} года.
          </p>
          <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
            {[
              ['Редкий размер', 'Нашли модель, но нет вашего размера — найдём его отдельно'],
              ['Архивные вещи', 'Позиции, которых уже нет в продаже в России'],
              ['Проверка до оплаты', 'Фото и видео вещи, артикул и бирки — до отправки'],
              ['Альтернативы', 'Если модель недоступна — предложим близкие по посадке и цене'],
            ].map(([t, d]) => (
              <div key={t} className="bg-sheet p-4">
                <p className="text-[15px] font-bold">{t}</p>
                <p className="mt-1 text-[13px] leading-snug text-mute">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-mute">
            Сроки и стоимость доставки для выкупа из-за рубежа менеджер уточняет индивидуально до подтверждения заказа.
          </p>
        </div>

        <div className="border border-graphite bg-sheet p-5">
          {sent ? (
            <div className="py-6">
              <p className="display text-[32px]">Запрос принят</p>
              <p className="mt-2 text-[14px] text-mute">
                Менеджер соберёт варианты и напишет в Telegram. Обычно отвечаем в течение рабочего дня.
              </p>
              <a href={SHOP.tg.manager} target="_blank" rel="noreferrer" className="label mt-4 inline-block bg-mark px-4 py-3 text-white">
                НАПИСАТЬ СРАЗУ {SHOP.tg.managerName}
              </a>
            </div>
          ) : (
            <form
              className="grid gap-2.5"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              <p className="display text-[26px]">Запрос на подбор</p>
              <input required value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder="Бренд и модель — «New Balance 2002R Protection Pack»" className="border border-line bg-table px-3 py-3 text-[15px] outline-none focus:border-graphite" />
              <div className="grid grid-cols-2 gap-2.5">
                <input required value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} placeholder="Размер" className="border border-line bg-table px-3 py-3 text-[15px] outline-none focus:border-graphite" />
                <input value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} placeholder="Бюджет, ₽" className="border border-line bg-table px-3 py-3 text-[15px] outline-none focus:border-graphite" />
              </div>
              <input required value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="Телефон или @ник в Telegram" className="border border-line bg-table px-3 py-3 text-[15px] outline-none focus:border-graphite" />
              <button className="label bg-mark px-4 py-4 text-white hover:bg-mark-dim">ОТПРАВИТЬ ЗАПРОС</button>
              <p className="text-[11px] leading-snug text-mute">Ничего не списывается. Менеджер сначала присылает варианты, цену и срок.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export function SizeHelp() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 lg:py-14">
      <h1 className="display text-[clamp(36px,6vw,64px)]">Как выбрать размер</h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-snug text-mute">
        Самый надёжный способ — измерить стельку своей удобной пары от пятки до большого пальца и сравнить с колонкой «см».
        Таблица — ориентир для мужских размеров: у разных брендов бывает расхождение ±0,5.
      </p>
      <div className="mono mt-6 overflow-x-auto border border-line">
        <table className="w-full min-w-[420px] text-[12px]">
          <thead className="bg-graphite text-white">
            <tr>
              <th className="px-3 py-2 text-left">EU</th>
              <th className="px-3 py-2 text-left">US</th>
              <th className="px-3 py-2 text-left">По стельке, см</th>
              <th className="px-3 py-2 text-left">В наличии</th>
            </tr>
          </thead>
          <tbody>
            {SHOE_SIZES.map((s) => {
              const p = PRODUCTS.find((x) => x.sizes.some((y) => y.label === s && y.eu))
              const size = p?.sizes.find((y) => y.label === s)
              const n = PRODUCTS.filter((x) => x.sizes.some((y) => y.label === s && y.stock > 0)).length
              return (
                <tr key={s} className="border-t border-line bg-sheet">
                  <td className="px-3 py-2 font-bold">{s}</td>
                  <td className="px-3 py-2">{size?.us ?? '—'}</td>
                  <td className="px-3 py-2">{size?.cm ?? '—'}</td>
                  <td className="px-3 py-2">
                    {n ? <a href={href(`/?size=${s}`)} className="text-mark underline">{n} шт</a> : <span className="text-mute">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="label mt-6 text-mute">Одежда</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {APPAREL_SIZES.map((s) => {
          const n = PRODUCTS.filter((x) => x.sizes.some((y) => y.label === s && y.stock > 0)).length
          return (
            <a key={s} href={href(`/?size=${s}`)} className="mono border border-line bg-sheet px-3 py-2 text-[12px] hover:border-graphite">
              {s} <span className="text-mute">· {n}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export function Info({ page }: { page: string }) {
  const data = INFO_PAGES[page]
  if (!data) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-24 text-center">
        <h1 className="display text-[44px]">Страница не найдена</h1>
        <a href={href('/')} className="label mt-5 inline-block bg-graphite px-4 py-3 text-white">НА ГЛАВНУЮ</a>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 lg:py-14">
      <nav className="label text-mute">
        <a href={href('/')} className="hover:text-graphite">Главная</a> / <span className="text-graphite">{data.title}</span>
      </nav>
      <h1 className="display mt-3 text-[clamp(36px,6vw,64px)]">{data.title}</h1>
      <p className="mt-3 max-w-[62ch] text-[16px] leading-snug text-mute">{data.lead}</p>

      {page === 'faq' ? (
        <div className="mt-8 border-t border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold">
                {f.q}
                <span className="shrink-0 text-mark transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[70ch] pb-4 text-[14px] leading-snug text-mute">{f.a}</p>
            </details>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2">
          {data.blocks.map((b) => (
            <div key={b.t} className="bg-sheet p-5">
              <h2 className="text-[17px] font-bold">{b.t}</h2>
              <p className="mt-1.5 text-[14px] leading-snug text-mute">{b.d}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 border border-graphite bg-sheet p-5">
        <p className="display text-[24px]">Остались вопросы?</p>
        <p className="mt-1.5 text-[14px] text-mute">Напишите менеджеру — подскажем по наличию, размеру и доставке.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={SHOP.tg.manager} target="_blank" rel="noreferrer" className="label bg-mark px-4 py-3 text-white">{SHOP.tg.managerName}</a>
          <a href={href('/')} className="label border border-graphite px-4 py-3">НА СТОЛ · {PRODUCTS.length} ПОЗИЦИЙ</a>
        </div>
      </div>

      <p className="label mt-8 text-mute">
        Бренды: {BRANDS.map((b) => b.name).join(' · ')}
      </p>
    </div>
  )
}
