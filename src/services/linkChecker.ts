import fetch from 'node-fetch';
import {VerifiedLink} from '../types';
import {logWithTime} from '../utils';

class LinkChecker {
  private debug: number;
  private timeout: number;

  constructor(debug = 1, timeout = 10000) {
    this.debug = debug;
    this.timeout = timeout;
  }

  checkLinks = async (urls: string[]): Promise<VerifiedLink[]> => {
    const uniqueUrls = [...new Set(urls)];
    if (this.debug >= 1) {
      logWithTime(`🔗 Checking ${uniqueUrls.length} unique links...`);
    }

    const results = await Promise.all(
      uniqueUrls.map((url) => this.checkSingleLink(url))
    );

    const accessible = results.filter((r) => r.isAccessible).length;
    if (this.debug >= 1) {
      logWithTime(
        `✅ ${accessible}/${uniqueUrls.length} links are accessible`
      );
    }

    return results;
  };

  private checkSingleLink = async (url: string): Promise<VerifiedLink> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Try to get title from actual page content
        const title = await this.extractTitle(url);

        return {
          url,
          title: title || this.extractDomain(url),
          isAccessible: true,
          description: `HTTP ${response.status}`,
        };
      } else {
        return {
          url,
          title: this.extractDomain(url),
          isAccessible: false,
          description: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      if (this.debug >= 2) {
        logWithTime(`❌ Failed to check ${url}:`, error);
      }
      return {
        url,
        title: this.extractDomain(url),
        isAccessible: false,
        description:
          error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  private extractTitle = async (url: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : null;
    } catch {
      return null;
    }
  };

  private extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };
}

export {LinkChecker};
