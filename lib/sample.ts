// Labelled sample data for the pages when no DATUM_API_KEY is set. Shaped like the platform's
// September 2026 numbers so the dashboard can be judged as is; every page says it is sample data.
import { SAMPLE_AS_OF } from './platform';
import type { CfOverview, Flow, Point, Pool, PoolDetail, Token, TokenDetail } from './cf-types';
export { SAMPLE_AS_OF };

const rnd = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const daysBack = (n: number, from = SAMPLE_AS_OF) => Array.from({ length: n + 1 }, (_, i) => { const d = new Date(from + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (n - i)); return d.toISOString().slice(0, 10); });
const series = (days: string[], end: number, growth: number, wobble: number, seed: number) => { const r = rnd(seed); const out: number[] = []; let v = end / (1 + growth); days.forEach(() => { v *= 1 + growth / days.length + (r() - 0.5) * wobble; out.push(v); }); const k = end / out[out.length - 1]; return out.map((x) => x * k); };
const POOLS: [string, string, number][] = [['281474976710663', 'Janus Henderson AAA CLO Fund', 775.0e6], ['281474976710662', 'Janus Henderson Treasury Fund', 610.2e6], ['281474976710664', 'Anemoy Tokenized Apollo Diversified Credit', 31.1e6], ['844424930131969', 'JAAA deRWA', 9.9e6], ['844424930131971', 'JTRSY deRWA', 9.2e6], ['281474976710674', 'Zivoe', 2.1e6]];
const TOKENS: [string, string, string, number, number][] = [['0x0001', '281474976710663', 'JAAA', 738235948, 1.0498], ['0x0002', '281474976710662', 'JTRSY', 583412000, 1.0459], ['0x0003', '281474976710664', 'ACRDX', 29800000, 1.0436], ['0x0004', '844424930131969', 'deJAAA', 9400000, 1.0498], ['0x0005', '844424930131971', 'deJTRSY', 8800000, 1.0459], ['0x0006', '281474976710674', 'zSMB', 2000000, 1.05]];
const pools = (): Pool[] => POOLS.map(([id, name, tvl]) => ({ id, name, tokens: TOKENS.filter((t) => t[1] === id).length || 1, tvl }));
const tokens = (): Token[] => TOKENS.map(([id, poolId, symbol, supply, pr]) => ({ id, poolId, poolName: POOLS.find((p) => p[0] === poolId)?.[1] ?? poolId, symbol, supply, price: pr, tvl: supply * pr, basis: 'snapshot' }));
const flows = (): Flow[] => { const r = rnd(5); const days = daysBack(90); const out: Flow[] = []; days.forEach((day, i) => { if (i % 3) return; const t = TOKENS[i % 3]; const dep = Math.round(r() * 8e6), red = Math.round(r() * 6e6); out.push({ id: `${day}-${t[0]}`, day, tokenId: t[0], symbol: t[2], poolId: t[1], deposits: dep, redemptions: red, net: dep - red, transactions: 1 + Math.round(r() * 4) }); }); return out.reverse(); };
export function sampleCf(): CfOverview {
  const ps = pools(), ts = tokens(), fl = flows(); const days = daysBack(90); const s = series(days, ps.reduce((a, p) => a + p.tvl, 0), 0.09, 0.006, 3);
  const m = new Map<string, { deposits: number; redemptions: number }>(); fl.forEach((f) => { const c = m.get(f.day) ?? { deposits: 0, redemptions: 0 }; c.deposits += f.deposits; c.redemptions += f.redemptions; m.set(f.day, c); });
  const tvl = s[s.length - 1];
  return { asOf: SAMPLE_AS_OF, sample: true,
    kpis: { tvl, tvlChange7d: (s[90] / s[83] - 1) * 100, pools: ps.length, tokens: ts.length, deposits: fl.reduce((a, f) => a + f.deposits, 0), redemptions: fl.reduce((a, f) => a + f.redemptions, 0), net: fl.reduce((a, f) => a + f.net, 0), transactions: fl.reduce((a, f) => a + f.transactions, 0) },
    history: days.map((day, i) => ({ day, tvl: Math.round(s[i]), defillama: 61317 })) as Point[], flowsByDay: [...m.entries()].map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
    byPool: ps.map((p) => ({ name: p.name, value: p.tvl })), pools: ps, tokens: ts, flows: fl,
    reconciliation: { ours: tvl, theirs: 61317, theirsSource: 'DefiLlama (sample)', note: 'DefiLlama\'s Centrifuge adapter reports a sliver of the pools; shown because the platform stores it, flagged as not comparable.' } };
}
export function samplePool(id: string): PoolDetail | null {
  const p = pools().find((x) => x.id === id); if (!p) return null; const days = daysBack(90); const s = series(days, p.tvl, 0.1, 0.008, 11);
  const ts = tokens().filter((t) => t.poolId === id);
  return { asOf: SAMPLE_AS_OF, sample: true, pool: p, tokens: ts, history: days.map((day, i) => ({ day, tvl: Math.round(s[i]) })), flows: flows().filter((f) => f.poolId === id), facts: [{ label: 'Tokens', value: String(p.tokens) }, { label: 'Largest token', value: ts[0] ? `${ts[0].symbol}` : 'n/a' }, { label: 'Pool id', value: p.id }] };
}
export function sampleToken(id: string): TokenDetail | null {
  const t = tokens().find((x) => x.id === id); if (!t) return null; const days = daysBack(420); const s = series(days, t.tvl, 1.8, 0.01, 13), pr = series(days, t.price, 0.05, 0.001, 17);
  return { asOf: SAMPLE_AS_OF, sample: true, token: t, history: days.map((day, i) => ({ day, tvl: Math.round(s[i]), supply: Math.round(s[i] / pr[i]) })), priceHistory: days.map((day, i) => ({ day, price: +pr[i].toFixed(4) })), flows: flows().filter((f) => f.tokenId === id), facts: [{ label: 'Price', value: `$${t.price}` }, { label: 'Supply', value: String(t.supply) }, { label: 'Basis', value: 'snapshot' }, { label: 'Pool', value: t.poolName }, { label: 'History since', value: days[0] }, { label: 'Token id', value: t.id }] };
}
