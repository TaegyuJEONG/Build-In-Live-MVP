"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectSDK = injectSDK;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const picocolors_1 = __importDefault(require("picocolors"));
async function injectSDK(cwd, framework, projectId) {
    let targetPath = '';
    const APP_BASE = 'https://build-in-live-mvp.vercel.app';
    if (framework === 'nextjs') {
        const possiblePaths = [
            path_1.default.join(cwd, 'app', 'layout.tsx'),
            path_1.default.join(cwd, 'src', 'app', 'layout.tsx')
        ];
        for (const p of possiblePaths) {
            try {
                await promises_1.default.access(p);
                targetPath = p;
                break;
            }
            catch { /* ignore */ }
        }
    }
    else if (framework === 'vitereact') {
        const possiblePaths = [
            path_1.default.join(cwd, 'index.html'),
            path_1.default.join(cwd, 'public', 'index.html')
        ];
        for (const p of possiblePaths) {
            try {
                await promises_1.default.access(p);
                targetPath = p;
                break;
            }
            catch { /* ignore */ }
        }
    }
    if (!targetPath) {
        console.log(picocolors_1.default.yellow(`⚠️ Could not find a suitable file (layout.tsx or index.html) to inject the SDK script.`));
        return false;
    }
    console.log(picocolors_1.default.gray(`Found entry file at: ${targetPath}`));
    try {
        const content = await promises_1.default.readFile(targetPath, 'utf-8');
        if (content.includes('build-in-live-mvp.vercel.app/sdk.js')) {
            console.log(picocolors_1.default.gray(`Build-In-Live SDK script is already injected.`));
            return true;
        }
        let updatedContent = '';
        if (targetPath.endsWith('.tsx') || targetPath.endsWith('.js')) {
            // JSX requires proper closing and no HTML comments
            const sdkScriptJsx = `\n                {/* Build-In-Live SDK */}\n                <script src="${APP_BASE}/sdk.js" data-project-id="${projectId}" async></script>\n`;
            if (content.includes('</body>')) {
                updatedContent = content.replace('</body>', `${sdkScriptJsx}            </body>`);
            }
            else {
                updatedContent = content + sdkScriptJsx;
            }
        }
        else {
            // HTML case (Vite)
            const sdkScriptHtml = `\n    <!-- Build-In-Live SDK -->\n    <script src="${APP_BASE}/sdk.js" data-project-id="${projectId}" async></script>\n`;
            if (content.includes('</body>')) {
                updatedContent = content.replace('</body>', `${sdkScriptHtml}</body>`);
            }
            else {
                updatedContent = content + sdkScriptHtml;
            }
        }
        await promises_1.default.writeFile(targetPath, updatedContent, 'utf-8');
        console.log(picocolors_1.default.green(`✅ Build-In-Live SDK script successfully injected into ${path_1.default.basename(targetPath)}!`));
        return true;
    }
    catch (err) {
        console.error(picocolors_1.default.red(`❌ Failed to inject SDK script:`), err);
        return false;
    }
}
