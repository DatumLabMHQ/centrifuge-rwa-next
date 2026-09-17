import { PageHeader } from '@/components/page-header';
import { TokensTable } from '@/components/cf-tables';
import { DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadCf } from '@/lib/data';
import { count, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Tokens' };

export default async function Tokens() {
  const d = await loadCf();
  const ours = d.tokens.filter((t) => t.basis === 'snapshot').length;
  return (
    <>
      <PageHeader eyebrow="Tokens" question="Which tokens exist, what are they worth, and where do the numbers come from?"
        answer={<>{count(d.tokens.length)} tokens across {count(d.pools.length)} pools as of {d.asOf}, {usd(d.kpis.tvl)} in total. {count(ours)} of them carry our own hourly read; the rest are the API&apos;s backfilled daily history.</>} />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>TVL by token</CardTitle><CardDescription>The eight largest. JAAA and JTRSY are most of Centrifuge; the deRWA tokens are their DeFi-wrapped forms.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.tokens.slice(0, 8).map((t) => ({ name: t.symbol, value: t.tvl }))} unit="usd" height={240} centerLabel="TVL" /></CardContent>
        </Card>
      </div>
      <TokensTable data={d.tokens} title="All tokens" pageSize={20} caption={<><b className="font-medium text-foreground">Every token the platform tracks.</b> Price is the NAV per token; open a token for its supply, price and TVL back to 2025 and its investor flows.</>} />
    </>
  );
}
