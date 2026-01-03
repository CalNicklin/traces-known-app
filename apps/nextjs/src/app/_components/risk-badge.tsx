import { Badge, cn } from "@acme/ui";

const riskStyles = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  moderate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  unknown: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
} as const;

interface RiskBadgeProps {
  level: "low" | "moderate" | "high" | "unknown";
}

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <Badge className={cn(riskStyles[level], "capitalize")}>{level} risk</Badge>
  );
}
