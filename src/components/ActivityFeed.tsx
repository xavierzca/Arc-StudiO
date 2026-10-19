import { useAccount } from 'wagmi'
import { parseAbiItem } from 'viem'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { createPublicClient, http } from 'viem'
import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const CHAIN_ID = 5042002
const usdcFact = getUsdc(CHAIN_ID)!
const chain = requireChain(CHAIN_ID)

const publicClient = createPublicClient({
  chain: {
    id: chain.chainId,
    name: chain.name,
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: chain.rpcUrls as [string, ...string[]] } },
  },
  transport: http(chain.rpcUrls[0]),
})

interface TxItem {
  hash: string
  direction: 'out' | 'in'
  address: string
  amount: string
  blockNumber: bigint
}

interface FeedState {
  txs: TxItem[]
  loading: boolean
}

export function ActivityFeed() {
  const { address } = useAccount()
  const [feed, setFeed] = useState<FeedState>({ txs: [], loading: false })

  useEffect(() => {
    if (!address) return

    let cancelled = false

    const fetchLogs = async () => {
      setFeed((prev) => ({ ...prev, loading: true }))
      try {
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n

        const [sentLogs, receivedLogs] = await Promise.all([
          publicClient.getLogs({
            address: usdcFact.address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { from: address },
            fromBlock,
            toBlock: 'latest',
          }),
          publicClient.getLogs({
            address: usdcFact.address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { to: address },
            fromBlock,
            toBlock: 'latest',
          }),
        ])

        if (cancelled) return

        const items: TxItem[] = []

        for (const log of sentLogs) {
          items.push({
            hash: log.transactionHash ?? '',
            direction: 'out',
            address: (log.args.to as string) ?? '',
            amount: Amount.fromRaw(log.args.value as bigint, usdcDecimalsFor(CHAIN_ID)).toFixed(2),
            blockNumber: log.blockNumber ?? 0n,
          })
        }

        for (const log of receivedLogs) {
          if ((log.args.from as string)?.toLowerCase() === address.toLowerCase()) continue
          items.push({
            hash: log.transactionHash ?? '',
            direction: 'in',
            address: (log.args.from as string) ?? '',
            amount: Amount.fromRaw(log.args.value as bigint, usdcDecimalsFor(CHAIN_ID)).toFixed(2),
            blockNumber: log.blockNumber ?? 0n,
          })
        }

        items.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : b.blockNumber < a.blockNumber ? -1 : 0))
        if (!cancelled) setFeed({ txs: items.slice(0, 10), loading: false })
      } catch {
        if (!cancelled) setFeed((prev) => ({ ...prev, loading: false }))
      }
    }

    void fetchLogs()
    return () => { cancelled = true }
  }, [address])

  const { txs, loading } = feed

  if (!address) return null

  return (
    <section
      className="rounded-3xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-strong)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Recent Activity
        </span>
        <div className="flex items-center gap-1.5">
          <TokenUSDC variant="branded" size={14} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Arc Testnet</span>
        </div>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-10"
          style={{ background: 'var(--surface)' }}
        >
          <Loader2 className="size-5 animate-spin" style={{ color: 'var(--muted)' }} />
        </div>
      ) : txs.length === 0 ? (
        <div
          className="flex flex-col items-center py-10 gap-2"
          style={{ background: 'var(--surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No recent transactions</p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>Scanned last 5,000 blocks</p>
        </div>
      ) : (
        <ul style={{ background: 'var(--surface)' }}>
          {txs.map((tx, i) => (
            <li
              key={tx.hash + i}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{
                borderBottom: i < txs.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              {/* Direction icon */}
              <div
                className="flex size-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    tx.direction === 'out'
                      ? 'rgba(186,43,76,0.08)'
                      : 'rgba(26,128,71,0.08)',
                }}
              >
                {tx.direction === 'out' ? (
                  <ArrowUpRight className="size-4" style={{ color: 'var(--danger)' }} />
                ) : (
                  <ArrowDownLeft className="size-4" style={{ color: 'var(--success)' }} />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {tx.direction === 'out' ? 'Sent' : 'Received'}
                </p>
                <p className="mono text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {tx.direction === 'out' ? 'To: ' : 'From: '}
                  {tx.address.slice(0, 6)}...{tx.address.slice(-4)}
                </p>
              </div>

              {/* Amount + link */}
              <div className="text-right flex-shrink-0">
                <p
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: tx.direction === 'out' ? 'var(--danger)' : 'var(--success)' }}
                >
                  {tx.direction === 'out' ? '-' : '+'}{tx.amount} USDC
                </p>
                {tx.hash && (
                  <a
                    href={buildTxExplorerUrl(CHAIN_ID, tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs"
                    style={{ color: 'var(--accent-hover)' }}
                  >
                    View
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
