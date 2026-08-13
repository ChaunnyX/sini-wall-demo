import { Foot, Head } from './components/Head'
import { Cursor, TableBg } from './components/Table'
import { BoxTake } from './components/BoxTake'
import { useRoute } from './lib/router'
import { StoreProvider, useStore } from './lib/store'
import { Wall } from './pages/Wall'
import { Item } from './pages/Item'
import { Cart } from './pages/Cart'
import { Concierge, Favorites, Info, SizeHelp } from './pages/Simple'

function Screen() {
  const route = useRoute()
  const p = route.path
  if (p.startsWith('/p/')) return <Item id={decodeURIComponent(p.slice(3))} />
  if (p.startsWith('/info/')) return <Info page={p.slice(6)} />
  switch (p) {
    case '/cart': return <Cart />
    case '/fav': return <Favorites />
    case '/concierge': return <Concierge />
    case '/sizes': return <SizeHelp />
    case '/': return <Wall route={route} />
    default: return <Wall route={route} />
  }
}

function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-70 flex justify-center px-4">
      <div className="label border border-graphite bg-graphite px-4 py-3 text-white shadow-[0_20px_40px_-24px_rgba(0,0,0,.8)]">
        {toast}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <TableBg />
      <div className="relative z-10">
        <Head />
        <main>
          <Screen />
        </main>
        <Foot />
      </div>
      <BoxTake />
      <Toast />
      <Cursor />
    </StoreProvider>
  )
}
