
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const FeatureSection = ({
  title,
  description,
  icon,
  children,
  className = "",
}: FeatureSectionProps) => {
  return (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        {icon && <div className="mb-2 text-forrent-orange">{icon}</div>}
        <CardTitle className="text-xl text-forrent-navy">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default FeatureSection;
