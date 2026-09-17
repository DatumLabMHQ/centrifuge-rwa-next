// The shapes the Centrifuge pages read. lib/centrifuge.ts fills them from the platform's four
// centrifuge resources (or lib/sample.ts without a key).
import type { Point, Share } from './types';
export type { Point, Share, Fact } from './types';

export type Pool = { id: string; name: string; tokens: number; tvl: number };
export type Token = { id: string; poolId: string; poolName: string; symbol: string; supply: number; price: number; tvl: number; basis: string };
export type Flow = { id: string; day: string; tokenId: string; symbol: string; poolId: string; deposits: number; redemptions: number; net: number; transactions: number };
export type CfOverview = {
  asOf: string; sample: boolean;
  kpis: { tvl: number; tvlChange7d: number; pools: number; tokens: number; deposits: number; redemptions: number; net: number; transactions: number };
  history: Point[];      // day, tvl (our own token-level TVL)
  flowsByDay: Point[];   // day, deposits, redemptions
  byPool: Share[];
  pools: Pool[]; tokens: Token[]; flows: Flow[];
  reconciliation: { ours: number; theirs: number; theirsSource: string; note: string } | null;
};
export type PoolDetail = { asOf: string; sample: boolean; pool: Pool; tokens: Token[]; history: Point[]; flows: Flow[]; facts: import('./types').Fact[] };
export type TokenDetail = { asOf: string; sample: boolean; token: Token; history: Point[]; priceHistory: Point[]; flows: Flow[]; facts: import('./types').Fact[] };
