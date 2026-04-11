// Example implementation using Microlink API to take screenshots cheaply without heavy Puppeteer binaries
// This saves cost and perfectly avoids Vercel 50MB function limit.

export async function takeScreenshot(url: string, platform: 'desktop' | 'mobile' = 'desktop'): Promise<string | null> {
  console.log(`[Screenshot Bot] Triggering capture for ${url} (Platform: ${platform})`);
  
  try {
    const isMobile = platform === 'mobile';
    
    // Using Microlink's robust free tier (100 req/day for free)
    // Wait for network idle and capturing high-res
    const microlinkUrl = new URL('https://api.microlink.io/');
    microlinkUrl.searchParams.append('url', url);
    microlinkUrl.searchParams.append('screenshot', 'true');
    microlinkUrl.searchParams.append('meta', 'false');
    
    // Device emulation parameters
    if (isMobile) {
      microlinkUrl.searchParams.append('device', 'iPhone 13');
    } else {
      microlinkUrl.searchParams.append('viewport', '1920,1080');
    }

    const res = await fetch(microlinkUrl.toString());
    const data = await res.json();

    if (data.status === 'success' && data.data?.screenshot?.url) {
      console.log(`[Screenshot Bot] Captured successfully: ${data.data.screenshot.url}`);
      return data.data.screenshot.url;
    }

    throw new Error('Screenshot data missing from API response');
  } catch (error) {
    console.error('[Screenshot Bot] Failed to capture:', error);
    return null;
  }
}
