import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { BalanceCard } from './components/BalanceCard'
import { SendSheet } from './components/SendSheet'
import { RequestSheet } from './components/RequestSheet'
import { ActivityFeed } from './components/ActivityFeed'
import { PrefillBanner, PrefillData } from './components/PrefillBanner'

export default function App() {
  const [sendOpen, setSendOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)

  const handlePrefillAccept = (data: PrefillData) => {
    setPrefillData(data)
    setSendOpen(true)
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          background: 'rgba(255,255,255,0.70)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent)' }}
          >
            <span className="display text-white text-xs font-bold">AP</span>
          </div>
          <span className="display text-base font-bold" style={{ color: 'var(--ink)' }}>
            Arc Pay
          </span>
        </div>
        <ConnectKitButton />
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-md px-4 py-6 flex flex-col gap-4">
        {/* Payment request banner (from URL params) */}
        <PrefillBanner onAccept={handlePrefillAccept} />

        {/* Balance + action card */}
        <BalanceCard
          onSend={() => {
            setPrefillData(null)
            setSendOpen(true)
          }}
          onRequest={() => setRequestOpen(true)}
        />

        {/* Activity feed */}
        <ActivityFeed />

        {/* Testnet note */}
        <p className="text-center text-xs pb-2" style={{ color: 'var(--subtle)' }}>
          Running on Arc Testnet · USDC is gas · No real funds
        </p>
      </main>

      {/* Sheets */}
      <SendSheet
        key={prefillData ? `${prefillData.to}-${prefillData.amount}` : 'default'}
        open={sendOpen}
        onClose={() => {
          setSendOpen(false)
          setPrefillData(null)
        }}
        prefill={prefillData}
      />
      <RequestSheet open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  )
}
