import { cn } from "@/lib/utils";
import { type ComponentProps, useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";

interface VolumeChartProps extends ComponentProps<typeof Card> {
	data: { day: string; daily_sales: string }[];
}

const chartConfig = {
	conversations: {
		label: "Daily Revenue",
		color: "#f97316",
	},
} satisfies ChartConfig;

export function ConversationVolumeChart({
	className,
	data,
	...props
}: VolumeChartProps) {
	const chartUid = useId().replace(/:/g, "");
	const idAreaGradient = `conversation-volume-area-grad-${chartUid}`;

	const chartRows = useMemo(() => {
		return (data || []).map((item) => ({
			date: item.day,
			conversations: parseFloat(item.daily_sales) || 0,
		}));
	}, [data]);

	const growthPctNum = useMemo(() => {
		const first = chartRows[0];
		if (!first) return 0;
		const last = chartRows[chartRows.length - 1];
		if (!last) return 0;
		const a = first.conversations;
		const b = last.conversations;
		if (!a) return 0;
		return ((b - a) / a) * 100;
	}, [chartRows]);

	return (
		<Card
			className={cn(
				"shadow-none md:col-span-2 lg:col-span-3 dark:ring-0",
				className
			)}
			{...props}
		>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<CardTitle>Daily Revenue Volume</CardTitle>
						<span className={cn(
							"inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] tracking-tight",
							growthPctNum >= 0 
								? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30"
								: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700"
						)}>
							{growthPctNum >= 0 ? "↑" : "↓"} {Math.abs(growthPctNum).toFixed(1)}%
						</span>
					</div>
					<CardDescription>
						Revenue per day for the last 7 days.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-[22/8] w-full" config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={chartRows}
						margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id={idAreaGradient} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-conversations)"
									stopOpacity={0.45}
								/>
								<stop
									offset="55%"
									stopColor="var(--color-conversations)"
									stopOpacity={0.12}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-conversations)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="date"
							tickLine={false}
							tickMargin={8}
						/>
						<YAxis
							axisLine={false}
							tick={{ className: "tabular-nums" }}
							tickLine={false}
							tickMargin={8}
							width={36}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-34"
									indicator="line"
									labelFormatter={(value) => String(value)}
								/>
							}
							cursor={false}
						/>
						<Area
							dataKey="conversations"
							dot={false}
							fill={`url(#${idAreaGradient})`}
							stroke="var(--color-conversations)"
							strokeWidth={2}
							type="natural"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
