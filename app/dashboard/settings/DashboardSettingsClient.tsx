"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  GripVertical, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Save,
  Settings2,
  TrendingUp,
  Trophy,
  Flame,
  Activity,
  BarChart3,
  Loader2,
  Bell,
  Zap,
  Coins
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Widget {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  category: 'stats' | 'community' | 'content' | 'activity';
}

type LayoutType = 'default' | 'compact' | 'comfortable';

const WIDGET_DEFINITIONS = [
  {
    id: 'stats',
    name: 'Statistics Bar',
    description: 'Overview of forum threads, members, and activity',
    icon: BarChart3,
    category: 'stats' as const,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Recent notifications and alerts',
    icon: Bell,
    category: 'activity' as const,
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Fast access to common actions',
    icon: Zap,
    category: 'activity' as const,
  },
  {
    id: 'activity-timeline',
    name: 'Activity Timeline',
    description: 'Recent platform activity and updates',
    icon: Activity,
    category: 'activity' as const,
  },
  {
    id: 'earnings-summary',
    name: 'Earnings Summary',
    description: 'Breakdown of your earnings',
    icon: Coins,
    category: 'stats' as const,
  },
  {
    id: 'hot-threads',
    name: "What's Hot",
    description: 'Trending discussions and popular threads',
    icon: Flame,
    category: 'community' as const,
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Top contributors, uploaders, and active members',
    icon: Trophy,
    category: 'community' as const,
  },
  {
    id: 'week-highlights',
    name: "Week's Highlights",
    description: 'New, trending, and solved threads from this week',
    icon: TrendingUp,
    category: 'community' as const,
  },
  {
    id: 'activity-feed',
    name: 'Live Activity Feed',
    description: 'Real-time updates of forum activity',
    icon: Activity,
    category: 'activity' as const,
  },
  {
    id: 'top-sellers',
    name: 'Top Sellers',
    description: 'Best-selling EAs, indicators, and content',
    icon: TrendingUp,
    category: 'content' as const,
  },
];

interface DashboardPreferences {
  widgetOrder: string[];
  enabledWidgets: string[];
  layoutType: LayoutType;
}

interface DashboardSettingsClientProps {
  initialData: DashboardPreferences;
}

export default function DashboardSettingsClient({ initialData }: DashboardSettingsClientProps) {
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<LayoutType>('default');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: preferences, isLoading } = useQuery<DashboardPreferences>({
    queryKey: ['/api/dashboard/preferences'],
    initialData,
  });

  useEffect(() => {
    if (preferences) {
      const { widgetOrder, enabledWidgets, layoutType } = preferences;
      
      const widgetMap = new Map(WIDGET_DEFINITIONS.map(w => [w.id, w]));
      const orderedWidgets = widgetOrder.map((id: string) => {
        const def = widgetMap.get(id);
        return def ? {
          ...def,
          enabled: enabledWidgets.includes(id)
        } : null;
      }).filter(Boolean) as Widget[];
      
      setWidgets(orderedWidgets);
      setLayout(layoutType);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data: { widgetOrder: string[], enabledWidgets: string[], layoutType: LayoutType }) => {
      return apiRequest('POST', '/api/dashboard/preferences', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/preferences'] });
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your dashboard preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
    setHasChanges(true);
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex(w => w.id === widgetId);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === widgets.length - 1)
    ) {
      return;
    }

    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
    
    setWidgets(newWidgets);
    setHasChanges(true);
  };

  const resetToDefault = () => {
    const defaultEnabledWidgets = ['stats', 'notifications', 'quick-actions', 'activity-timeline', 'earnings-summary', 'hot-threads', 'leaderboard', 'week-highlights', 'activity-feed'];
    const defaultWidgetOrder = WIDGET_DEFINITIONS.map(w => w.id);
    
    const resetWidgets = WIDGET_DEFINITIONS.map(w => ({
      ...w,
      enabled: defaultEnabledWidgets.includes(w.id)
    }));
    
    setWidgets(resetWidgets);
    setLayout('default');
    setHasChanges(true);
  };

  const saveChanges = () => {
    const widgetOrder = widgets.map(w => w.id);
    const enabledWidgets = widgets.filter(w => w.enabled).map(w => w.id);
    
    saveMutation.mutate({
      widgetOrder,
      enabledWidgets,
      layoutType: layout
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stats': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'community': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'content': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'activity': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const enabledCount = widgets.filter(w => w.enabled).length;

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-settings-title">
            <Settings2 className="h-8 w-8 text-primary" />
            Dashboard Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your dashboard widgets and layout preferences
          </p>
        </div>
        
        {hasChanges && (
          <Badge variant="secondary" className="text-xs" data-testid="badge-unsaved">
            Unsaved Changes
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Widget Management */}
          <Card data-testid="card-widget-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    Dashboard Widgets
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Choose which widgets appear on your dashboard and arrange their order
                  </CardDescription>
                </div>
                <Badge variant="outline" data-testid="badge-enabled-count">
                  {enabledCount} / {widgets.length} enabled
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {widgets.map((widget, index) => (
                <div 
                  key={widget.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover-elevate"
                  data-testid={`widget-item-${widget.id}`}
                >
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={index === 0}
                      data-testid={`button-move-up-${widget.id}`}
                    >
                      <GripVertical className="h-3 w-3 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={index === widgets.length - 1}
                      data-testid={`button-move-down-${widget.id}`}
                    >
                      <GripVertical className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Widget Icon */}
                  <div className={`rounded-lg p-2 ${widget.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <widget.icon className={`h-5 w-5 ${widget.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>

                  {/* Widget Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm" data-testid={`text-widget-name-${widget.id}`}>
                        {widget.name}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(widget.category)}`}
                      >
                        {widget.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {widget.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={widget.enabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                      data-testid={`switch-widget-${widget.id}`}
                    />
                    {widget.enabled ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Layout Options */}
          <Card data-testid="card-layout-options">
            <CardHeader>
              <CardTitle className="text-base">Layout Style</CardTitle>
              <CardDescription>
                Choose how widgets are displayed on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={layout} onValueChange={(val) => { setLayout(val as LayoutType); setHasChanges(true); }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover-elevate" data-testid="layout-option-default">
                    <RadioGroupItem value="default" id="layout-default" />
                    <Label htmlFor="layout-default" className="flex-1 cursor-pointer">
                      <div className="font-medium">Default Layout</div>
                      <div className="text-xs text-muted-foreground">
                        Balanced spacing with standard widget sizes
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border hover-elevate" data-testid="layout-option-compact">
                    <RadioGroupItem value="compact" id="layout-compact" />
                    <Label htmlFor="layout-compact" className="flex-1 cursor-pointer">
                      <div className="font-medium">Compact Layout</div>
                      <div className="text-xs text-muted-foreground">
                        Tighter spacing to show more content at once
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border hover-elevate" data-testid="layout-option-comfortable">
                    <RadioGroupItem value="comfortable" id="layout-comfortable" />
                    <Label htmlFor="layout-comfortable" className="flex-1 cursor-pointer">
                      <div className="font-medium">Comfortable Layout</div>
                      <div className="text-xs text-muted-foreground">
                        Extra spacing for easier reading and navigation
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions Sidebar */}
        <div className="space-y-4">
          {/* Preview */}
          <Card data-testid="card-preview">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription className="text-xs">
                Your dashboard will display widgets in this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {widgets.filter(w => w.enabled).map((widget, index) => (
                <div 
                  key={widget.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  data-testid={`preview-item-${widget.id}`}
                >
                  <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs p-0">
                    {index + 1}
                  </Badge>
                  <widget.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium truncate">{widget.name}</span>
                </div>
              ))}
              
              {enabledCount === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No widgets enabled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              disabled={!hasChanges || saveMutation.isPending}
              onClick={saveChanges}
              data-testid="button-save-changes"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={resetToDefault}
              data-testid="button-reset-default"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          <Separator />

          {/* Info Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Real-time Updates</p>
                  <p className="text-xs text-muted-foreground">
                    All widgets refresh automatically to show the latest data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
