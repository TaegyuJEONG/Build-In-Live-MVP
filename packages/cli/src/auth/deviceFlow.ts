import pc from 'picocolors';
import { writeConfig } from '../utils/config';

const API_BASE = 'https://build-in-live-mvp.vercel.app';

const openBrowser = async (url: string) => {
  const { default: open } = await import('open');
  await open(url);
};

export async function loginWithDeviceFlow(): Promise<string> {
  console.log(pc.gray('Requesting device authorization code...'));

  // 1. Get a real device code from our server
  const codeRes = await fetch(`${API_BASE}/api/auth/device/code`, { method: 'POST' });
  if (!codeRes.ok) {
    throw new Error('Failed to request device authorization code. Is the server reachable?');
  }
  const codeData = await codeRes.json();

  const { device_code, user_code, verification_uri_complete, interval } = codeData;

  console.log('\n' + pc.bold(pc.green('🔗 Please visit the following URL to authorize this device:')));
  console.log(pc.cyan(verification_uri_complete));
  console.log('\nAnd enter the code: ' + pc.bold(pc.bgYellow(pc.black(` ${user_code} `))) + '\n');
  console.log(pc.gray('(The code is pre-filled in the URL above — just hit Authorize!)'));

  // Open browser automatically
  try {
    await openBrowser(verification_uri_complete);
    console.log(pc.gray('(Your browser should have opened automatically)'));
  } catch (e) {
    // ignore if browser can't open
  }

  // 2. Poll server until approved or expired
  console.log(pc.cyan('⏳ Waiting for authorization...'));
  const token = await pollForToken(device_code, interval || 5);

  // 3. Save token locally
  await writeConfig({ accessToken: token });
  console.log(pc.green('\n✅ Successfully logged in!'));

  return token;
}

function pollForToken(deviceCode: string, intervalSeconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const maxAttempts = Math.floor(900 / intervalSeconds); // 15 minutes
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      process.stdout.write(pc.gray('.'));

      if (attempts > maxAttempts) {
        clearInterval(interval);
        reject(new Error('Authorization timed out. Please run `build-in-live-cli init` again.'));
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/device/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: deviceCode }),
        });

        if (res.status === 202) return; // Still pending, keep polling
        
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'approved' && data.access_token) {
            clearInterval(interval);
            resolve(data.access_token);
          }
        } else if (res.status === 410) {
          clearInterval(interval);
          reject(new Error('Code expired. Please run `build-in-live-cli init` again.'));
        }
      } catch (err) {
        // Network error — keep trying
      }
    }, intervalSeconds * 1000);
  });
}
