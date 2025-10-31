'use client';

import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, BookOpen, Lock } from "lucide-react";

export default function APIDocumentationClient() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/threads",
      description: "Get all forum threads with optional filters",
      public: true,
      params: ["limit", "categorySlug", "sort"]
    },
    {
      method: "GET",
      path: "/api/threads/:slug",
      description: "Get a single thread by slug",
      public: true,
      params: []
    },
    {
      method: "GET",
      path: "/api/categories",
      description: "Get all forum categories",
      public: true,
      params: []
    },
    {
      method: "GET",
      path: "/api/content",
      description: "Get marketplace content with filters",
      public: true,
      params: ["type", "platform", "limit"]
    },
    {
      method: "GET",
      path: "/api/stats",
      description: "Get platform statistics",
      public: true,
      params: []
    },
    {
      method: "GET",
      path: "/api/leaderboard",
      description: "Get top contributors leaderboard",
      public: true,
      params: []
    },
    {
      method: "POST",
      path: "/api/threads",
      description: "Create a new forum thread",
      public: false,
      params: []
    },
    {
      method: "POST",
      path: "/api/content",
      description: "Publish new marketplace content",
      public: false,
      params: []
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">API Documentation</CardTitle>
            </div>
            <CardDescription>
              Public API endpoints for accessing YoForex data. Authentication required for write operations.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="bg-muted px-3 py-2 rounded text-sm">
                https://yoforex.replit.dev
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Protected endpoints require authentication via session cookies. 
                Public endpoints can be accessed without authentication.
              </p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Available Endpoints</h2>

        <div className="space-y-4">
          {endpoints.map((endpoint, i) => (
            <Card key={i} data-testid={`card-endpoint-${i}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={endpoint.method === "GET" ? "default" : "secondary"}
                      className="font-mono"
                      data-testid="badge-method"
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm" data-testid="text-path">
                      {endpoint.path}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    {endpoint.public ? (
                      <Badge variant="outline" className="text-chart-3" data-testid="badge-public">
                        <Code className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-chart-4" data-testid="badge-protected">
                        <Lock className="w-3 h-3 mr-1" />
                        Protected
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-2" data-testid="text-description">
                  {endpoint.description}
                </CardDescription>
              </CardHeader>
              
              {endpoint.params.length > 0 && (
                <CardContent>
                  <p className="text-sm font-semibold mb-2">Query Parameters:</p>
                  <div className="flex flex-wrap gap-2">
                    {endpoint.params.map((param, j) => (
                      <code key={j} className="bg-muted px-2 py-1 rounded text-xs">
                        {param}
                      </code>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• General API: 100 requests per 15 minutes</li>
              <li>• Write Operations: 30 requests per 15 minutes</li>
              <li>• Content Creation: 5 posts per hour</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
