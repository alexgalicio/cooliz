import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'violet';
}

const iconStyles = {
  blue: 'bg-blue/10 text-blue',
  green: 'bg-green/10 text-green',
  red: 'bg-red/10 text-red',
  violet: 'bg-violet/10 text-violet',
};


function StatsCard({ title, value, icon, variant="blue"}: StatCardProps) {
  return (
    <div className="p-6 rounded-xl border border-border p-4 lg:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 lg:mt-2 text-xl lg:text-3xl font-semibold text-foreground truncate">{value}</p>
        </div>
        <div
          className={`rounded-lg lg:rounded-xl p-2 lg:p-3 flex-shrink-0 ${iconStyles[variant]}`}
        >
          <div className="h-4 w-4 lg:h-6 lg:w-6 [&>svg]:h-full [&>svg]:w-full">
            {icon}
          </div>
        </div>

      </div>
    </div>
  )
}

export default StatsCard;