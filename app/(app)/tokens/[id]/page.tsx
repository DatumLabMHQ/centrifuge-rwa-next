import { notFound } from 'next/navigation';
import { loadToken } from '@/lib/data';
import { count, price, usd } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { AreaChart, LineChart } from '@/components/charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';
import { FlowsTable } from '@/components/cf-tables';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadToken(id);
  return { title: d ? `${d.token.symbol}, ${d.token.poolName}` : 'Token' };
}

export default async function TokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadToken(id);
  if (!d) notFound();
  const t = d.token;
  const net = d.flows.reduce((a, f) => a + f.net, 0);
  const first = d.history[0];
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Tokens', href: '/tokens' }, { label: t.poolName, href: `/pools/${t.poolId}` }, { label: t.symbol }]} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetAvatar symbol={t.symbol} className="size-9" />
          <div><h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{t.symbol} <span className="text-muted-foreground">· {t.poolName}</span></h1><p className="flex items-center gap-2 text-sm text-muted-foreground">Centrifuge token <Badge variant={t.basis === 'snapshot' ? 'secondary' : 'outline'} className="font-normal">{t.basis === 'snapshot' ? 'our read' : 'API history'}</Badge></p></div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">{usd(t.tvl)} of TVL: {count(t.supply)} tokens at {price(t.price)}. {d.flows.length ? `Investors ${net >= 0 ? 'added' : 'withdrew'} a net ${usd(Math.abs(net))} over the last ninety days.` : 'No investor flows in the last ninety days.'} History since {first?.day ?? 'n/a'}. As of {d.asOf}.</p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('TVL', usd(t.tvl), 'supply times price')}
            {stat('Price', price(t.price), 'NAV per token')}
            {stat('Supply', count(t.supply), 'tokens outstanding')}
            {stat('Net flow, 90 days', `${net < 0 ? '-' : '+'}${usd(Math.abs(net))}`, `${d.flows.length} active days`)}
          </div>
          <Card>
            <CardHeader><CardTitle>TVL</CardTitle><CardDescription>Supply times price per day, since {first?.day ?? 'the first snapshot'}. Growth is issuance for a NAV-stable fund token.</CardDescription></CardHeader>
            <CardContent className="px-2">{d.history.length > 1 ? <AreaChart data={d.history} series={[{ key: 'tvl', label: 'TVL' }]} unit="usd" height={260} /> : <p className="px-4 py-10 text-center text-sm text-muted-foreground">Not enough history yet.</p>}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Price</CardTitle><CardDescription>NAV per token as the API reports it. A fund token accrues slowly; a step is a distribution or a revaluation.</CardDescription></CardHeader>
            <CardContent className="px-2">{d.priceHistory.length > 1 ? <LineChart data={d.priceHistory} series={[{ key: 'price', label: 'Price' }]} unit="usd" height={220} /> : <p className="px-4 py-10 text-center text-sm text-muted-foreground">Not enough history yet.</p>}</CardContent>
          </Card>
          {d.flows.length ? <FlowsTable data={d.flows} title="Investor flows, 90 days" pageSize={10} caption={<><b className="font-medium text-foreground">Deposits and redemptions by day.</b> From executed and claimed investor transactions.</>} /> : null}
        </>}
        aside={<MarketFacts facts={d.facts} />}
      />
    </>
  );
}
