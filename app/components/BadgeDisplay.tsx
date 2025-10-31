"use client";

import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Star, 
  Award, 
  Heart, 
  Zap, 
  Bug 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type BadgeType = 'verified_trader' | 'top_contributor' | 'ea_master' | 'helpful' | 'early_adopter' | 'bug_hunter';

const BADGE_ICONS: Record<BadgeType, any> = {
  verified_trader: ShieldCheck,
  top_contributor: Star,
  ea_master: Award,
  helpful: Heart,
  early_adopter: Zap,
  bug_hunter: Bug,
};

const BADGE_COLORS: Record<BadgeType, string> = {
  verified_trader: 'text-blue-500',
  top_contributor: 'text-yellow-500',
  ea_master: 'text-purple-500',
  helpful: 'text-red-500',
  early_adopter: 'text-orange-500',
  bug_hunter: 'text-green-500',
};

export function BadgeDisplay({ 
  badges, 
  size = 'sm' 
}: { 
  badges: Array<{ id: string; name: string; description: string }>;
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex gap-1 flex-wrap" data-testid="badges-container">
      {badges.map(badge => {
        const Icon = BADGE_ICONS[badge.id as BadgeType];
        const color = BADGE_COLORS[badge.id as BadgeType];
        
        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="gap-1"
                data-testid={`badge-${badge.id}`}
              >
                {Icon && <Icon className={`${iconSize} ${color}`} />}
                {size !== 'sm' && badge.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-semibold">{badge.name}</div>
                <div className="text-xs text-muted-foreground">{badge.description}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
