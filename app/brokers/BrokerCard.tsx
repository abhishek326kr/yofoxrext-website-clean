import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';

type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number | null;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
};

interface BrokerCardProps {
  broker: Broker;
}

export function BrokerCard({ broker }: BrokerCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-broker-${broker.slug}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              {broker.logoUrl ? (
                <img 
                  src={broker.logoUrl} 
                  alt={broker.name} 
                  className="w-full h-full object-cover rounded-md" 
                />
              ) : (
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/brokers/${broker.slug}`}>
                  <h3 
                    className="text-xl font-semibold hover:text-primary cursor-pointer" 
                    data-testid={`text-broker-name-${broker.slug}`}
                  >
                    {broker.name}
                  </h3>
                </Link>
                {broker.isVerified && (
                  <Badge 
                    variant="default" 
                    className="flex items-center gap-1" 
                    data-testid={`badge-verified-${broker.slug}`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {broker.scamReportCount > 10 && (
                  <Badge 
                    variant="destructive" 
                    className="flex items-center gap-1" 
                    data-testid={`badge-scam-alert-${broker.slug}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    High Scam Reports
                  </Badge>
                )}
              </div>
              
              <p 
                className="text-sm text-muted-foreground mb-3" 
                data-testid={`text-regulation-${broker.slug}`}
              >
                {broker.regulationSummary || 'No regulation information available'}
              </p>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div data-testid={`rating-stars-${broker.slug}`}>
                  {broker.overallRating ? (
                    <StarRating rating={broker.overallRating} />
                  ) : (
                    <span className="text-sm text-muted-foreground">No ratings</span>
                  )}
                </div>
                <span 
                  className="text-sm text-muted-foreground" 
                  data-testid={`text-review-count-${broker.slug}`}
                >
                  {broker.reviewCount} reviews
                </span>
                {broker.scamReportCount > 0 && (
                  <span 
                    className="text-sm text-destructive" 
                    data-testid={`text-scam-count-${broker.slug}`}
                  >
                    {broker.scamReportCount} scam reports
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
