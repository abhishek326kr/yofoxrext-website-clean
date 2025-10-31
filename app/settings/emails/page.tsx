'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Bell, 
  BellOff, 
  CalendarIcon, 
  Clock, 
  Download, 
  Mail, 
  Shield, 
  Sparkles, 
  Trash2, 
  RefreshCw,
  History,
  Settings2,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  FileJson,
  Eye,
  MousePointer,
  Send,
  Coins,
  ShoppingBag,
  UserPlus,
  Heart,
  MessageSquare
} from 'lucide-react';

interface EmailPreferences {
  id: string;
  userId: string;
  socialInteractions: boolean;
  coinTransactions: boolean;
  contentUpdates: boolean;
  engagementDigest: boolean;
  marketplaceActivities: boolean;
  accountSecurity: boolean;
  moderationNotices: boolean;
  digestFrequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  dailyDigestTime?: string;
  weeklyDigestDay?: number;
  muteUntil?: string | null;
  vacationStart?: string | null;
  vacationEnd?: string | null;
  minTimeBetweenEmails?: number;
  groupSimilar?: boolean;
  emailFormat?: 'html' | 'plain';
  language?: string;
  promotionalEmails?: boolean;
  unsubscribedAt?: string | null;
}

interface EmailHistory {
  id: string;
  subject: string;
  templateKey: string;
  status: 'queued' | 'sent' | 'failed' | 'bounced';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, '0')}:00`,
  label: `${i === 0 ? '12' : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`
}));

export default function EmailPreferencesPage() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<EmailPreferences | null>(null);
  const [vacationDates, setVacationDates] = useState<{ from?: Date; to?: Date }>({});
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [masterToggle, setMasterToggle] = useState(true);

  // Fetch preferences
  const { data: preferences, isLoading, refetch } = useQuery({
    queryKey: ['/api/user/email-preferences'],
    enabled: true,
  });

  // Fetch email history
  const { data: emailHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['/api/user/email-history'],
    enabled: true,
  });

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: async (data: Partial<EmailPreferences>) => {
      return apiRequest('/api/user/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/email-preferences'] });
      toast({
        title: "Preferences saved",
        description: "Your email preferences have been updated successfully.",
      });
      setHasChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Initialize local preferences
  useEffect(() => {
    if (preferences && !localPrefs) {
      setLocalPrefs(preferences);
      setMasterToggle(!preferences.unsubscribedAt);
      
      // Set vacation dates if they exist
      if (preferences.vacationStart && preferences.vacationEnd) {
        setVacationDates({
          from: new Date(preferences.vacationStart),
          to: new Date(preferences.vacationEnd),
        });
      }
    }
  }, [preferences, localPrefs]);

  const handlePreferenceChange = (key: keyof EmailPreferences, value: any) => {
    if (localPrefs) {
      setLocalPrefs({ ...localPrefs, [key]: value });
      setHasChanges(true);
    }
  };

  const handleMasterToggle = async () => {
    const newValue = !masterToggle;
    setMasterToggle(newValue);
    
    if (newValue) {
      // Resubscribe
      await updatePrefsMutation.mutateAsync({ unsubscribedAt: null });
    } else {
      // Unsubscribe
      const confirmed = window.confirm(
        'Are you sure you want to unsubscribe from all emails? You can always re-enable them later.'
      );
      if (confirmed) {
        await updatePrefsMutation.mutateAsync({ unsubscribedAt: new Date().toISOString() });
      } else {
        setMasterToggle(true);
      }
    }
  };

  const handleSavePreferences = async () => {
    if (localPrefs && hasChanges) {
      await updatePrefsMutation.mutateAsync(localPrefs);
    }
  };

  const handleVacationMode = async () => {
    if (vacationDates.from && vacationDates.to) {
      await updatePrefsMutation.mutateAsync({
        vacationStart: vacationDates.from.toISOString(),
        vacationEnd: vacationDates.to.toISOString(),
        muteUntil: vacationDates.to.toISOString(),
      });
    }
  };

  const handleClearVacation = async () => {
    setVacationDates({});
    await updatePrefsMutation.mutateAsync({
      vacationStart: null,
      vacationEnd: null,
      muteUntil: null,
    });
  };

  const exportPreferences = () => {
    if (localPrefs) {
      const dataStr = JSON.stringify(localPrefs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `email-preferences-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Preferences exported",
        description: "Your email preferences have been downloaded as JSON.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'bounced':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!localPrefs) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load email preferences. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8" />
          Email Preferences
        </h1>
        <p className="text-muted-foreground mt-2">
          Control how and when you receive email notifications
        </p>
      </div>

      {/* Master Toggle */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {masterToggle ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              Master Email Toggle
            </span>
            <Switch
              checked={masterToggle}
              onCheckedChange={handleMasterToggle}
              data-testid="switch-master-toggle"
            />
          </CardTitle>
          <CardDescription>
            {masterToggle 
              ? "You are currently receiving emails based on your preferences below"
              : "All email notifications are currently disabled"}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Main Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Delivery Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Delivery Frequency
              </CardTitle>
              <CardDescription>
                Choose how often you want to receive email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={localPrefs.digestFrequency}
                  onValueChange={(value) => handlePreferenceChange('digestFrequency', value)}
                  disabled={!masterToggle}
                >
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant (Real-time)</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {localPrefs.digestFrequency === 'daily' && (
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Select
                    value={localPrefs.dailyDigestTime || '09:00'}
                    onValueChange={(value) => handlePreferenceChange('dailyDigestTime', value)}
                    disabled={!masterToggle}
                  >
                    <SelectTrigger data-testid="select-daily-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {localPrefs.digestFrequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Preferred Day</Label>
                  <Select
                    value={String(localPrefs.weeklyDigestDay || 1)}
                    onValueChange={(value) => handlePreferenceChange('weeklyDigestDay', parseInt(value))}
                    disabled={!masterToggle}
                  >
                    <SelectTrigger data-testid="select-weekly-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Email Categories
              </CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Social Interactions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Likes, comments, follows, and mentions
                    </p>
                  </div>
                  <Switch
                    checked={localPrefs.socialInteractions}
                    onCheckedChange={(value) => handlePreferenceChange('socialInteractions', value)}
                    disabled={!masterToggle}
                    data-testid="switch-social"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Money & Coins
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Transactions, sales, and purchases
                    </p>
                  </div>
                  <Switch
                    checked={localPrefs.coinTransactions}
                    onCheckedChange={(value) => handlePreferenceChange('coinTransactions', value)}
                    disabled={!masterToggle}
                    data-testid="switch-coins"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Content Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Approvals, milestones, and reviews
                    </p>
                  </div>
                  <Switch
                    checked={localPrefs.contentUpdates}
                    onCheckedChange={(value) => handlePreferenceChange('contentUpdates', value)}
                    disabled={!masterToggle}
                    data-testid="switch-content"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Marketplace
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sales, reviews, and payouts
                    </p>
                  </div>
                  <Switch
                    checked={localPrefs.marketplaceActivities}
                    onCheckedChange={(value) => handlePreferenceChange('marketplaceActivities', value)}
                    disabled={!masterToggle}
                    data-testid="switch-marketplace"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Account & Security
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Login alerts and password changes
                    </p>
                  </div>
                  <Switch
                    checked={localPrefs.accountSecurity}
                    onCheckedChange={(value) => handlePreferenceChange('accountSecurity', value)}
                    disabled={!masterToggle}
                    data-testid="switch-security"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vacation Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Vacation Mode
              </CardTitle>
              <CardDescription>
                Temporarily pause all emails during your time off
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {localPrefs.vacationStart && localPrefs.vacationEnd ? (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Vacation mode is active from{' '}
                      {format(new Date(localPrefs.vacationStart), 'PPP')} to{' '}
                      {format(new Date(localPrefs.vacationEnd), 'PPP')}
                    </AlertDescription>
                  </Alert>
                  <Button 
                    variant="outline" 
                    onClick={handleClearVacation}
                    data-testid="button-clear-vacation"
                  >
                    Clear Vacation Mode
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !vacationDates.from && "text-muted-foreground"
                          )}
                          data-testid="button-vacation-start"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {vacationDates.from ? format(vacationDates.from, 'PPP') : 'Start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={vacationDates.from}
                          onSelect={(date) => setVacationDates(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !vacationDates.to && "text-muted-foreground"
                          )}
                          data-testid="button-vacation-end"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {vacationDates.to ? format(vacationDates.to, 'PPP') : 'End date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={vacationDates.to}
                          onSelect={(date) => setVacationDates(prev => ({ ...prev, to: date }))}
                          disabled={(date) => date < (vacationDates.from || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleVacationMode}
                    disabled={!vacationDates.from || !vacationDates.to}
                    data-testid="button-activate-vacation"
                  >
                    Activate Vacation Mode
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          {hasChanges && (
            <div className="sticky bottom-4 flex justify-end">
              <Button 
                size="lg" 
                onClick={handleSavePreferences}
                disabled={updatePrefsMutation.isPending}
                data-testid="button-save-preferences"
              >
                {updatePrefsMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Minimum time between emails */}
              <div className="space-y-2">
                <Label>Minimum time between emails (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[localPrefs.minTimeBetweenEmails || 5]}
                    onValueChange={([value]) => handlePreferenceChange('minTimeBetweenEmails', value)}
                    max={60}
                    min={1}
                    step={1}
                    className="flex-1"
                    disabled={!masterToggle}
                  />
                  <span className="w-16 text-right">
                    {localPrefs.minTimeBetweenEmails || 5} min
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Prevents email spam by enforcing a minimum gap between notifications
                </p>
              </div>

              <Separator />

              {/* Group similar notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Group similar notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Combine multiple similar events into one email (e.g., "5 new likes")
                  </p>
                </div>
                <Switch
                  checked={localPrefs.groupSimilar ?? true}
                  onCheckedChange={(value) => handlePreferenceChange('groupSimilar', value)}
                  disabled={!masterToggle}
                  data-testid="switch-group-similar"
                />
              </div>

              <Separator />

              {/* Email format */}
              <div className="space-y-2">
                <Label>Email format</Label>
                <Select
                  value={localPrefs.emailFormat || 'html'}
                  onValueChange={(value) => handlePreferenceChange('emailFormat', value)}
                  disabled={!masterToggle}
                >
                  <SelectTrigger data-testid="select-email-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML (Rich formatting)</SelectItem>
                    <SelectItem value="plain">Plain text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Language preference */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language preference
                </Label>
                <Select
                  value={localPrefs.language || 'en'}
                  onValueChange={(value) => handlePreferenceChange('language', value)}
                  disabled={!masterToggle}
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Promotional emails */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promotional emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive special offers, new features, and marketing content
                  </p>
                </div>
                <Switch
                  checked={localPrefs.promotionalEmails ?? false}
                  onCheckedChange={(value) => handlePreferenceChange('promotionalEmails', value)}
                  disabled={!masterToggle}
                  data-testid="switch-promotional"
                />
              </div>
            </CardContent>
          </Card>

          {/* Export/Import Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Export Settings
              </CardTitle>
              <CardDescription>
                Download your email preferences as a JSON file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={exportPreferences}
                  data-testid="button-export"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Preferences
                </Button>
                <Button
                  variant="outline"
                  asChild
                  data-testid="link-privacy"
                >
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    <Shield className="mr-2 h-4 w-4" />
                    Privacy Policy
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button for Advanced Tab */}
          {hasChanges && (
            <div className="sticky bottom-4 flex justify-end">
              <Button 
                size="lg" 
                onClick={handleSavePreferences}
                disabled={updatePrefsMutation.isPending}
                data-testid="button-save-advanced"
              >
                {updatePrefsMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Email History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Email History
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchHistory()}
                  data-testid="button-refresh-history"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Your last 10 email notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailHistory && emailHistory.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {emailHistory.map((email: EmailHistory) => (
                      <div
                        key={email.id}
                        className="border rounded-lg p-4 space-y-2"
                        data-testid={`email-history-${email.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold">{email.subject}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {getStatusIcon(email.status)}
                                {email.status}
                              </span>
                              <span>
                                {email.sentAt
                                  ? format(new Date(email.sentAt), 'PPp')
                                  : formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Email interaction badges */}
                        <div className="flex gap-2">
                          {email.openedAt && (
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="mr-1 h-3 w-3" />
                              Opened
                            </Badge>
                          )}
                          {email.clickedAt && (
                            <Badge variant="secondary" className="text-xs">
                              <MousePointer className="mr-1 h-3 w-3" />
                              Clicked
                            </Badge>
                          )}
                          {email.status === 'failed' && email.error && (
                            <Badge variant="destructive" className="text-xs">
                              Error: {email.error}
                            </Badge>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex gap-2 pt-2">
                          {email.status === 'failed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-resend-${email.id}`}
                            >
                              <Send className="mr-1 h-3 w-3" />
                              Resend
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-spam-${email.id}`}
                              >
                                Mark as spam
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mark as spam?</DialogTitle>
                                <DialogDescription>
                                  This will help us improve our email filtering. Are you sure this email is spam?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button variant="destructive">Mark as spam</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No email history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}