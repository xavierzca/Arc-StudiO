import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { NetworkArc } from '@web3icons/react'
import { Wallet } from 'lucide-react'
import { getUsdc, requireChain } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const CHAIN_ID = 5042002 // Arc Testnet
const usdcFact = getUsdc(CHAIN_ID)!
const chain = requireChain(CHAIN_ID)

interface Props {
  onSend: () => void
  onRequest: () => void
}

export function BalanceCard({ onSend, onRequest }: Props) {
  const { address, isConnected } = useAccount()

  const { data: rawBalance, isLoading } = useReadContract({
    address: usdcFact.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  })

  const formatted =
    rawBalance != null
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(CHAIN_ID)).toFixed(2)
      : '—'

  return (
    <section
      className="rounded-3xl p-6 shadow-sm"
      style={{
        background: 'var(--surface-strong)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Chain badge */}
      <div className="mb-4 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <NetworkArc variant="branded" size={14} />
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            {chain.name}
          </span>
        </div>
        <div
          className="flex size-8 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-muted)' }}
        >
          <Wallet className="size-4" style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      {/* Balance */}
      <div className="mb-1 text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--subtle)' }}>
        Your Balance
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="display text-5xl font-bold tabular-nums"
          style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
        >
          {isConnected ? (isLoading ? '...' : formatted) : '—'}
        </span>
        <span className="text-xl font-medium" style={{ color: 'var(--subtle)' }}>
          USDC
        </span>
      </div>
      <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
        {isConnected
          ? 'USDC on Arc Testnet · gas-free payments'
          : 'Connect your wallet to view balance'}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSend}
          disabled={!isConnected}
          className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}
        >
          Send
        </button>
        <button
          onClick={onRequest}
          disabled={!isConnected}
          className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
          }}
        >
          Request
        </button>
      </div>
    </section>
  )
}
