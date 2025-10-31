"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  FileText,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SitemapLog {
  id: number;
  action: string;
  status: string;
  urlCount: number | null;
  submittedTo: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface SitemapStatus {
  lastGeneration: SitemapLog | null;
  lastError: SitemapLog | null;
  recentLogs: SitemapLog[];
}

export default function SitemapManagement() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch status with auto-refresh every 30 seconds
  const { data: status, isLoading } = useQuery<SitemapStatus>({
    queryKey: ['/api/admin/sitemap/status'],
    refetchInterval: 30000,
  });

  // Generate sitemap mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await apiRequest('POST', '/api/admin/sitemap/generate', {});
      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sitemap/status'] });
      toast({
        title: "Sitemap Generated Successfully!",
        description: `${data.urlCount} URLs added. Submitted to search engines.`,
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Failed to Generate Sitemap",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'generate':
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Generate</Badge>;
      case 'submit_google':
        return <Badge variant="outline"><Globe className="w-3 h-3 mr-1" />Google</Badge>;
      case 'submit_indexnow':
        return <Badge variant="outline"><Globe className="w-3 h-3 mr-1" />IndexNow</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sitemap Management</h1>
          <p className="text-muted-foreground">Automated sitemap generation and search engine submission</p>
        </div>
        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={isGenerating}
          size="lg"
          data-testid="button-generate-sitemap"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Now
            </>
          )}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-last-generation">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Generation</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.lastGeneration ? (
              <>
                <div className="text-2xl font-bold" data-testid="text-url-count">
                  {status.lastGeneration.urlCount} URLs
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(status.lastGeneration.createdAt), { addSuffix: true })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Never generated</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-automation-status">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Automation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Runs daily at 2:00 AM
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-sitemap-url">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sitemap URL</CardTitle>
          </CardHeader>
          <CardContent>
            <a 
              href="/sitemap.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              data-testid="link-sitemap-xml"
            >
              /sitemap.xml
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-xs text-muted-foreground mt-1">
              Public sitemap file
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {status?.lastError && (
        <Alert variant="destructive" data-testid="alert-last-error">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Last Error:</strong> {status.lastError.errorMessage}
            <br />
            <span className="text-xs">
              {formatDistanceToNow(new Date(status.lastError.createdAt), { addSuffix: true })}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 20 sitemap operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URLs</TableHead>
                <TableHead>Submitted To</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status?.recentLogs && status.recentLogs.length > 0 ? (
                status.recentLogs.map(log => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.urlCount || '-'}</TableCell>
                    <TableCell>{log.submittedTo || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.errorMessage ? (
                        <span className="text-red-600 truncate max-w-xs block">
                          {log.errorMessage}
                        </span>
                      ) : (
                        <span className="text-green-600">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No activity yet. Click "Generate Now" to create your first sitemap.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Configure your environment for optimal search engine submission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. IndexNow API Key (Bing & Yandex)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Generate an API key and set <code className="bg-muted px-1 py-0.5 rounded">INDEXNOW_API_KEY</code> environment variable.
            </p>
            <a 
              href="https://www.bing.com/indexnow/getstarted" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Get IndexNow Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Add Sitemap to robots.txt</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Add this line to your <code className="bg-muted px-1 py-0.5 rounded">/public/robots.txt</code>:
            </p>
            <code className="block bg-muted px-3 py-2 rounded text-sm">
              Sitemap: https://yoforex.net/sitemap.xml
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Verify in Search Console</h4>
            <p className="text-sm text-muted-foreground">
              Submit your sitemap manually in{' '}
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google Search Console
              </a>{' '}
              and{' '}
              <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Bing Webmaster Tools
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
