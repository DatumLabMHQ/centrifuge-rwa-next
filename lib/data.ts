// What the kit's frame reads from this dashboard (lib/platform.ts FrameData), plus the loaders the
// pages use. The Centrifuge shapes and loaders live in lib/centrifuge.ts.
import type { FrameData } from './platform';
import { loadCf } from './centrifuge';
export { platformStatus, showKit } from './platform';
export { loadCf, loadPool, loadToken } from './centrifuge';

export const searchItems: FrameData['searchItems'] = async () => {
  const o = await loadCf();
  return [
    ...o.pools.map((p) => ({ label: p.name, href: `/pools/${p.id}`, hint: 'Pool' })),
    ...o.tokens.map((t) => ({ label: `${t.symbol}, ${t.poolName}`, href: `/tokens/${t.id}`, hint: 'Token' })),
  ];
};
export const navBadges: FrameData['navBadges'] = async () => {
  const o = await loadCf();
  return { '/pools': o.pools.length, '/tokens': o.tokens.length, '/flows': o.flows.length };
};
export const navChildren: FrameData['navChildren'] = async () => {
  const o = await loadCf();
  return {
    '/pools': o.pools.map((p) => ({ label: p.name, href: `/pools/${p.id}` })),
    '/tokens': o.tokens.map((t) => ({ label: `${t.symbol} · ${t.poolName}`, href: `/tokens/${t.id}` })),
  };
};
