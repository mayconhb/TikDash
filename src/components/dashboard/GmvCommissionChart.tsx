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

export function GmvCommissionChart({ data = [] }: GmvCommissionChartProps) {
  const formattedData = (data || []).map(item => ({
    ...item,
    dateFormatted: formatDateKeyShort(item.date),
  }));

  return (
    <div className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-6">
      <div className="flex flex-col space-y-1">
        <h3 className="text-lg font-bold text-text-main tracking-tight">GMV e comissão ao longo do tempo</h3>
        <p className="text-xs text-text-tertiary">Evolução diária dos resultados</p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
            <XAxis 
              dataKey="dateFormatted" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#A1A1AA' }}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#A1A1AA' }}
              tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: number, name: string) => [formatCurrency(value), name === 'gmv' ? 'GMV' : 'Comissão']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="gmv" fill="#6D5DFB" name="gmv" radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="monotone" dataKey="commission" stroke="#14B8A6" name="commission" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
