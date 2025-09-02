
import React from "react";
import { Card } from "@/components/ui/card";
import { Loader2, LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof LucideIcons;
  iconColor: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  loading = false, 
  onClick,
  className = ''
}) => {
  // Type assertion to ensure we get the correct icon component
  const IconComponent = LucideIcons[icon] as LucideIcon;
  
  return (
    <Card 
      className={`p-4 lg:p-6 border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm lg:text-base font-medium text-gray-600 leading-tight">{title}</h3>
        <div className="flex-shrink-0">
          {IconComponent && React.createElement(IconComponent, { className: iconColor + " h-6 w-6 lg:h-7 lg:w-7" })}
        </div>
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-gray-900">
        {loading ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <span className="tabular-nums">{value}</span>
        )}
      </div>
    </Card>
  );
};
