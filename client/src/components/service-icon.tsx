import { 
  Tv, Music, Gamepad2, Briefcase, Dumbbell, 
  Newspaper, Cloud, UtensilsCrossed, Box 
} from "lucide-react";
import type { Category } from "@shared/schema";
import { matchServiceIcon } from "@/lib/service-icons";

const categoryIcons: Record<Category, typeof Tv> = {
  streaming: Tv,
  music: Music,
  gaming: Gamepad2,
  productivity: Briefcase,
  fitness: Dumbbell,
  news: Newspaper,
  cloud: Cloud,
  food: UtensilsCrossed,
  other: Box,
};

interface ServiceIconProps {
  name: string;
  category: Category;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", icon: "w-4 h-4" },
  md: { container: "w-10 h-10", icon: "w-5 h-5" },
  lg: { container: "w-12 h-12", icon: "w-6 h-6" },
};

export function ServiceIcon({ name, category, size = "md", className = "" }: ServiceIconProps) {
  const matched = matchServiceIcon(name);
  const dimensions = sizeMap[size];

  if (matched) {
    const BrandIcon = matched.icon;
    return (
      <div 
        className={`${dimensions.container} rounded-md flex items-center justify-center shrink-0 ${className}`}
        style={{ backgroundColor: `${matched.color}15` }}
        data-testid={`icon-service-${name.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <BrandIcon 
          className={dimensions.icon}
          style={{ color: matched.color }} 
        />
      </div>
    );
  }

  const FallbackIcon = categoryIcons[category] || Box;

  return (
    <div 
      className={`${dimensions.container} rounded-md flex items-center justify-center shrink-0 bg-primary/10 ${className}`}
      data-testid={`icon-category-${category}`}
    >
      <FallbackIcon 
        className={`${dimensions.icon} text-primary`}
      />
    </div>
  );
}

export function ServiceIconInline({ name, category, size = 16 }: { name: string; category?: Category; size?: number }) {
  const matched = matchServiceIcon(name);
  if (matched) {
    const BrandIcon = matched.icon;
    return (
      <BrandIcon 
        style={{ color: matched.color, width: size, height: size }} 
      />
    );
  }

  const FallbackIcon = categoryIcons[category as Category] || Box;
  return <FallbackIcon style={{ width: size, height: size }} className="text-muted-foreground" />;
}
