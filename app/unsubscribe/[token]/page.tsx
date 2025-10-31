'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailPreferences {
  socialInteractions: boolean;
  coinTransactions: boolean;
  contentUpdates: boolean;
  engagementDigest: boolean;
  marketplaceActivities: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly';
}

export default function UnsubscribePage() {
  const { token } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  
  // Unsubscribe options
  const [unsubscribeType, setUnsubscribeType] = useState<'all' | 'selective'>('all');
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  
  // Email preferences
  const [preferences, setPreferences] = useState<EmailPreferences>({
    socialInteractions: true,
    coinTransactions: true,
    contentUpdates: true,
    engagementDigest: true,
    marketplaceActivities: true,
    digestFrequency: 'instant'
  });

  // Fetch current preferences
  useEffect(() => {
    if (token) {
      fetchPreferences();
    }
  }, [token]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`/api/email/preferences/${token}`);
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        reason,
        feedback
      };

      // If selective unsubscribe, send updated preferences
      if (unsubscribeType === 'selective') {
        payload.preferences = preferences;
      }

      const response = await fetch(`/api/email/unsubscribe/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setEmail(data.email || '');
        toast({
          title: 'Successfully Unsubscribed',
          description: unsubscribeType === 'all' 
            ? 'You have been unsubscribed from all emails.' 
            : 'Your email preferences have been updated.',
        });
      } else {
        setError(data.error || 'Failed to process unsubscribe request');
        toast({
          title: 'Error',
          description: data.error || 'Failed to process your request',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setError('Network error. Please try again.');
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubscribe = () => {
    window.location.href = '/settings/notifications';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Unsubscribe Successful</CardTitle>
            <CardDescription>
              {unsubscribeType === 'all' ? (
                <>You have been successfully unsubscribed from all YoForex emails.</>
              ) : (
                <>Your email preferences have been updated successfully.</>
              )}
              {email && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Email: {email}</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="inline h-4 w-4 mr-2" />
                Changed your mind? You can always manage your email preferences or re-subscribe from your account settings.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleResubscribe}
                className="flex-1"
                variant="outline"
              >
                Manage Preferences
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Preferences</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your email notification settings
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Unsubscribe Options</CardTitle>
            <CardDescription>
              Choose how you'd like to manage your email preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Unsubscribe Type */}
            <RadioGroup value={unsubscribeType} onValueChange={(value: 'all' | 'selective') => setUnsubscribeType(value)}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="all" id="all" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="all" className="cursor-pointer">
                      <span className="font-medium">Unsubscribe from all emails</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Stop receiving all email notifications from YoForex
                      </p>
                    </Label>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="selective" id="selective" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="selective" className="cursor-pointer">
                      <span className="font-medium">Manage specific email categories</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Choose which types of emails you want to receive
                      </p>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {/* Selective Preferences */}
            {unsubscribeType === 'selective' && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">Email Categories</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="social"
                      checked={preferences.socialInteractions}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, socialInteractions: checked as boolean})
                      }
                    />
                    <Label htmlFor="social" className="cursor-pointer">
                      <span className="font-medium">Social Interactions</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block">
                        Likes, comments, follows, and mentions
                      </span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="coins"
                      checked={preferences.coinTransactions}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, coinTransactions: checked as boolean})
                      }
                    />
                    <Label htmlFor="coins" className="cursor-pointer">
                      <span className="font-medium">Coin Transactions</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block">
                        Earnings, purchases, and wallet updates
                      </span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="content"
                      checked={preferences.contentUpdates}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, contentUpdates: checked as boolean})
                      }
                    />
                    <Label htmlFor="content" className="cursor-pointer">
                      <span className="font-medium">Content Updates</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block">
                        New posts, approvals, and milestones
                      </span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="digest"
                      checked={preferences.engagementDigest}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, engagementDigest: checked as boolean})
                      }
                    />
                    <Label htmlFor="digest" className="cursor-pointer">
                      <span className="font-medium">Engagement Digest</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block">
                        Weekly summaries and trending content
                      </span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="marketplace"
                      checked={preferences.marketplaceActivities}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, marketplaceActivities: checked as boolean})
                      }
                    />
                    <Label htmlFor="marketplace" className="cursor-pointer">
                      <span className="font-medium">Marketplace Activities</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block">
                        Sales, reviews, and purchases
                      </span>
                    </Label>
                  </div>
                </div>

                {/* Digest Frequency */}
                <div className="pt-3 border-t">
                  <Label htmlFor="frequency">Email Frequency</Label>
                  <Select 
                    value={preferences.digestFrequency} 
                    onValueChange={(value: 'instant' | 'daily' | 'weekly') => 
                      setPreferences({...preferences, digestFrequency: value})
                    }
                  >
                    <SelectTrigger id="frequency" className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant notifications</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Reason for Unsubscribing */}
            <div>
              <Label htmlFor="reason">Reason for unsubscribing (optional)</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason" className="w-full mt-2">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="too_many">Too many emails</SelectItem>
                  <SelectItem value="not_relevant">Content not relevant</SelectItem>
                  <SelectItem value="privacy">Privacy concerns</SelectItem>
                  <SelectItem value="no_longer_interested">No longer interested</SelectItem>
                  <SelectItem value="temporary">Taking a break</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Feedback */}
            <div>
              <Label htmlFor="feedback">Additional feedback (optional)</Label>
              <Textarea 
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Help us improve by sharing your thoughts..."
                className="mt-2"
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your feedback helps us improve our email communications
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUnsubscribe}
                disabled={submitting}
                className="flex-1"
                variant={unsubscribeType === 'all' ? 'destructive' : 'default'}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Processing...
                  </>
                ) : (
                  unsubscribeType === 'all' ? 'Unsubscribe from All' : 'Update Preferences'
                )}
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            {/* Privacy Note */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your privacy is important to us. You can change these settings at any time from your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}