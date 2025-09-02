import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className = "" }: BreadcrumbProps) => {
  // Always include home as the first item
  const allItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items
  ];

  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight size={14} className="mx-1 text-gray-400" />
            )}
            
            {item.current || !item.href ? (
              <span 
                className="text-gray-900 font-medium flex items-center"
                aria-current={item.current ? "page" : undefined}
              >
                {index === 0 && <Home size={14} className="mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center"
              >
                {index === 0 && <Home size={14} className="mr-1" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;