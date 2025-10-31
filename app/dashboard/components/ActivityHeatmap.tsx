"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import * as d3 from "d3";
import { useMemo, useState } from "react";

interface ActivityCell {
  hour: number;
  day: number;
  count: number;
  suggestion?: string;
}

interface HeatmapData {
  data: ActivityCell[];
  maxCount: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmap() {
  const { data, isLoading } = useQuery<HeatmapData>({
    queryKey: ['/api/dashboard/activity-heatmap'],
    staleTime: 5 * 60 * 1000,
  });

  const [hoveredCell, setHoveredCell] = useState<ActivityCell | null>(null);

  const colorScale = useMemo(() => {
    if (!data) return null;
    return d3
      .scaleLinear<string>()
      .domain([0, data.maxCount || 10])
      .range(['#f3f4f6', '#2563eb']);
  }, [data]);

  if (isLoading) {
    return (
      <Card data-testid="activity-heatmap">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const getActivityForCell = (hour: number, day: number): ActivityCell | undefined => {
    return data?.data.find((cell) => cell.hour === hour && cell.day === day);
  };

  const cellSize = 28;
  const gap = 2;

  return (
    <Card data-testid="activity-heatmap">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex gap-2 mb-2">
                <div className="w-12" />
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="text-xs text-muted-foreground text-center"
                    style={{ width: cellSize }}
                  >
                    {hour % 6 === 0 ? hour : ''}
                  </div>
                ))}
              </div>

              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex gap-2 mb-1">
                  <div className="w-12 text-xs text-muted-foreground flex items-center">
                    {day}
                  </div>
                  {HOURS.map((hour) => {
                    const activity = getActivityForCell(hour, dayIndex);
                    const count = activity?.count || 0;
                    const color = colorScale?.(count) || '#f3f4f6';

                    return (
                      <div
                        key={`${day}-${hour}`}
                        data-testid={`heatmap-cell-${hour}-${dayIndex}`}
                        className="rounded cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:scale-110"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: color,
                        }}
                        onMouseEnter={() => setHoveredCell(activity || { hour, day: dayIndex, count: 0 })}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {hoveredCell && (
            <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {DAYS[hoveredCell.day]} at {hoveredCell.hour}:00
                </span>
                <span className="text-2xl font-bold text-primary">
                  {hoveredCell.count}
                </span>
              </div>
              {hoveredCell.suggestion && (
                <p className="text-sm text-muted-foreground">
                  💡 {hoveredCell.suggestion}
                </p>
              )}
              {!hoveredCell.suggestion && hoveredCell.count === 0 && (
                <p className="text-sm text-muted-foreground">
                  💡 No activity during this time. Consider posting here for better visibility!
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Activity Level:</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map((value, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: colorScale?.(
                      value * (data?.maxCount || 10)
                    ) || '#f3f4f6',
                  }}
                />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
