"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui";
import { Button } from "@acme/ui/button";

interface AgentQuickActionsProps {
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const ACTIONS = [
  {
    label: "Find cereal that avoids nuts",
    prompt: "Search products for cereal that is safe for nut allergies.",
  },
  {
    label: "Log a new reaction",
    prompt: "I need to log a reaction I had after dinner.",
  },
  {
    label: "Update my allergens",
    prompt: "Open my allergen preferences.",
  },
  {
    label: "Show recent community alerts",
    prompt: "Show me the latest reported reactions.",
  },
];

export function AgentQuickActions({
  onPrompt,
  disabled = false,
}: AgentQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ACTIONS.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="outline"
            className="justify-start"
            disabled={disabled}
            onClick={() => onPrompt(action.prompt)}
          >
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

