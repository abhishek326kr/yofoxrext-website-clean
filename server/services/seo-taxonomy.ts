// SEO Issue Taxonomy - Complete classification of all detectable SEO issues

export interface SeoIssueDefinition {
  type: string;
  category: 'technical' | 'content' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
  description: string;
  checkFunction: string;
}

export const SEO_ISSUE_TAXONOMY: Record<string, SeoIssueDefinition> = {
  // TECHNICAL SEO ISSUES
  missing_canonical: {
    type: 'missing_canonical',
    category: 'technical',
    severity: 'critical',
    autoFixable: true,
    description: 'Missing canonical URL - can cause duplicate content issues',
    checkFunction: 'checkCanonical',
  },
  broken_internal_link: {
    type: 'broken_internal_link',
    category: 'technical',
    severity: 'critical',
    autoFixable: true,
    description: 'Broken internal link returns 404 error',
    checkFunction: 'checkInternalLinks',
  },
  missing_robots_txt: {
    type: 'missing_robots_txt',
    category: 'technical',
    severity: 'critical',
    autoFixable: true,
    description: 'Missing robots.txt file',
    checkFunction: 'checkRobotsTxt',
  },
  sitemap_error: {
    type: 'sitemap_error',
    category: 'technical',
    severity: 'high',
    autoFixable: true,
    description: 'XML sitemap has validation errors',
    checkFunction: 'checkSitemap',
  },
  missing_structured_data: {
    type: 'missing_structured_data',
    category: 'technical',
    severity: 'high',
    autoFixable: true,
    description: 'Missing Schema.org structured data (JSON-LD)',
    checkFunction: 'checkStructuredData',
  },
  duplicate_page: {
    type: 'duplicate_page',
    category: 'technical',
    severity: 'high',
    autoFixable: false,
    description: 'Duplicate content detected - needs editorial review',
    checkFunction: 'checkDuplicates',
  },
  http_status_error: {
    type: 'http_status_error',
    category: 'technical',
    severity: 'critical',
    autoFixable: false,
    description: 'Page returns non-200 HTTP status code',
    checkFunction: 'checkStatusCodes',
  },
  redirect_chain: {
    type: 'redirect_chain',
    category: 'technical',
    severity: 'medium',
    autoFixable: true,
    description: 'Multiple redirects detected (>2 hops)',
    checkFunction: 'checkRedirects',
  },
  mixed_content: {
    type: 'mixed_content',
    category: 'technical',
    severity: 'high',
    autoFixable: true,
    description: 'HTTP resources loaded on HTTPS page',
    checkFunction: 'checkMixedContent',
  },

  // CONTENT SEO ISSUES
  missing_meta_description: {
    type: 'missing_meta_description',
    category: 'content',
    severity: 'high',
    autoFixable: true,
    description: 'Missing meta description tag',
    checkFunction: 'checkMetaDescription',
  },
  missing_title: {
    type: 'missing_title',
    category: 'content',
    severity: 'critical',
    autoFixable: true,
    description: 'Missing or empty title tag',
    checkFunction: 'checkTitle',
  },
  duplicate_title: {
    type: 'duplicate_title',
    category: 'content',
    severity: 'medium',
    autoFixable: true,
    description: 'Title tag is duplicated across multiple pages',
    checkFunction: 'checkDuplicateTitles',
  },
  missing_image_alt: {
    type: 'missing_image_alt',
    category: 'content',
    severity: 'high',
    autoFixable: true,
    description: 'Images missing alt text',
    checkFunction: 'checkImageAlt',
  },
  multiple_h1: {
    type: 'multiple_h1',
    category: 'content',
    severity: 'medium',
    autoFixable: false,
    description: 'Multiple H1 tags detected (should have only one)',
    checkFunction: 'checkH1Tags',
  },
  missing_h1: {
    type: 'missing_h1',
    category: 'content',
    severity: 'high',
    autoFixable: false,
    description: 'Page is missing H1 tag',
    checkFunction: 'checkH1Tags',
  },
  thin_content: {
    type: 'thin_content',
    category: 'content',
    severity: 'medium',
    autoFixable: false,
    description: 'Page has less than 300 words of content',
    checkFunction: 'checkContentLength',
  },
  duplicate_meta_description: {
    type: 'duplicate_meta_description',
    category: 'content',
    severity: 'medium',
    autoFixable: true,
    description: 'Meta description is duplicated across multiple pages',
    checkFunction: 'checkDuplicateMetaDescriptions',
  },

  // PERFORMANCE SEO ISSUES
  poor_lcp: {
    type: 'poor_lcp',
    category: 'performance',
    severity: 'critical',
    autoFixable: false,
    description: 'Largest Contentful Paint > 2.5s (Core Web Vital)',
    checkFunction: 'checkCoreWebVitals',
  },
  slow_page_load: {
    type: 'slow_page_load',
    category: 'performance',
    severity: 'high',
    autoFixable: false,
    description: 'Page load time exceeds 3 seconds',
    checkFunction: 'checkPageSpeed',
  },
  large_image: {
    type: 'large_image',
    category: 'performance',
    severity: 'high',
    autoFixable: true,
    description: 'Image file size exceeds 500KB',
    checkFunction: 'checkImageSizes',
  },
  missing_image_dimensions: {
    type: 'missing_image_dimensions',
    category: 'performance',
    severity: 'medium',
    autoFixable: true,
    description: 'Images missing width/height attributes',
    checkFunction: 'checkImageDimensions',
  },
  no_mobile_viewport: {
    type: 'no_mobile_viewport',
    category: 'performance',
    severity: 'critical',
    autoFixable: true,
    description: 'Missing mobile viewport meta tag',
    checkFunction: 'checkMobileViewport',
  },
  render_blocking_resources: {
    type: 'render_blocking_resources',
    category: 'performance',
    severity: 'medium',
    autoFixable: false,
    description: 'Render-blocking CSS/JS resources detected',
    checkFunction: 'checkRenderBlocking',
  },
};

// Helper functions to get issues by category or severity
export function getIssuesByCategory(category: 'technical' | 'content' | 'performance'): SeoIssueDefinition[] {
  return Object.values(SEO_ISSUE_TAXONOMY).filter(issue => issue.category === category);
}

export function getAutoFixableIssues(): SeoIssueDefinition[] {
  return Object.values(SEO_ISSUE_TAXONOMY).filter(issue => issue.autoFixable);
}

export function getIssueDefinition(type: string): SeoIssueDefinition | undefined {
  return SEO_ISSUE_TAXONOMY[type];
}

export function getIssuesBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): SeoIssueDefinition[] {
  return Object.values(SEO_ISSUE_TAXONOMY).filter(issue => issue.severity === severity);
}
