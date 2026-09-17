// The KPI row: shadcn's section-cards recipe on the Centrifuge overview numbers. Server component.
import { TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react/ssr';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/datum.config';
import { count, delta, usd } from '@/lib/format';
import type { CfOverview } from '@/lib/cf-types';

type Stat = { label: string; value: string; change?: number; headline: string; detail: string };
function Trend({ change }: { change: number }) { const Icon = change >= 0 ? TrendUpIcon : TrendDownIcon; return <Badge variant="outline"><Icon />{delta(change)}</Badge>; }

export function CfCards({ kpis: k, asOf }: { kpis: CfOverview['kpis']; asOf: string }) {
  const stats: Stat[] = [
    { label: 'TVL', value: usd(k.tvl), change: k.tvlChange7d, headline: k.tvlChange7d >= 0 ? 'Growing over the week' : 'Shrinking over the week', detail: `${count(k.tokens)} tokens in ${count(k.pools)} pools, as of ${asOf}` },
    { label: `Net flow, ${config.flowDays} days`, value: `${k.net < 0 ? '-' : '+'}${usd(Math.abs(k.net))}`, headline: k.net >= 0 ? 'Money coming in' : 'Money going out', detail: `${usd(k.deposits)} deposited, ${usd(k.redemptions)} redeemed` },
    { label: `Deposits, ${config.flowDays} days`, value: usd(k.deposits), headline: `${k.transactions.toLocaleString('en-US')} investor transactions`, detail: 'Executed and claimed deposits, every token' },
    { label: `Redemptions, ${config.flowDays} days`, value: usd(k.redemptions), headline: k.redemptions > k.deposits ? 'Redemptions above deposits' : 'Deposits above redemptions', detail: 'Executed and claimed redemptions, every token' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((s) => (
        <Card key={s.label} className="@container/card">
          <CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums @[250px]/card:text-3xl">{s.value}</CardTitle>{s.change !== undefined ? <CardAction><Trend change={s.change} /></CardAction> : null}</CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm"><div className="line-clamp-1 flex gap-2 font-medium">{s.headline}{s.change !== undefined ? (s.change >= 0 ? <TrendUpIcon className="size-4" /> : <TrendDownIcon className="size-4" />) : null}</div><div className="text-muted-foreground">{s.detail}</div></CardFooter>
        </Card>
      ))}
    </div>
  );
}
