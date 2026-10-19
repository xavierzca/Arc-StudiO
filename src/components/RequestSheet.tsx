import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { X, Copy, Check } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'

const springs = {
  sheet: { type: 'spring' as const, damping: 32, stiffness: 380, mass: 0.8 },
}

const spectral = 'linear-gradient(90deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #f87171)'

const PRESET_AMOUNTS = ['1.00', '5.00', '10.00', '25.00']

interface Props {
  open: boolean
  onClose: () => void
}

export function RequestSheet({ open, onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [copied, setCopied] = useState(false)

  const { address } = useAccount()

  const paymentLink = address
    ? (() => {
        const params = new URLSearchParams({ to: address, amount: amount || '0' })
        if (memo) params.set('memo', memo)
        return `${window.location.origin}?${params.toString()}`
      })()
    : null

  const handleCopy = () => {
    if (!paymentLink) return
    void navigator.clipboard.writeText(paymentLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const amountValid = amount !== '' && parseFloat(amount) > 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <motion.section
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(48px) saturate(200%)',
              WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springs.sheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1" style={{ background: spectral }} />
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>

            <div className="px-5 pb-8 pt-3">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
                  Request USDC
                </h2>
                <button
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                >
                  <X className="size-4" style={{ color: 'var(--muted)' }} />
                </button>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="text-xs font-semibold tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--subtle)' }}>
                  Amount to Request
                </label>
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: 'var(--surface-muted)', border: '1.5px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <TokenUSDC variant="branded" size={20} />
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, '')
                        if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
                      }}
                      placeholder="0.00"
                      className="display flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300"
                      style={{ color: 'var(--ink)' }}
                    />
                  </div>
                  <span className="text-xs mt-1 block" style={{ color: 'var(--subtle)' }}>USDC</span>
                </div>
              </div>

              {/* Presets */}
              <div className="mb-3 flex gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: amount === preset ? 'var(--accent)' : 'var(--surface-muted)',
                      color: amount === preset ? '#fff' : 'var(--ink-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Memo */}
              <div className="mb-5">
                <label className="text-xs font-semibold tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--subtle)' }}>
                  Memo (optional)
                </label>
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: 'var(--surface-muted)', border: '1.5px solid var(--border)' }}
                >
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="e.g. Coffee, Invoice #42..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    style={{ color: 'var(--ink)' }}
                  />
                </div>
              </div>

              {/* Payment link preview */}
              {paymentLink && amountValid && (
                <div
                  className="mb-5 rounded-2xl p-4"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>
                    Payment Link
                  </p>
                  <p className="mono text-xs break-all" style={{ color: 'var(--ink-2)' }}>
                    {paymentLink}
                  </p>
                </div>
              )}

              {/* CTA */}
              <button
                disabled={!amountValid || !address}
                onClick={handleCopy}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {copied ? (
                  <>
                    <Check className="size-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copy Payment Link
                  </>
                )}
              </button>

              {!address && (
                <p className="text-center text-xs mt-3" style={{ color: 'var(--muted)' }}>
                  Connect your wallet to generate a payment link
                </p>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
