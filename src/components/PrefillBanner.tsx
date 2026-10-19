import { useState } from 'react'
import { isAddress } from 'viem'
import { ArrowRight, X } from 'lucide-react'

interface PrefillData {
  to: string
  amount: string
  memo?: string
}

interface Props {
  onAccept: (data: PrefillData) => void
}

function parsePrefill(): PrefillData | null {
  const params = new URLSearchParams(window.location.search)
  const to = params.get('to') ?? ''
  const amount = params.get('amount') ?? ''
  const memo = params.get('memo') ?? undefined
  if (isAddress(to) && parseFloat(amount) > 0) return { to, amount, memo }
  return null
}

export function PrefillBanner({ onAccept }: Props) {
  const data = parsePrefill()
  const [dismissed, setDismissed] = useState(false)

  if (!data || dismissed) return null

  return (
    <div
      className="rounded-2xl p-4 mb-4 flex items-start justify-between gap-3"
      style={{
        background: 'rgba(16, 97, 166, 0.08)',
        border: '1px solid rgba(16, 97, 166, 0.18)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent-hover)' }}>
          Payment Request
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {data.amount} USDC
          {data.memo && <span style={{ color: 'var(--muted)' }}> · {data.memo}</span>}
        </p>
        <p className="mono text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
          To: {data.to}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onAccept(data)}
          className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          Pay <ArrowRight className="size-3" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
        >
          <X className="size-3.5" style={{ color: 'var(--muted)' }} />
        </button>
      </div>
    </div>
  )
}

export type { PrefillData }
