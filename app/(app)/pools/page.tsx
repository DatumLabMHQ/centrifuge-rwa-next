import { PageHeader } from '@/components/page-header';
import { PoolsTable } from '@/components/cf-tables';
import { BarChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadCf } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Pools' };

export default async function Pools() {
  const d = await loadCf();
  const bars = d.pools.slice(0, 10).map((p) => ({ name: p.name.length > 30 ? p.name.slice(0, 28) + '…' : p.name, tvl: p.tvl }));
  const top2 = d.pools.slice(0, 2).reduce((a, p) => a + p.tvl, 0);
  return (
    <>
      <PageHeader eyebrow="Pools" question="Which pools hold the money?"
        answer={<>{count(d.pools.length)} pools as of {d.asOf}. The two largest hold {pct(d.kpis.tvl ? (top2 / d.kpis.tvl) * 100 : 0, 0)} of the {usd(d.kpis.tvl)} total; everything else is small.</>} />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>TVL by pool, ten largest</CardTitle><CardDescription>Supply times price, summed over each pool&apos;s tokens.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={bars} x="name" series={[{ key: 'tvl', label: 'TVL' }]} unit="usd" horizontal labels height={Math.max(220, bars.length * 30)} categoryWidth={200} /></CardContent>
        </Card>
      </div>
      <PoolsTable data={d.pools} title="All pools" pageSize={25} caption={<><b className="font-medium text-foreground">Every pool the platform tracks.</b> Open one for its tokens, its TVL history and its investor flows.</>} />
    </>
  );
}
