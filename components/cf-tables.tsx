'use client';
// Pools, tokens and flows on the kit's DataTable. Dashboard file: the columns belong to this product.
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AssetAvatar } from '@/components/asset-avatar';
import { DataTable, defineColumns, SortHeader } from '@/components/data-table';
import { count, price, usd } from '@/lib/format';
import type { Flow, Pool, Token } from '@/lib/cf-types';

type Caption = React.ReactNode;
const poolColumns = defineColumns<Pool>((col) => [
  col.accessor('name', { header: 'Pool', enableHiding: false, cell: ({ row }) => <Link href={`/pools/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline"><AssetAvatar symbol={row.original.name} /><span className="font-medium">{row.original.name}</span></Link> }),
  col.accessor('tokens', { header: 'Tokens', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{count(row.original.tokens)}</span> }),
  col.accessor('tvl', { header: ({ column }) => <SortHeader column={column} label="TVL" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.tvl)}</span> }),
]);
export function PoolsTable({ data, title, caption, pageSize = 12 }: { data: Pool[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Pool> rows={data} columns={poolColumns} title={title} caption={caption} getRowId={(p) => p.id} rowHref={(p) => `/pools/${p.id}`}
    search={(p, q) => p.name.toLowerCase().includes(q)} searchPlaceholder="Filter pools" numeric={['tokens', 'tvl']} labels={{ name: 'Pool', tokens: 'Tokens', tvl: 'TVL' }}
    initialSort={[{ id: 'tvl', desc: true }]} pageSize={pageSize} noun="pool" empty="No pools match." />;
}

const tokenColumns = defineColumns<Token>((col) => [
  col.accessor('symbol', { header: 'Token', enableHiding: false, cell: ({ row }) => <Link href={`/tokens/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline"><AssetAvatar symbol={row.original.symbol} /><span className="leading-tight"><span className="block font-medium">{row.original.symbol}</span><span className="block text-xs text-muted-foreground">{row.original.poolName}</span></span></Link> }),
  col.accessor('tvl', { header: ({ column }) => <SortHeader column={column} label="TVL" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.tvl)}</span> }),
  col.accessor('price', { header: ({ column }) => <SortHeader column={column} label="Price" />, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{price(row.original.price)}</span> }),
  col.accessor('supply', { header: ({ column }) => <SortHeader column={column} label="Supply" />, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{count(row.original.supply)}</span> }),
  col.accessor('basis', { header: 'Basis', cell: ({ row }) => <Badge variant={row.original.basis === 'snapshot' ? 'secondary' : 'outline'} className="font-normal">{row.original.basis === 'snapshot' ? 'our read' : 'API history'}</Badge> }),
]);
export function TokensTable({ data, title, caption, pageSize = 15 }: { data: Token[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Token> rows={data} columns={tokenColumns} title={title} caption={caption} getRowId={(t) => t.id} rowHref={(t) => `/tokens/${t.id}`}
    search={(t, q) => `${t.symbol} ${t.poolName}`.toLowerCase().includes(q)} searchPlaceholder="Filter tokens" numeric={['tvl', 'price', 'supply']} labels={{ symbol: 'Token', tvl: 'TVL', price: 'Price', supply: 'Supply', basis: 'Basis' }}
    initialSort={[{ id: 'tvl', desc: true }]} pageSize={pageSize} noun="token" empty="No tokens match." />;
}

const flowColumns = defineColumns<Flow>((col) => [
  col.accessor('day', { header: ({ column }) => <SortHeader column={column} label="Day" />, enableHiding: false, cell: ({ row }) => <span className="font-mono text-xs">{row.original.day}</span> }),
  col.accessor('symbol', { header: 'Token', cell: ({ row }) => <Link href={`/tokens/${row.original.tokenId}`} className="flex items-center gap-2 outline-none focus-visible:underline"><AssetAvatar symbol={row.original.symbol} className="size-5" /><span className="font-medium">{row.original.symbol}</span></Link> }),
  col.accessor('deposits', { header: ({ column }) => <SortHeader column={column} label="Deposits" />, cell: ({ row }) => <span className="tabular-nums">{row.original.deposits ? usd(row.original.deposits) : <span className="text-muted-foreground">0</span>}</span> }),
  col.accessor('redemptions', { header: ({ column }) => <SortHeader column={column} label="Redemptions" />, cell: ({ row }) => <span className="tabular-nums">{row.original.redemptions ? usd(row.original.redemptions) : <span className="text-muted-foreground">0</span>}</span> }),
  col.accessor('net', { header: ({ column }) => <SortHeader column={column} label="Net flow" />, cell: ({ row }) => <span className={`tabular-nums ${row.original.net < 0 ? 'text-(--red)' : row.original.net > 0 ? 'text-(--green)' : 'text-muted-foreground'}`}>{row.original.net >= 0 ? '+' : ''}{usd(row.original.net)}</span> }),
  col.accessor('transactions', { header: 'Transactions', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{count(row.original.transactions)}</span> }),
]);
export function FlowsTable({ data, title, caption, pageSize = 15 }: { data: Flow[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Flow> rows={data} columns={flowColumns} title={title} caption={caption} getRowId={(f) => f.id}
    search={(f, q) => `${f.symbol} ${f.day}`.toLowerCase().includes(q)} searchPlaceholder="Filter by token or day" numeric={['deposits', 'redemptions', 'net', 'transactions']} labels={{ day: 'Day', symbol: 'Token', deposits: 'Deposits', redemptions: 'Redemptions', net: 'Net flow', transactions: 'Transactions' }}
    initialSort={[{ id: 'day', desc: true }]} pageSize={pageSize} noun="day" empty="No flows match." />;
}
