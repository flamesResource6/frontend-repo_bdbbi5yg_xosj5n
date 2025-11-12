import { useEffect, useMemo, useState } from 'react'

function StatCard({ label, value, accent = 'blue' }) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm border-${accent}-100`}>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  )
}

function SignalBadge({ type }) {
  const color = type === 'buy' ? 'green' : 'red'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-${color}-50 px-2 py-1 text-xs font-medium text-${color}-700 ring-1 ring-inset ring-${color}-600/10`}>
      {type === 'buy' ? 'Buy' : 'Sell'}
    </span>
  )
}

function formatNumber(n) {
  if (n === null || n === undefined) return '-'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [bt, setBt] = useState(null)
  const [params, setParams] = useState({ fast: 9, slow: 21, rsi_len: 14, rsi_buy: 55, rsi_sell: 45, tp_rr: 1.5, sl_pct: 0.02 })

  const fetchSignals = async () => {
    setLoading(true)
    const url = new URL(baseUrl + '/signals')
    Object.entries({ asset: 'BTCUSDT', timeframe: '1h', ...params }).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString())
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  const runBacktest = async () => {
    const url = new URL(baseUrl + '/backtest')
    Object.entries({ asset: 'BTCUSDT', timeframe: '1h', ...params }).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString())
    const json = await res.json()
    setBt(json)
  }

  useEffect(() => {
    fetchSignals()
    runBacktest()
  }, [])

  const suggestion = data?.suggestion || 'Waiting for signals'
  const lastPrice = data?.last_price

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">T</div>
            <div>
              <div className="text-sm text-gray-500">Paper Trading</div>
              <div className="text-lg font-semibold text-gray-800">MA + RSI Signals</div>
            </div>
          </div>
          <a href="/test" className="text-sm text-blue-600 hover:text-blue-700">System Check</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Asset" value="BTCUSDT / 1h" />
          <StatCard label="Last Price" value={`$${formatNumber(lastPrice)}`} />
          <StatCard label="Suggestion" value={suggestion} />
          <StatCard label="Trades" value={bt?.stats?.trades ?? 0} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Recent Signals</h2>
              <button onClick={fetchSignals} className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700">Refresh</button>
            </div>
            <div className="mt-4 divide-y">
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : (
                (data?.signals || []).slice().reverse().map((s, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SignalBadge type={s.action} />
                      <div className="text-sm text-gray-600">{new Date(s.t).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-800">${formatNumber(s.price)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Backtest</h2>
              <button onClick={runBacktest} className="rounded-md bg-slate-700 text-white px-3 py-1.5 text-sm hover:bg-slate-800">Run</button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Trades</div>
                <div className="text-right font-medium">{bt?.stats?.trades ?? '-'}</div>
                <div className="text-gray-500">Win rate</div>
                <div className="text-right font-medium">{formatNumber(bt?.stats?.win_rate)}%</div>
                <div className="text-gray-500">Total PnL</div>
                <div className="text-right font-medium">${formatNumber(bt?.stats?.total_pnl)}</div>
              </div>
              <div className="pt-3 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Last 5 trades</h3>
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {(bt?.trades || []).slice(-5).reverse().map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <SignalBadge type={t.side} />
                      <div className="text-gray-600">{new Date(t.entry_time).toLocaleString()}</div>
                      <div className={t.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${formatNumber(t.pnl)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Quick Trade</h2>
          <QuickTrade baseUrl={baseUrl} lastPrice={lastPrice} onPlaced={() => fetchSignals()} />
        </div>
      </main>
    </div>
  )
}

function QuickTrade({ baseUrl, lastPrice, onPlaced }) {
  const [side, setSide] = useState('buy')
  const [qty, setQty] = useState(1)
  const place = async () => {
    const res = await fetch(baseUrl + '/paper/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset: 'BTCUSDT', timeframe: '1h', side, qty, price: lastPrice })
    })
    const json = await res.json()
    if (json?.ok) onPlaced?.()
  }
  return (
    <div className="mt-3 flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setSide('buy')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${side==='buy' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>Buy</button>
        <button onClick={() => setSide('sell')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${side==='sell' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>Sell</button>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" className="w-24 rounded-md border px-3 py-1.5 text-sm" value={qty} onChange={e=>setQty(Number(e.target.value))} />
        <div className="text-sm text-gray-600">at ${formatNumber(lastPrice)}</div>
      </div>
      <button onClick={place} className="ml-auto rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Place Paper Order</button>
    </div>
  )
}
