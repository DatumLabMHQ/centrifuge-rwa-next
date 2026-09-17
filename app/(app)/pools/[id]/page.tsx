import { notFound } from 'next/navigation';
import { loadPool } from '@/lib/data';
import { count, usd } from '@/lib/format';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { DonutChart } from '@/components/charts';
import { DetailCharts } from '@/components/detail-charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';
import { FlowsTable, TokensTable } from '@/components/cf-tables';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadPool(id);
  return { title: d ? d.pool.name : 'Pool' };
}

export default async function PoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadPool(id);
  if (!d) notFound();
  const p = d.pool;
  const net = d.flows.reduce((a, f) => a + f.net, 0);
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Pools', href: '/pools' }, { label: p.name }]} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetAvatar symbol={p.name} className="size-9" />
          <div><h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{p.name}</h1><p className="text-sm text-muted-foreground">{count(p.tokens)} {p.tokens === 1 ? 'token' : 'tokens'} · Centrifuge pool</p></div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">{usd(p.tvl)} of TVL across {count(d.tokens.length)} {d.tokens.length === 1 ? 'token' : 'tokens'}. {d.flows.length ? `Investors ${net >= 0 ? 'added' : 'withdrew'} a net ${usd(Math.abs(net))} over the last ninety days in ${d.flows.length} active days.` : 'No investor flows in the last ninety days.'} As of {d.asOf}.</p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('TVL', usd(p.tvl), 'sum of the tokens')}
            {stat('Tokens', count(p.tokens), 'tranches or share classes')}
            {stat('Net flow, 90 days', `${net >= 0 ? '+' : ''}${usd(net)}`, `${d.flows.length} active days`)}
            {stat('Largest token', d.tokens[0]?.symbol ?? 'n/a', d.tokens[0] ? usd(d.tokens[0].tvl) : '')}
          </div>
          <DetailCharts asOf={d.asOf} history={d.history} historySeries={[{ key: 'tvl', label: 'TVL' }]} historyTitle="TVL" historyDescription="The pool's tokens, supply times price, summed per day." />
          <TokensTable data={d.tokens} title="Tokens in this pool" pageSize={10} caption={<><b className="font-medium text-foreground">Each token the pool issues.</b> Price is the NAV per token the API reports; basis says whether the row is our own read or the API&apos;s backfilled history.</>} />
          {d.flows.length ? <FlowsTable data={d.flows} title="Investor flows, 90 days" pageSize={10} caption={<><b className="font-medium text-foreground">Deposits and redemptions by day and token.</b> From executed and claimed investor transactions.</>} /> : null}
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>TVL by token</CardTitle><CardDescription>How the pool splits across its tokens.</CardDescription></CardHeader>
            <CardContent><DonutChart items={d.tokens.map((t) => ({ name: t.symbol, value: t.tvl }))} unit="usd" height={200} centerLabel="TVL" /></CardContent>
          </Card>
          <MarketFacts facts={d.facts} />
        </>}
      />
    </>
  );
}
