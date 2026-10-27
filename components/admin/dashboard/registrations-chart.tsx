"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { RegistrationDay } from "@/lib/admin/dashboard/fetch-admin-dashboard-stats";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type RangeKey = 7 | 30;

const chartConfig = {
  count: {
    label: copy.admin.overview.chart.title,
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatAxisDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year!, month! - 1, day!)));
}

export function RegistrationsChart({
  data,
}: {
  data: RegistrationDay[];
}) {
  const [range, setRange] = useState<RangeKey>(7);

  const chartData = useMemo(() => {
    const sliced = data.slice(-range);
    return sliced.map((row) => ({
      ...row,
      label: formatAxisDate(row.date),
    }));
  }, [data, range]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 pb-2">
        <CardTitle className="text-base font-semibold">
          {copy.admin.overview.chart.title}
        </CardTitle>
        <div className="flex rounded-[14px] border border-border-subtle p-0.5">
          {([7, 30] as const).map((days) => (
            <Button
              key={days}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 rounded-[12px] px-3 text-xs",
                range === days &&
                  "bg-muted text-foreground hover:bg-muted",
              )}
              onClick={() => setRange(days)}
            >
              {days === 7
                ? copy.admin.overview.chart.range7
                : copy.admin.overview.chart.range30}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <ChartContainer config={chartConfig} className="aspect-[2.4/1] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date as
                      | string
                      | undefined;
                    return date ? formatAxisDate(date) : null;
                  }}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
