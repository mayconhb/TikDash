import { memo, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { formatDateKeyShort } from '../../lib/date-range';

interface GmvCommissionChartProps {
  data: { date: string; gmv: number; commission: number }[];
}

export const GmvCommissionChart = memo(function GmvCommissionChart({ data = [] }: GmvCommissionChartProps) {
  const formattedData = useMemo(() => (data || []).map(item => ({
    ...item,
    dateFormatted: formatDateKeyShort(item.date),
  })), [data]);

  return (
    <div className="bg-card px-3 py-5 rounded-[18px] border border-border-main shadow-soft space-y-6">
      <div className="flex flex-col space-y-1 px-3">
        <h3 className="text-lg font-bold text-text-main tracking-tight">Evolução diária da Comissão</h3>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
            <XAxis 
              dataKey="dateFormatted" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#A1A1AA' }}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#A1A1AA' }}
              tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => [formatCurrency(value), 'Comissão']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="commission" fill="#14B8A6" name="Comissão" radius={[4, 4, 0, 0]} barSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
