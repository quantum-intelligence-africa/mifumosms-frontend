// The agent's last seven days as stacked bars: calls they answered, and calls that did not connect to them.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";
import type { AgentTrendDay } from "@/services/callCenterApi";

export default function WeekChart({ data }: { data: AgentTrendDay[] }) {
  const { t, language } = useLanguage();
  const rows = data.map((d) => ({
    day: new Date(`${d.date}T12:00:00`).toLocaleDateString(language === "sw" ? "sw-TZ" : undefined, { weekday: "short" }),
    answered: d.answered,
    other: Math.max(0, d.total - d.answered),
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name === "answered" ? t("cc.workspace.week_answered") : t("cc.workspace.week_other")]}
        />
        <Bar dataKey="answered" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} maxBarSize={28} />
        <Bar dataKey="other" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
