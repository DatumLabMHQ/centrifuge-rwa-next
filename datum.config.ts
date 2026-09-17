// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, and the navigation. lib/centrifuge.ts turns the four centrifuge resources into the shapes the
// pages read; without DATUM_API_KEY the pages run on labelled sample data (lib/sample.ts).
export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'draft' as 'draft' | 'live',
  slug: 'centrifuge-rwa-next',
  // The name this dashboard's brief, product note and reconciliation rows use in datum-context.
  context: 'centrifuge-rwa',
  title: 'Centrifuge RWA',
  description: 'Every Centrifuge pool and token: supply, price, TVL and investor flows, read hourly from the Datum data platform.',
  // The question the overview answers. Pages lead with it.
  question: 'How much tokenized credit sits in Centrifuge pools, and is money coming in or going out?',
  product: { slug: 'centrifuge', label: 'Centrifuge', defillamaSlug: 'centrifuge' },
  resources: {
    tokens: { product: 'centrifuge', name: 'tokens' },      // one row per token per day: supply, price, TVL, basis
    pools: { product: 'centrifuge', name: 'pools' },        // one row per pool per day: name, tokens, TVL
    flows: { product: 'centrifuge', name: 'flows' },        // deposits, redemptions, net flow per token per day
    protocol: { product: 'centrifuge', name: 'protocol' },  // our token-level TVL beside DefiLlama, per day
  },
  trend: { days: 90 },
  flowDays: 90,
  tokenHistoryFrom: '2025-01-01',
  // The sign-in gate: the overview is open to everyone; every other page asks once for a name, an email
  // and an occupation (kept on that browser). Leads join the Datum Labs list through app/api/gate.
  gate: { enabled: true, free: ['/'] as string[] },
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/pools', label: 'Pools' },
    { href: '/tokens', label: 'Tokens' },
    { href: '/flows', label: 'Flows' },
    { href: '/methodology', label: 'Methodology' },
  ],
  sources: [
    { name: 'Datum data platform: tokens and pools', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'Every Centrifuge token with its supply, price and TVL, read from the Centrifuge API through the Datum proxy; pools are the sums of their tokens. Rows say their basis: snapshot (our hourly read) or api_history (the API\'s own backfill). Token history reaches back to 2025 for the older tokens.' },
    { name: 'Datum data platform: investor flows', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'Deposits and redemptions per token per day from executed and claimed investor transactions. Sparse by nature: most tokens see a handful of transactions a month.' },
    { name: 'DefiLlama', role: 'comparison' as 'headline' | 'comparison', cadence: 'daily', detail: 'Stored beside our TVL for the reconciliation. DefiLlama\'s Centrifuge figure covers only a sliver of the pools (tens of thousands of dollars against our billion and a half), so the comparison is shown and flagged, not trusted.' },
  ],
  definitions: [
    { term: 'TVL', unit: 'USD', text: 'Token supply times token price, summed per pool and across every pool, at the snapshot.' },
    { term: 'Price', unit: 'USD', text: 'The token price the Centrifuge API reports, which for a fund token is its NAV per share.' },
    { term: 'Deposits, redemptions', unit: 'USD', text: 'Investor money in and out of a token on a day, from executed and claimed transactions; net flow is the difference.' },
    { term: 'Basis', unit: 'label', text: 'snapshot: our own hourly read. api_history: a daily figure the API backfilled before our reads began.' },
    { term: 'Pool', unit: 'label', text: 'A Centrifuge pool issues one or more tokens (tranches or share classes); its TVL is the sum of theirs.' },
  ],
};
export type DatumConfig = typeof config;
