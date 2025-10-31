/**
 * Broker Logo Service
 * Fetches broker logos from various free APIs
 */

export interface LogoFetchResult {
  logoUrl: string | null;
  source: 'clearbit' | 'google' | 'none';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return null;
  }
}

/**
 * Fetch broker logo using Clearbit API (free, no API key required)
 * Returns high-quality logos for most major companies
 */
export async function fetchLogoFromClearbit(websiteUrl: string): Promise<string | null> {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;

  try {
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    
    // Test if the logo exists by making a HEAD request
    const response = await fetch(logoUrl, { method: 'HEAD' });
    
    if (response.ok) {
      return logoUrl;
    }
    return null;
  } catch (error) {
    console.error('[BrokerLogoService] Clearbit fetch error:', error);
    return null;
  }
}

/**
 * Fetch broker logo using Google S2 Favicon API (fallback)
 * Always returns something, but quality varies
 */
export function getGoogleFaviconUrl(websiteUrl: string, size: number = 128): string | null {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;

  return `https://www.google.com/s2/favicons?sz=${size}&domain=${domain}`;
}

/**
 * Auto-fetch broker logo from multiple sources
 * Tries Clearbit first (higher quality), falls back to Google favicon
 */
export async function fetchBrokerLogo(websiteUrl: string): Promise<LogoFetchResult> {
  if (!websiteUrl) {
    return { logoUrl: null, source: 'none' };
  }

  // Try Clearbit first (higher quality)
  const clearbitLogo = await fetchLogoFromClearbit(websiteUrl);
  if (clearbitLogo) {
    return { logoUrl: clearbitLogo, source: 'clearbit' };
  }

  // Fallback to Google favicon
  const googleLogo = getGoogleFaviconUrl(websiteUrl);
  if (googleLogo) {
    return { logoUrl: googleLogo, source: 'google' };
  }

  return { logoUrl: null, source: 'none' };
}

/**
 * Generate a placeholder logo URL based on broker name
 * Uses UI Avatars as a fallback when no logo is available
 */
export function getPlaceholderLogo(brokerName: string): string {
  const initial = brokerName.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(brokerName)}&background=0D8ABC&color=fff&size=128&bold=true`;
}
