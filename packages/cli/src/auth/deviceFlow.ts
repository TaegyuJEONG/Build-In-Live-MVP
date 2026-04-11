import pc from 'picocolors';
import { writeConfig } from '../utils/config';

// Dynamically import `open` as it is an ESM module
const openBrowser = async (url: string) => {
  const { default: open } = await import('open');
  await open(url);
};

export async function loginWithDeviceFlow(): Promise<string> {
  console.log(pc.gray('Requesting device authorization code...'));

  // In a real implementation:
  // const res = await fetch(`${API_BASE}/oauth/device/code`, { method: 'POST' });
  // const data = await res.json();
  // We'll mock the response:
  const mockCodeResponse = {
    device_code: 'mock_device_code_12345',
    user_code: 'FD34-9A8B',
    verification_uri: 'https://buildinlive.com/activate',
    expires_in: 900,
    interval: 3 // We use 3 seconds for faster demonstration
  };

  console.log('\n' + pc.bold(pc.green('🔗 Please visit the following URL to authorize this device:')));
  console.log(pc.cyan(mockCodeResponse.verification_uri));
  console.log('\nAnd enter the code: ' + pc.bold(pc.bgYellow(pc.black(` ${mockCodeResponse.user_code} `))) + '\n');

  // Attempt to open the browser automatically
  try {
    await openBrowser(mockCodeResponse.verification_uri);
    console.log(pc.gray('(Your browser should have opened automatically)'));
  } catch (e) {
    // ignore
  }

  // Poll until authorized.
  console.log(pc.cyan('⏳ Waiting for authorization...'));

  // Mock polling logic that succeeds after a few seconds to simulate user action
  const token = await mockPolling(mockCodeResponse.interval);

  // Save token locally
  await writeConfig({ accessToken: token });
  console.log(pc.green('\n✅ Successfully logged in!'));

  return token;
}

// Mock function replacing the actual setInterval/fetch loop
function mockPolling(intervalSeconds: number): Promise<string> {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      process.stdout.write(pc.gray('.')); // Print dots to show it's polling
      // Simulate user approving after 2 polling attempts
      if (attempts >= 2) {
        clearInterval(interval);
        resolve('mock_access_token_abc123');
      }
    }, intervalSeconds * 1000); 
  });
}
