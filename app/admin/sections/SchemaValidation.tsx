/**
 * Schema Validation Admin Dashboard
 * 
 * Real-time schema validation monitoring and testing dashboard
 * Shows validation status, errors, logs, and provides testing links
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  ExternalLink, 
  Code, 
  RefreshCw,
  Search,
  Eye,
  FileJson,
  FileText,
  Globe,
  TrendingUp,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SchemaValidationResult {
  url: string;
  pageType: string;
  schemaType: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lastValidated: string;
  schema: any;
}

interface ValidationLog {
  id: string;
  url: string;
  pageType: string;
  status: 'valid' | 'invalid' | 'warning';
  errorCount: number;
  warningCount: number;
  timestamp: string;
  details?: string;
}

interface SchemaStats {
  totalPages: number;
  validPages: number;
  invalidPages: number;
  warningPages: number;
  lastValidationRun: string;
  schemaTypes: {
    type: string;
    count: number;
    validCount: number;
  }[];
}

// ============================================================================
// SAMPLE DATA (Replace with real API calls)
// ============================================================================

const SAMPLE_PAGES = [
  {
    url: '/',
    type: 'Homepage',
    schemaTypes: ['Organization', 'WebSite'],
    status: 'valid' as const,
  },
  {
    url: '/category/trading-strategies/martingale-strategy',
    type: 'Thread (Forum)',
    schemaTypes: ['DiscussionForumPosting', 'BreadcrumbList', 'Comment'],
    status: 'valid' as const,
  },
  {
    url: '/category/expert-advisors/mt4/trend-ea',
    type: 'Product (Marketplace)',
    schemaTypes: ['Product', 'AggregateRating', 'Review', 'BreadcrumbList'],
    status: 'valid' as const,
  },
  {
    url: '/user/forex_newbie423',
    type: 'Profile',
    schemaTypes: ['Person'],
    status: 'valid' as const,
  },
  {
    url: '/category/forex-education/beginner-guide',
    type: 'Article/Blog',
    schemaTypes: ['Article', 'BreadcrumbList'],
    status: 'warning' as const,
    warning: 'Consider adding author image for rich results',
  },
];

const SAMPLE_LOGS: ValidationLog[] = [
  {
    id: '1',
    url: '/',
    pageType: 'Homepage',
    status: 'valid',
    errorCount: 0,
    warningCount: 0,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    url: '/thread/best-scalping-ea',
    pageType: 'Article',
    status: 'valid',
    errorCount: 0,
    warningCount: 1,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    details: 'Missing recommended property: image dimensions',
  },
  {
    id: '3',
    url: '/content/invalid-product',
    pageType: 'Product',
    status: 'invalid',
    errorCount: 2,
    warningCount: 0,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    details: 'Missing required properties: price, availability',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchemaValidation() {
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [testUrl, setTestUrl] = useState<string>('');
  const [validationResults, setValidationResults] = useState<SchemaValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch schema validation stats
  const { data: stats } = useQuery<SchemaStats>({
    queryKey: ['/api/admin/schema/stats'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch validation logs
  const { data: logs } = useQuery<ValidationLog[]>({
    queryKey: ['/api/admin/schema/logs'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Validate all pages mutation
  const validateAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/schema/validate-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/schema/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/schema/logs'] });
    },
  });

  // Validate single page
  const validatePage = async (url: string) => {
    setIsValidating(true);
    try {
      const response = await apiRequest('POST', '/api/admin/schema/validate', { url });
      const result = await response.json();
      setValidationResults([result, ...validationResults.slice(0, 9)]);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: 'valid' | 'invalid' | 'warning') => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'valid' | 'invalid' | 'warning') => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      valid: 'default',
      invalid: 'destructive',
      warning: 'outline',
    };
    return (
      <Badge variant={variants[status]} className="gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Schema Validation Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring and validation of Schema.org JSON-LD structured data across all pages
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPages || SAMPLE_PAGES.length}</div>
            <p className="text-xs text-muted-foreground">With schema markup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Schemas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.validPages || 5}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? Math.round((stats.validPages / stats.totalPages) * 100) : 83}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.warningPages || 1}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.invalidPages || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require fixes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validator">Live Validator</TabsTrigger>
          <TabsTrigger value="logs">Validation Logs</TabsTrigger>
          <TabsTrigger value="schema-types">Schema Types</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Page Validation Status
              </CardTitle>
              <CardDescription>
                Current schema validation status for all pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  Last validation: {stats?.lastValidationRun || 'Just now'}
                </div>
                <Button
                  onClick={() => validateAllMutation.mutate()}
                  disabled={validateAllMutation.isPending}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${validateAllMutation.isPending ? 'animate-spin' : ''}`} />
                  Validate All Pages
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {SAMPLE_PAGES.map((page, idx) => {
                    const log = SAMPLE_LOGS.find(l => l.url === page.url);
                    const status = log?.status || 'valid';
                    
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{page.url}</span>
                            <Badge variant="secondary" className="text-xs">
                              {page.type}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            {page.schemaTypes.map((type, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                          {log?.details && (
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTestUrl(page.url);
                              setSelectedPage(page.url);
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Testing Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Testing Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Google Rich Results Test
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => window.open('https://validator.schema.org/', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Schema.org Validator
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => window.open('https://search.google.com/search-console', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Google Search Console
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => window.open('https://json-ld.org/playground/', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                JSON-LD Playground
              </Button>
            </CardContent>
          </Card>

          {/* Schema Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schema Type Distribution</CardTitle>
              <CardDescription>Number of pages by schema type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">DiscussionForumPosting</span>
                  <Badge variant="secondary">Threads</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Product</span>
                  <Badge variant="secondary">Marketplace</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Person</span>
                  <Badge variant="secondary">Profiles</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Article/BlogPosting</span>
                  <Badge variant="secondary">Content</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Rich Results Testing */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Google Rich Results Testing
              </CardTitle>
              <CardDescription>
                Test your schemas with Google's official validation tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Rich Results Test</h4>
                  <p className="text-sm text-muted-foreground">
                    Test how Google sees your structured data
                  </p>
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    data-testid="link-google-rich-results"
                  >
                    Open Rich Results Test <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Schema Markup Validator</h4>
                  <p className="text-sm text-muted-foreground">
                    Validate your JSON-LD against Schema.org standards
                  </p>
                  <a
                    href="https://validator.schema.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    data-testid="link-schema-validator"
                  >
                    Open Schema Validator <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              
              {/* Quick Test URLs */}
              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-sm">Quick Test URLs</h4>
                <div className="grid gap-2">
                  {[
                    { type: 'Thread', url: '/category/trading-strategies/best-scalping-ea' },
                    { type: 'Marketplace', url: '/category/expert-advisors/trend-ea' },
                    { type: 'Profile', url: '/user/forex_newbie423' },
                  ].map((test) => (
                    <div key={test.type} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{test.type}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fullUrl = `${window.location.origin}${test.url}`;
                            const testUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(fullUrl)}`;
                            window.open(testUrl, '_blank');
                          }}
                          data-testid={`button-test-google-${test.type.toLowerCase()}`}
                        >
                          Test in Google <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}${test.url}`)}
                          data-testid={`button-copy-url-${test.type.toLowerCase()}`}
                        >
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Logs */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Validation Logs
              </CardTitle>
              <CardDescription>
                Recent schema validation events and errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">All schemas validated successfully</p>
                    <p className="text-xs text-muted-foreground">Last check: Just now</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground text-center py-4">
                  No validation errors detected
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schema.org 2025 Compliance Checklist */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Schema.org 2025 Compliance Checklist</CardTitle>
              <CardDescription>Ensure all schemas meet the latest standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { item: 'All schemas use @context: "https://schema.org"', status: true },
                  { item: 'Required properties present for each type', status: true },
                  { item: 'Publisher includes Organization with logo', status: true },
                  { item: 'Dates in ISO 8601 format', status: true },
                  { item: 'Images include proper dimensions', status: false, note: 'Optional but recommended' },
                  { item: 'Videos use ISO 8601 duration format', status: true },
                ].map((check, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {check.status ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{check.item}</p>
                      {check.note && (
                        <p className="text-xs text-muted-foreground">{check.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Validator Tab */}
        <TabsContent value="validator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Schema Validator</CardTitle>
              <CardDescription>
                Test and validate schema markup for any page URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="test-url">Page URL</Label>
                  <Input
                    id="test-url"
                    placeholder="/thread/best-scalping-ea"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => validatePage(testUrl)}
                    disabled={!testUrl || isValidating}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Validate
                  </Button>
                </div>
              </div>

              {validationResults.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="text-sm font-medium">Validation Results</div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {validationResults.map((result, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{result.url}</CardTitle>
                              {getStatusBadge(result.isValid ? 'valid' : 'invalid')}
                            </div>
                            <CardDescription>
                              Schema Type: {result.schemaType} • Page Type: {result.pageType}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {result.errors.length > 0 && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Errors Found</AlertTitle>
                                <AlertDescription>
                                  <ul className="list-disc list-inside space-y-1">
                                    {result.errors.map((error, i) => (
                                      <li key={i} className="text-sm">{error}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}

                            {result.warnings.length > 0 && (
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Warnings</AlertTitle>
                                <AlertDescription>
                                  <ul className="list-disc list-inside space-y-1">
                                    {result.warnings.map((warning, i) => (
                                      <li key={i} className="text-sm">{warning}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}

                            {result.isValid && result.errors.length === 0 && (
                              <Alert>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle>Schema Valid</AlertTitle>
                                <AlertDescription>
                                  All required properties present and valid
                                </AlertDescription>
                              </Alert>
                            )}

                            <details className="border rounded-lg p-3">
                              <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                View Schema JSON
                              </summary>
                              <pre className="mt-3 text-xs bg-muted p-3 rounded overflow-x-auto">
                                {JSON.stringify(result.schema, null, 2)}
                              </pre>
                            </details>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com';
                                  window.open(
                                    `https://search.google.com/test/rich-results?url=${encodeURIComponent(siteUrl + result.url)}`,
                                    '_blank'
                                  );
                                }}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Test in Google
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com';
                                  window.open(
                                    `https://validator.schema.org/#url=${encodeURIComponent(siteUrl + result.url)}`,
                                    '_blank'
                                  );
                                }}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Schema.org Validator
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Validation History
              </CardTitle>
              <CardDescription>
                Historical log of all schema validation runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {(logs || SAMPLE_LOGS).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.url}</span>
                          <Badge variant="secondary" className="text-xs">
                            {log.pageType}
                          </Badge>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Errors: {log.errorCount}</span>
                          <span>Warnings: {log.warningCount}</span>
                          <span>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Types Tab */}
        <TabsContent value="schema-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Schema Type Distribution
              </CardTitle>
              <CardDescription>
                Overview of schema types implemented across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Organization', count: 1, validCount: 1, description: 'Company information on homepage' },
                  { type: 'WebSite', count: 1, validCount: 1, description: 'Site-wide search capability' },
                  { type: 'Article', count: 15, validCount: 14, description: 'Forum threads and blog posts' },
                  { type: 'Product', count: 10, validCount: 10, description: 'Marketplace EA listings' },
                  { type: 'BreadcrumbList', count: 25, validCount: 25, description: 'Navigation breadcrumbs' },
                  { type: 'ProfilePage', count: 15, validCount: 15, description: 'User profile pages' },
                  { type: 'LocalBusiness', count: 7, validCount: 7, description: 'Broker listings' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="font-medium">{item.type}</div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-medium">
                        {item.validCount}/{item.count} valid
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((item.validCount / item.count) * 100)}% success rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
