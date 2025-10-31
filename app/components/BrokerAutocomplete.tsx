"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";

interface Broker {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  isVerified: boolean;
  overallRating?: number;
  reviewCount: number;
}

interface BrokerAutocompleteProps {
  value: string;
  onSelect: (broker: Broker) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function BrokerAutocomplete({
  value,
  onSelect,
  placeholder = "Search for a broker...",
  label = "Broker",
  required = false,
}: BrokerAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce search by 300ms
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/brokers/search?q=${encodeURIComponent(query)}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('[BrokerAutocomplete] Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (broker: Broker) => {
    setSelectedBroker(broker);
    setQuery(broker.name);
    setIsOpen(false);
    onSelect(broker);
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && (
        <Label htmlFor="broker-search">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="broker-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedBroker(null);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          data-testid="input-broker-search"
          className="pr-10"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {selectedBroker && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute z-50 w-full max-h-80 overflow-y-auto p-2 shadow-lg">
          <div className="space-y-1">
            {results.map((broker) => (
              <button
                key={broker.id}
                type="button"
                onClick={() => handleSelect(broker)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                data-testid={`broker-option-${broker.slug}`}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={broker.logoUrl} alt={broker.name} />
                  <AvatarFallback>{broker.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{broker.name}</span>
                    {broker.isVerified && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {broker.websiteUrl && (
                    <p className="text-xs text-muted-foreground truncate">
                      {broker.websiteUrl}
                    </p>
                  )}
                  
                  {broker.overallRating && broker.reviewCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ⭐ {broker.overallRating}/100 ({broker.reviewCount} reviews)
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <Card className="absolute z-50 w-full p-4 shadow-lg text-center text-sm text-muted-foreground">
          No brokers found. Try a different search term.
        </Card>
      )}
    </div>
  );
}
