import path from 'path';
import fs from 'fs/promises';
import pc from 'picocolors';
import type { FrameworkType } from '../utils/frameworks';

export async function injectSDK(cwd: string, framework: FrameworkType, projectId: string) {
  let targetPath = '';
  const APP_BASE = 'https://build-in-live-mvp.vercel.app';
  
  if (framework === 'nextjs') {
    const possiblePaths = [
      path.join(cwd, 'app', 'layout.tsx'),
      path.join(cwd, 'src', 'app', 'layout.tsx')
    ];
    for (const p of possiblePaths) {
      try { await fs.access(p); targetPath = p; break; } catch { /* ignore */ }
    }
  } else if (framework === 'vitereact') {
    const possiblePaths = [
      path.join(cwd, 'index.html'),
      path.join(cwd, 'public', 'index.html')
    ];
    for (const p of possiblePaths) {
      try { await fs.access(p); targetPath = p; break; } catch { /* ignore */ }
    }
  }

  if (!targetPath) {
    console.log(pc.yellow(`⚠️ Could not find a suitable file (layout.tsx or index.html) to inject the SDK script.`));
    return false;
  }

  console.log(pc.gray(`Found entry file at: ${targetPath}`));
  
  try {
    const content = await fs.readFile(targetPath, 'utf-8');
    
    if (content.includes('build-in-live-mvp.vercel.app/sdk.js')) {
      console.log(pc.gray(`Build-In-Live SDK script is already injected.`));
      return true;
    }

    let updatedContent = '';
    if (targetPath.endsWith('.tsx') || targetPath.endsWith('.js')) {
      // JSX requires proper closing and no HTML comments
      const sdkScriptJsx = `\n                {/* Build-In-Live SDK */}\n                <script src="${APP_BASE}/sdk.js" data-project-id="${projectId}" async></script>\n`;
      if (content.includes('</body>')) {
        updatedContent = content.replace('</body>', `${sdkScriptJsx}            </body>`);
      } else {
        updatedContent = content + sdkScriptJsx;
      }
    } else {
      // HTML case (Vite)
      const sdkScriptHtml = `\n    <!-- Build-In-Live SDK -->\n    <script src="${APP_BASE}/sdk.js" data-project-id="${projectId}" async></script>\n`;
      if (content.includes('</body>')) {
        updatedContent = content.replace('</body>', `${sdkScriptHtml}</body>`);
      } else {
        updatedContent = content + sdkScriptHtml;
      }
    }

    await fs.writeFile(targetPath, updatedContent, 'utf-8');
    console.log(pc.green(`✅ Build-In-Live SDK script successfully injected into ${path.basename(targetPath)}!`));
    return true;
  } catch (err) {
    console.error(pc.red(`❌ Failed to inject SDK script:`), err);
    return false;
  }
}

