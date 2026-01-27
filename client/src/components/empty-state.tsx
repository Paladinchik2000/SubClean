import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" data-testid="container-empty-state">
      <div className="p-4 rounded-full bg-muted mb-4">
        <PackageOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm" data-testid="text-empty-description">{description}</p>
      {action}
    </div>
  );
}
