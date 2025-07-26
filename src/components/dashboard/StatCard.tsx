import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend = "neutral", 
  trendValue,
  className
}: StatCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-gray-500";
    }
  };

  return (
    <Card className={cn(
      "bg-white border border-red-100 transition-all duration-300 group",
      "shadow-lg hover:shadow-2xl",
      className
    )}
    style={{
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.18)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-red-600 group-hover:text-red-600 transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
          <Icon className="h-5 w-5 text-red-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        {description && (
          <p className="text-sm text-gray-700 leading-relaxed">
            {description}
          </p>
        )}
        {trendValue && (
          <p className={`text-sm mt-2 font-medium ${getTrendColor()}`}>
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

