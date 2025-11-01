'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Zap,
  Activity,
  Globe,
  FileText,
  Gauge,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface SeoHealth {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  performanceScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastUpdated: string | null;
}

interface SeoIssue {
  id: string;
  category: 'technical' | 'content' | 'performance';
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'fixed' | 'ignored';
  pageUrl: string;
  pageTitle: string;
  description: string;
  autoFixable: boolean;
  createdAt: string;
}

export default function SeoMonitoring() {
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const { data: health, isLoading: healthLoading } = useQuery<SeoHealth>({
    queryKey: ['/api/admin/seo/health'],
  });

  const { data: issuesData, isLoading: issuesLoading } = useQuery<{ issues: SeoIssue[] }>({
    queryKey: ['/api/admin/seo/issues', { category: categoryFilter !== 'all' ? categoryFilter : undefined, severity: severityFilter !== 'all' ? severityFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }],
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/seo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType: 'full' }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to start scan');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'SEO scan started', description: 'Scanning all pages for SEO issues...' });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/health'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/issues'] });
      }, 5000);
    },
  });

  const autoFixMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/seo/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to auto-fix');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Auto-fix completed', description: `Fixed ${data.fixedCount} issues automatically` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/issues'] });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" data-testid={`badge-severity-critical`}>Critical</Badge>;
      case 'high': return <Badge variant="default" className="bg-orange-500" data-testid={`badge-severity-high`}>High</Badge>;
      case 'medium': return <Badge variant="default" className="bg-yellow-500" data-testid={`badge-severity-medium`}>Medium</Badge>;
      case 'low': return <Badge variant="secondary" data-testid={`badge-severity-low`}>Low</Badge>;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Globe className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      case 'performance': return <Gauge className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const issues = issuesData?.issues || [];
  const autoFixableCount = issues.filter(i => i.autoFixable && i.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(health?.overallScore || 0)}`} data-testid="text-overall-score">
              {health?.overallScore || 0}/100
            </div>
            <Progress value={health?.overallScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-issues">{health?.totalIssues || 0}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-red-600" data-testid="text-critical-count">{health?.criticalIssues || 0} Critical</span>
              <span className="text-orange-600" data-testid="text-high-count">{health?.highIssues || 0} High</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Fixable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="text-autofixable-count">{autoFixableCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Can be fixed automatically</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(health?.performanceScore || 0)}`} data-testid="text-performance-score">
              {health?.performanceScore || 0}/100
            </div>
            <Progress value={health?.performanceScore || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SEO Issues</CardTitle>
              <CardDescription>Monitor and fix SEO problems across your site</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="button-scan-now"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                Scan Now
              </Button>
              <Button
                onClick={() => autoFixMutation.mutate()}
                disabled={autoFixMutation.isPending || autoFixableCount === 0}
                size="sm"
                data-testid="button-auto-fix"
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto-Fix All ({autoFixableCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>

            <Select value="all" onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40" data-testid="select-severity-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Issue</th>
                    <th className="text-left p-3 font-medium">Page</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Severity</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issuesLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        Loading issues...
                      </td>
                    </tr>
                  ) : issues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-lg font-medium">No SEO issues found!</p>
                        <p className="text-sm text-muted-foreground">Your site is SEO-optimized</p>
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue.id} className="border-t hover:bg-muted/30" data-testid={`row-issue-${issue.id}`}>
                        <td className="p-3">
                          <div className="font-medium" data-testid={`text-issue-description-${issue.id}`}>{issue.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{issue.issueType}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm max-w-xs truncate" data-testid={`text-page-title-${issue.id}`}>{issue.pageTitle || 'Untitled'}</div>
                          <div className="text-xs text-muted-foreground truncate">{issue.pageUrl}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(issue.category)}
                            <span className="capitalize text-sm">{issue.category}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {getSeverityBadge(issue.severity)}
                        </td>
                        <td className="p-3">
                          {issue.status === 'active' && issue.autoFixable ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-fixable
                            </Badge>
                          ) : (
                            <Badge variant={issue.status === 'fixed' ? 'default' : 'secondary'}>
                              {issue.status}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {issue.status === 'active' && (
                            <Button size="sm" variant="outline" data-testid={`button-fix-${issue.id}`}>
                              Fix
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
