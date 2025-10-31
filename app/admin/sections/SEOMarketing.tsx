"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, ExternalLink, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContentItem {
  id: number;
  title: string;
  type: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  performance?: number;
}

interface CampaignStats {
  reach: number;
  conversions: number;
  roi: number;
}

interface SearchRanking {
  id: number;
  page: string;
  keyword: string;
  position: number;
  change: number;
}

interface TopQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface SitemapStatus {
  lastGenerated?: string;
  totalUrls: number;
  sitemapUrl?: string;
}

export default function SEOMarketing() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMetaOpen, setIsEditMetaOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);

  const { data: contentListRaw, isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/admin/seo/content", searchQuery]
  });

  const contentList: ContentItem[] = Array.isArray(contentListRaw) ? contentListRaw : [];

  const { data: campaignsRaw, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/seo/campaigns"]
  });

  const campaigns: Campaign[] = Array.isArray(campaignsRaw) ? campaignsRaw : [];

  const { data: campaignStatsRaw, isLoading: campaignStatsLoading } = useQuery<CampaignStats>({
    queryKey: ["/api/admin/seo/campaign-stats"]
  });

  const campaignStats: CampaignStats = campaignStatsRaw || {
    reach: 0,
    conversions: 0,
    roi: 0
  };

  const { data: searchRankingsRaw, isLoading: rankingsLoading } = useQuery<SearchRanking[]>({
    queryKey: ["/api/admin/seo/search-rankings"]
  });

  const searchRankings: SearchRanking[] = Array.isArray(searchRankingsRaw) ? searchRankingsRaw : [];

  const { data: topQueriesRaw, isLoading: queriesLoading } = useQuery<TopQuery[]>({
    queryKey: ["/api/admin/seo/top-queries"]
  });

  const topQueries: TopQuery[] = Array.isArray(topQueriesRaw) ? topQueriesRaw : [];

  const { data: sitemapStatusRaw, isLoading: sitemapLoading } = useQuery<SitemapStatus>({
    queryKey: ["/api/admin/seo/sitemap-status"]
  });

  const sitemapStatus: SitemapStatus = sitemapStatusRaw || {
    totalUrls: 0
  };

  const updateMetaMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/seo/meta/${data.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/content"] });
      toast({ title: "Meta tags updated successfully" });
      setIsEditMetaOpen(false);
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/seo/campaigns", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/campaign-stats"] });
      toast({ title: "Campaign created successfully" });
      setIsCreateCampaignOpen(false);
    }
  });

  const generateSitemapMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/seo/sitemap/generate", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/sitemap-status"] });
      toast({ title: "Sitemap generated successfully" });
    }
  });

  const handleUpdateMeta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMetaMutation.mutate({
      id: selectedContent.id,
      title: formData.get("title"),
      description: formData.get("description"),
      keywords: formData.get("keywords")
    });
  };

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCampaignMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      budget: parseFloat(formData.get("budget") as string)
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">SEO & Marketing</h1>

      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta" data-testid="tab-meta">Meta Tags</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-seo-analytics">SEO Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Meta Tags Management</h2>
            <div className="relative w-full md:w-auto md:min-w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-content"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {contentLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Meta Title</TableHead>
                        <TableHead>Meta Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentList.map((content) => (
                        <TableRow key={content.id} data-testid={`content-${content.id}`}>
                          <TableCell className="font-medium max-w-xs truncate" data-testid={`content-title-${content.id}`}>
                            {content.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{content.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{content.metaTitle || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{content.metaDescription || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContent(content);
                                setIsEditMetaOpen(true);
                              }}
                              data-testid={`button-edit-meta-${content.id}`}
                            >
                              Edit Meta
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {contentList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No content found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isEditMetaOpen} onOpenChange={setIsEditMetaOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Meta Tags</DialogTitle>
              </DialogHeader>
              {selectedContent && (
                <form onSubmit={handleUpdateMeta} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meta Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={selectedContent.metaTitle}
                      maxLength={60}
                      data-testid="input-meta-title"
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 50-60 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Meta Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={selectedContent.metaDescription}
                      maxLength={160}
                      rows={3}
                      data-testid="textarea-meta-description"
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 150-160 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      name="keywords"
                      defaultValue={selectedContent.metaKeywords}
                      data-testid="input-meta-keywords"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Search Result Preview</h4>
                    <div className="space-y-1">
                      <div className="text-sm text-blue-600 hover:underline cursor-pointer">
                        {selectedContent.metaTitle || selectedContent.title}
                      </div>
                      <div className="text-xs text-green-700">https://yoforex.com/...</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedContent.metaDescription || 'No description provided'}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={updateMetaMutation.isPending} data-testid="button-save-meta">
                      {updateMetaMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Marketing Campaigns</h2>
            <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-campaign">Create Campaign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Marketing Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="camp-name">Campaign Name</Label>
                    <Input id="camp-name" name="name" required data-testid="input-campaign-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="camp-description">Description</Label>
                    <Textarea id="camp-description" name="description" required data-testid="textarea-campaign-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required data-testid="input-campaign-start" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" name="endDate" type="date" required data-testid="input-campaign-end" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input id="budget" name="budget" type="number" step="0.01" required data-testid="input-campaign-budget" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign">
                      {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaignStatsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card data-testid="card-campaign-reach">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-campaign-reach">
                      {campaignStats.reach.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-campaign-conversions">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-campaign-conversions">
                      {campaignStats.conversions}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-campaign-roi">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-campaign-roi">
                      {campaignStats.roi}%
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {campaignsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id} data-testid={`campaign-${campaign.id}`}>
                          <TableCell className="font-medium" data-testid={`campaign-name-${campaign.id}`}>
                            {campaign.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(campaign.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(campaign.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{campaign.performance || 0}% CTR</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {campaigns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No campaigns created
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">SEO Analytics</h2>

          <Card>
            <CardHeader>
              <CardTitle>Search Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {rankingsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchRankings.map((ranking) => (
                        <TableRow key={ranking.id}>
                          <TableCell className="max-w-xs truncate">{ranking.page}</TableCell>
                          <TableCell>{ranking.keyword}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">#{ranking.position}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={(ranking.change ?? 0) > 0 ? 'default' : 'destructive'}>
                              {(ranking.change ?? 0) > 0 ? '+' : ''}{ranking.change ?? 0}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {searchRankings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No ranking data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {queriesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead>Impressions</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>CTR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topQueries.map((query, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{query.query}</TableCell>
                          <TableCell>{query.impressions.toLocaleString()}</TableCell>
                          <TableCell>{query.clicks.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{query.ctr}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {topQueries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No query data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Sitemap Status</CardTitle>
              <Button
                onClick={() => generateSitemapMutation.mutate()}
                disabled={generateSitemapMutation.isPending}
                data-testid="button-generate-sitemap"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Sitemap
              </Button>
            </CardHeader>
            <CardContent>
              {sitemapLoading ? (
                <Skeleton className="h-20" />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Generated:</span>
                    <span className="font-medium">
                      {sitemapStatus.lastGenerated 
                        ? formatDistanceToNow(new Date(sitemapStatus.lastGenerated), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total URLs:</span>
                    <Badge variant="secondary">{sitemapStatus.totalUrls}</Badge>
                  </div>
                  {sitemapStatus.sitemapUrl && (
                    <div className="flex items-center gap-2 pt-2">
                      <a
                        href={sitemapStatus.sitemapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View Sitemap <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
