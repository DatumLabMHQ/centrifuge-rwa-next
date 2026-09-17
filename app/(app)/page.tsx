// Overview: the question, the one-line answer, then the numbers.
import { config } from '@/datum.config';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { PageHeader } from '@/components/page-header';
import { CfCards } from '@/components/cf-cards';
import { PoolsTable } from '@/components/cf-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadCf } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;

export default async function Overview() {
  const d = await loadCf();
  const k = d.kpis;
  const lead = d.pools[0];
  return (
    <>
      <PageHeader eyebrow="Overview" question={config.question}
        answer={<>{usd(k.tvl)} sits in {count(k.pools)} Centrifuge pools across {count(k.tokens)} tokens as of {d.asOf}. {lead ? `${lead.name} alone is ${usd(lead.tvl)}, ${pct(k.tvl ? (lead.tvl / k.tvl) * 100 : 0, 0)} of the total.` : ''} Over the last {config.flowDays} days investors {k.net >= 0 ? 'added' : 'withdrew'} a net {usd(Math.abs(k.net))}: {usd(k.deposits)} in, {usd(k.redemptions)} out.</>} />
      <CfCards kpis={k} asOf={d.asOf} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={d.history} asOf={d.asOf} title="TVL, every pool" series={[{ key: 'tvl', label: 'TVL' }]} description={<>Our own token-level count: supply times price, summed over every pool. Daily points, as of {d.asOf}.</>} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>TVL by pool</CardTitle><CardDescription>Two Janus Henderson funds carry most of Centrifuge; the rest is a long tail of smaller pools.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byPool.slice(0, 8)} unit="usd" height={220} centerLabel="TVL" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deposits and redemptions per day</CardTitle><CardDescription>Investor money in and out over {config.flowDays} days, every token. Sparse by nature: a fund token sees a handful of transactions a month.</CardDescription></CardHeader>
          <CardContent className="px-2">{d.flowsByDay.length ? <BarChart data={d.flowsByDay} x="day" series={[{ key: 'deposits', label: 'Deposits' }, { key: 'redemptions', label: 'Redemptions' }]} unit="usd" height={220} legend /> : <p className="px-4 py-10 text-center text-sm text-muted-foreground">No flows in the window.</p>}</CardContent>
        </Card>
      </div>
      <PoolsTable data={d.pools} title="Pools" pageSize={10}
        caption={<><b className="font-medium text-foreground">Where the money is.</b> One row per pool, largest first; TVL is the sum of the pool&apos;s tokens. Every pool opens to its tokens and flows.</>} />
      {d.reconciliation ? (
        <p className="px-4 text-sm text-muted-foreground lg:px-6"><b className="font-medium text-foreground">Reconciliation.</b> Our TVL is {usd(d.reconciliation.ours)}; {d.reconciliation.theirsSource} reports {usd(d.reconciliation.theirs)}. {d.reconciliation.note}</p>
      ) : null}
    </>
  );
}
