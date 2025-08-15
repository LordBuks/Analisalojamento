import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivateStatCardProps {
  title: string | React.ReactNode;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  color?: string;
}

export function PrivateStatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend = "neutral", 
  trendValue,
  className,
  color = "red"
}: PrivateStatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-gray-500";
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "green":
        return {
          titleColor: "text-green-600",
          bgColor: "bg-green-50",
          hoverBgColor: "group-hover:bg-green-100",
          iconColor: "text-green-600",
          borderColor: "border-green-100"
        };
      case "purple":
        return {
          titleColor: "text-purple-600",
          bgColor: "bg-purple-50",
          hoverBgColor: "group-hover:bg-purple-100",
          iconColor: "text-purple-600",
          borderColor: "border-purple-100"
        };
      default:
        return {
          titleColor: "text-red-600",
          bgColor: "bg-red-50",
          hoverBgColor: "group-hover:bg-red-100",
          iconColor: "text-red-600",
          borderColor: "border-red-100"
        };
    }
  };

  const colorClasses = getColorClasses();

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const renderValue = () => {
    if (isVisible) {
      return value;
    }
    // Criar asteriscos baseado no tamanho do valor
    const valueStr = value.toString();
    return '*'.repeat(Math.min(valueStr.length, 8));
  };

  return (
    <Card className={cn(
      `bg-white border ${colorClasses.borderColor} transition-all duration-300 group`,
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
        <CardTitle className={`text-sm font-semibold ${colorClasses.titleColor} group-hover:${colorClasses.titleColor} transition-colors`}>
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleVisibility}
            className={`p-1.5 ${colorClasses.bgColor} ${colorClasses.hoverBgColor} rounded-lg transition-colors hover:scale-110 transform duration-200`}
            title={isVisible ? "Ocultar valor" : "Mostrar valor"}
          >
            {isVisible ? (
              <EyeOff className={`h-4 w-4 ${colorClasses.iconColor}`} />
            ) : (
              <Eye className={`h-4 w-4 ${colorClasses.iconColor}`} />
            )}
          </button>
          <div className={`p-2 ${colorClasses.bgColor} ${colorClasses.hoverBgColor} rounded-lg transition-colors`}>
            <Icon className={`h-5 w-5 ${colorClasses.iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-1 font-mono">
          {renderValue()}
        </div>
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

