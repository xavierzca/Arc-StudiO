import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { X, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, parseAmount, usdcDecimalsFor } from '@/onchain-money'
import { toast } from 'sonner'

const CHAIN_ID = 5042002 // Arc Testnet
const usdcFact = getUsdc(CHAIN_ID)!

const PRESET_AMOUNTS = ['0.10', '0.25', '1.00', '5.00']

const springs = {
  sheet: { type: 'spring' as const, damping: 32, stiffness: 380, mass: 0.8 },
}

const spectral = 'linear-gradient(90deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #f87171)'

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || (error as { code?: number })?.code === 4001) return 'Cancelled.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Insufficient balance.'
  if (msg.includes('reverted')) return 'Transaction failed — check your balance.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Try again.'
  return 'Something went wrong. Please try again.'
}

interface PrefillData {
  to: string
  amount: string
  memo?: string
}

interface Props {
  open: boolean
  onClose: () => void
  prefill?: PrefillData | null
}

export function SendSheet({ open, onClose, prefill }: Props) {
  const [recipient, setRecipient] = useState(prefill?.to ?? '')
  const [amount, setAmount] = useState(prefill?.amount ?? '')

  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const { data: rawBalance } = useReadContract({
    address: usdcFact.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance =
    rawBalance != null
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(CHAIN_ID)).toFixed(2)
      : null

  const {
    writeContract,
    data: hash,
    isPending,
    reset,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const wrongChain = chainId !== CHAIN_ID
  const recipientValid = isAddress(recipient)
  const amountValid = amount !== '' && parseFloat(amount) > 0

  const ready = recipientValid && amountValid && !isPending && !isConfirming && !isSuccess

  const handleSend = () => {
    if (wrongChain) {
      switchChain({ chainId: CHAIN_ID })
      return
    }
    if (!recipientValid || !amountValid) return
    try {
      const parsed = parseAmount(CHAIN_ID, amount)
      writeContract({
        address: usdcFact.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient, parsed.raw],
        chainId: CHAIN_ID,
      })
    } catch {
      toast.error('Invalid amount')
    }
  }

  const handleClose = () => {
    if (isSuccess) {
      reset()
      setRecipient('')
      setAmount('')
    }
    onClose()
  }

  const txUrl = hash ? buildTxExplorerUrl(CHAIN_ID, hash) : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
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
            {/* Spectral strip */}
            <div className="h-1" style={{ background: spectral }} />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>

            <div className="px-5 pb-8 pt-3">
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
                  Send USDC
                </h2>
                <button
                  onClick={handleClose}
                  className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                >
                  <X className="size-4" style={{ color: 'var(--muted)' }} />
                </button>
              </div>

              {/* Success state */}
              {isSuccess ? (
                <div className="flex flex-col items-center py-6 gap-4">
                  <div
                    className="flex size-16 items-center justify-center rounded-full"
                    style={{ background: 'rgba(26,128,71,0.10)' }}
                  >
                    <CheckCircle2 className="size-8" style={{ color: 'var(--success)' }} />
                  </div>
                  <div className="text-center">
                    <p className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
                      {amount} USDC sent
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                      Transaction confirmed on Arc Testnet
                    </p>
                  </div>
                  {txUrl && (
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: 'var(--accent-hover)' }}
                    >
                      View on ArcScan <ExternalLink className="size-3" />
                    </a>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white mt-2"
                    style={{ background: 'var(--accent)' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Recipient */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--subtle)' }}>
                      Recipient Address
                    </label>
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: 'var(--surface-muted)',
                        border: recipient && !recipientValid ? '1.5px solid var(--danger)' : '1.5px solid var(--border)',
                      }}
                    >
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value.trim())}
                        placeholder="0x..."
                        className="mono w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        style={{ color: 'var(--ink)' }}
                      />
                    </div>
                    {recipient && !recipientValid && (
                      <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                        Invalid address
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--subtle)' }}>
                      Amount
                    </label>
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: 'var(--surface-muted)',
                        border: '1.5px solid var(--border)',
                      }}
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
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</span>
                        {formattedBalance && (
                          <button
                            onClick={() => setAmount(formattedBalance)}
                            className="text-xs font-semibold"
                            style={{ color: 'var(--accent-hover)' }}
                          >
                            Balance: {formattedBalance} · Max
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick amount chips */}
                  <div className="mb-5 flex gap-2">
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

                  {/* Error */}
                  {writeError && (
                    <div
                      className="mb-4 rounded-xl px-4 py-2.5 text-xs"
                      style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
                    >
                      {parseOnchainError(writeError)}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    disabled={!!address && !wrongChain && !ready}
                    onClick={handleSend}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: 'var(--accent)' }}
                  >
                    {!address ? (
                      'Connect wallet first'
                    ) : wrongChain ? (
                      'Switch to Arc Testnet'
                    ) : isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" /> Confirm in wallet...
                      </span>
                    ) : isConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" /> Confirming...
                      </span>
                    ) : (
                      `Send${amountValid ? ` ${amount} USDC` : ''}`
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
