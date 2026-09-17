import { config } from '@/datum.config';
import { PageHeader } from '@/components/page-header';
import { FlowsTable } from '@/components/cf-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadCf } from '@/lib/data';
import { count, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Flows' };

export default async function Flows() {
  const d = await loadCf();
  const k = d.kpis;
  const byToken = new Map<string, number>(); d.flows.forEach((f) => byToken.set(f.symbol, (byToken.get(f.symbol) ?? 0) + f.deposits));
  const deposits = [...byToken.entries()].map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const active = new Set(d.flows.map((f) => f.tokenId)).size;
  return (
    <>
      <PageHeader eyebrow="Flows" question="Is money coming into Centrifuge or going out, and through which tokens?"
        answer={<>Over the last {config.flowDays} days investors deposited {usd(k.deposits)} and redeemed {usd(k.redemptions)} across {count(active)} tokens, a net {k.net >= 0 ? 'inflow' : 'outflow'} of {usd(Math.abs(k.net))} in {k.transactions.toLocaleString('en-US')} transactions. As of {d.asOf}.</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader><CardTitle>Deposits and redemptions per day</CardTitle><CardDescription>Every token together. A fund token settles a handful of times a month, so most days are quiet.</CardDescription></CardHeader>
          <CardContent className="px-2">{d.flowsByDay.length ? <BarChart data={d.flowsByDay} x="day" series={[{ key: 'deposits', label: 'Deposits' }, { key: 'redemptions', label: 'Redemptions' }]} unit="usd" height={260} legend /> : <p className="px-4 py-10 text-center text-sm text-muted-foreground">No flows in the window.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deposits by token</CardTitle><CardDescription>Where new money went in the window.</CardDescription></CardHeader>
          <CardContent><DonutChart items={deposits.slice(0, 8)} unit="usd" height={240} centerLabel="deposited" /></CardContent>
        </Card>
      </div>
      <FlowsTable data={d.flows} title="Flows by day and token" pageSize={20} caption={<><b className="font-medium text-foreground">One row per token per active day, newest first.</b> Net flow is deposits minus redemptions; transactions counts the executed and claimed investor orders behind the row.</>} />
    </>
  );
}
