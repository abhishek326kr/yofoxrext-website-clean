"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Palette, Sun, Moon, Monitor, Type, Eye } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

export default function AppearanceSection() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [fontSize, setFontSize] = useState(16);
  const [compactMode, setCompactMode] = useState(false);

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun, description: "Light theme for daytime use" },
    { value: "dark", label: "Dark", icon: Moon, description: "Dark theme for low-light environments" },
  ];

  const accentColors = [
    { name: "Blue", value: "hsl(221.2 83.2% 53.3%)", class: "bg-blue-500" },
    { name: "Green", value: "hsl(142.1 76.2% 36.3%)", class: "bg-green-500" },
    { name: "Purple", value: "hsl(262.1 83.3% 57.8%)", class: "bg-purple-500" },
    { name: "Orange", value: "hsl(24.6 95% 53.1%)", class: "bg-orange-500" },
    { name: "Red", value: "hsl(0 84.2% 60.2%)", class: "bg-red-500" },
    { name: "Pink", value: "hsl(326.1 78.3% 54.1%)", class: "bg-pink-500" },
  ];

  const handleSaveAppearance = () => {
    toast({
      title: "Appearance Saved",
      description: "Your appearance preferences have been saved.",
    });
  };

  const handleResetAppearance = () => {
    setFontSize(16);
    setCompactMode(false);
    toast({
      title: "Appearance Reset",
      description: "Appearance settings have been reset to defaults.",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose how YoForex looks to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Color Mode</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={toggleTheme}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover-elevate ${
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    data-testid={`button-theme-${option.value}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <div className="font-medium mb-1">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Accent Color
          </CardTitle>
          <CardDescription>
            Choose your preferred accent color
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.name}
                className="group relative aspect-square rounded-lg border-2 border-border hover-elevate transition-all"
                data-testid={`button-color-${color.name.toLowerCase()}`}
              >
                <div className={`absolute inset-0 ${color.class} rounded-md m-1`} />
                <span className="sr-only">{color.name}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Custom accent colors coming soon
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Typography
          </CardTitle>
          <CardDescription>
            Adjust text size and density
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Font Size</Label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              id="font-size"
              min={12}
              max={20}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              data-testid="slider-font-size"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg bg-muted/50" style={{ fontSize: `${fontSize}px` }}>
              <h4 className="font-semibold mb-2">Sample Heading</h4>
              <p className="text-muted-foreground">
                This is how text will appear with your selected font size. The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for a more condensed layout
              </p>
            </div>
            <Button
              variant={compactMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCompactMode(!compactMode)}
              data-testid="button-compact-mode"
            >
              {compactMode ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Additional display and accessibility options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Reduce Motion</p>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={handleSaveAppearance}
          data-testid="button-save-appearance"
        >
          Save Changes
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleResetAppearance}
          data-testid="button-reset-appearance"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
