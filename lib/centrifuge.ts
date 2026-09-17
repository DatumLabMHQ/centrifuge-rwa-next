// Loads the Centrifuge shapes the pages read. From the platform when DATUM_API_KEY is set, otherwise
// from lib/sample.ts, labelled as sample on every page.
import { cache } from 'react';
import { config } from '@/datum.config';
import { hasKey, query } from './datum';
import { count, num, price, usd } from './format';
import { samplePool, sampleToken, sampleCf } from './sample';
import type { CfOverview, Flow, Point, Pool, PoolDetail, Share, Token, TokenDetail } from './cf-types';

const R = config.resources;
const dayOf = (v: unknown) => String(v ?? '').slice(0, 10);
const byDayAsc = (a: { day: string }, b: { day: string }) => a.day.localeCompare(b.day);
const isoDaysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const change = (now: number, then: number | undefined) => (then ? (now / then - 1) * 100 : 0);

const toPool = (r: Record<string, unknown>): Pool => ({ id: String(r.pool_id ?? ''), name: String(r.pool_name ?? r.pool_id ?? ''), tokens: num(r.tokens), tvl: num(r.tvl_usd) });
const toToken = (r: Record<string, unknown>, pools: Map<string, string>): Token => ({ id: String(r.token_id ?? ''), poolId: String(r.pool_id ?? ''), poolName: pools.get(String(r.pool_id ?? '')) ?? String(r.pool_id ?? ''), symbol: String(r.symbol ?? ''), supply: num(r.supply), price: num(r.price_usd), tvl: num(r.tvl_usd), basis: String(r.basis ?? '') });
const toFlow = (r: Record<string, unknown>): Flow => ({ id: `${dayOf(r.day)}-${r.token_id}`, day: dayOf(r.day), tokenId: String(r.token_id ?? ''), symbol: String(r.symbol ?? ''), poolId: String(r.pool_id ?? ''), deposits: num(r.deposits_usd), redemptions: num(r.redemptions_usd), net: r.net_flow_usd != null ? num(r.net_flow_usd) : num(r.deposits_usd) - num(r.redemptions_usd), transactions: num(r.transactions) });
const flowsByDay = (flows: Flow[]): Point[] => { const m = new Map<string, { deposits: number; redemptions: number }>(); flows.forEach((f) => { const c = m.get(f.day) ?? { deposits: 0, redemptions: 0 }; c.deposits += f.deposits; c.redemptions += f.redemptions; m.set(f.day, c); }); return [...m.entries()].map(([day, v]) => ({ day, ...v })).sort(byDayAsc); };

/** The overview: latest pools and tokens, ninety days of our TVL and of flows, DefiLlama beside it. */
export const loadCf = cache(async (): Promise<CfOverview> => {
  if (!hasKey()) return sampleCf();
  const since = isoDaysAgo(config.trend.days + 2), fsince = isoDaysAgo(config.flowDays);
  const [ps, ts, ph, fl] = await Promise.all([
    query(R.pools.product, R.pools.name, { limit: 500 }),
    query(R.tokens.product, R.tokens.name, { limit: 1000 }),
    query(R.protocol.product, R.protocol.name, { since, limit: 500 }),
    query(R.flows.product, R.flows.name, { since: fsince, limit: 5000 }),
  ]);
  const pools = ps.rows.map(toPool).sort((a, b) => b.tvl - a.tvl);
  const names = new Map(pools.map((p) => [p.id, p.name]));
  const tokens = ts.rows.map((r) => toToken(r, names)).sort((a, b) => b.tvl - a.tvl);
  const flows = fl.rows.map(toFlow).sort((a, b) => b.day.localeCompare(a.day));
  const asOf = dayOf(ps.day ?? ts.day ?? new Date().toISOString());
  const history: Point[] = ph.rows.map((r) => ({ day: dayOf(r.day), tvl: num(r.own_tvl_usd), defillama: num(r.defillama_tvl_usd) })).filter((r) => r.day).sort(byDayAsc);
  const latest = history[history.length - 1]; const weekAgo = history.find((p) => p.day === isoDaysAgo(7, new Date(asOf + 'T00:00:00Z')));
  const tvl = sum(pools, (p) => p.tvl) || (latest ? num(latest.tvl) : 0);
  const byPool: Share[] = pools.map((p) => ({ name: p.name, value: p.tvl })).filter((s) => s.value > 0);
  const reconciliation: CfOverview['reconciliation'] = latest && num(latest.defillama) ? { ours: num(latest.tvl), theirs: num(latest.defillama), theirsSource: `DefiLlama (${latest.day})`, note: 'DefiLlama\'s Centrifuge adapter reports a sliver of the pools, so its figure is orders of magnitude below ours. It is shown because the platform stores it, and flagged as not comparable until the adapter covers the pools.' } : null;
  return {
    asOf, sample: false,
    kpis: { tvl, tvlChange7d: change(tvl, weekAgo ? num(weekAgo.tvl) : undefined), pools: pools.length, tokens: tokens.length, deposits: sum(flows, (f) => f.deposits), redemptions: sum(flows, (f) => f.redemptions), net: sum(flows, (f) => f.net), transactions: sum(flows, (f) => f.transactions) },
    history, flowsByDay: flowsByDay(flows), byPool, pools, tokens, flows, reconciliation,
  };
});

/** One pool: its tokens on the latest day, its TVL history summed from them, and its flows. */
export const loadPool = cache(async (id: string): Promise<PoolDetail | null> => {
  if (!hasKey()) return samplePool(id);
  const o = await loadCf();
  const pool = o.pools.find((p) => p.id === id);
  if (!pool) return null;
  const h = await query(R.tokens.product, R.tokens.name, { pool_id: pool.id, since: isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z')), limit: 5000 });
  const m = new Map<string, number>(); h.rows.forEach((r) => { const d = dayOf(r.day); if (d) m.set(d, (m.get(d) ?? 0) + num(r.tvl_usd)); });
  const tokens = o.tokens.filter((t) => t.poolId === pool.id);
  return { asOf: o.asOf, sample: false, pool, tokens, history: [...m.entries()].map(([day, tvl]) => ({ day, tvl })).sort(byDayAsc), flows: o.flows.filter((f) => f.poolId === pool.id),
    facts: [{ label: 'Tokens', value: count(pool.tokens), note: 'Tranches or share classes the pool issues' }, { label: 'Largest token', value: tokens[0] ? `${tokens[0].symbol}, ${usd(tokens[0].tvl)}` : 'n/a' }, { label: 'Pool id', value: pool.id }] };
});

/** One token: supply, price and TVL back to the seeded start, and its flows. */
export const loadToken = cache(async (id: string): Promise<TokenDetail | null> => {
  if (!hasKey()) return sampleToken(id);
  const o = await loadCf();
  const token = o.tokens.find((t) => t.id === id);
  if (!token) return null;
  const h = await query(R.tokens.product, R.tokens.name, { token_id: token.id, since: config.tokenHistoryFrom, limit: 5000 });
  const rows = h.rows.map((r) => ({ day: dayOf(r.day), tvl: num(r.tvl_usd), price: num(r.price_usd), supply: num(r.supply) })).filter((r) => r.day).sort(byDayAsc);
  const flows = o.flows.filter((f) => f.tokenId === token.id);
  return { asOf: o.asOf, sample: false, token, history: rows.map((r) => ({ day: r.day, tvl: r.tvl, supply: r.supply })), priceHistory: rows.map((r) => ({ day: r.day, price: r.price })), flows,
    facts: [{ label: 'Price', value: price(token.price), note: 'NAV per token as the API reports it' }, { label: 'Supply', value: count(token.supply), note: 'Tokens outstanding' }, { label: 'Basis', value: token.basis, note: token.basis === 'snapshot' ? 'Our own hourly read' : 'The API\'s backfilled daily figure' }, { label: 'Pool', value: token.poolName }, { label: 'History since', value: rows[0]?.day ?? 'n/a' }, { label: 'Token id', value: token.id }] };
});
