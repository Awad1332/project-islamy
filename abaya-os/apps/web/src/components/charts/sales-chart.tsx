'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '@/i18n';

export function SalesChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const { money, locale } = useI18n();
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8975A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#B8975A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E8DFD3" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11, fill: '#6B6866' }} axisLine={false} tickLine={false} reversed={locale === 'ar'} />
          <YAxis tickFormatter={(v: number) => `${Math.round(v / 100)}`} tick={{ fontSize: 11, fill: '#6B6866' }} axisLine={false} tickLine={false} width={48} orientation={locale === 'ar' ? 'right' : 'left'} />
          <Tooltip formatter={(v) => money(Number(v))} labelStyle={{ color: '#2B2B2B' }} contentStyle={{ borderRadius: 8, borderColor: '#E8DFD3' }} />
          <Area type="monotone" dataKey="revenue" stroke="#9A7B43" strokeWidth={2} fill="url(#gold)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
