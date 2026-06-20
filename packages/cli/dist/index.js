#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const prompts_1 = __importDefault(require("prompts"));
const picocolors_1 = __importDefault(require("picocolors"));
const frameworks_1 = require("./utils/frameworks");
const deviceFlow_1 = require("./auth/deviceFlow");
const injectSDK_1 = require("./ast/injectSDK");
const program = new commander_1.Command();
program
    .name('build-in-public')
    .description('CLI to automate Build-In-Live connection and SDK injection')
    .version('0.1.0');
program
    .command('init')
    .description('Initialize Build-In-Live for the current project')
    .action(async () => {
    console.log(picocolors_1.default.bold(picocolors_1.default.cyan('🚀 Welcome to Build-In-Live CLI!')));
    console.log(picocolors_1.default.gray('Scanning your project layout...'));
    const cwd = process.cwd();
    // 1. Framework detection
    const frameworkType = await (0, frameworks_1.detectFramework)(cwd);
    if (frameworkType === 'nextjs') {
        console.log(picocolors_1.default.green('✅ Next.js App Router detected.'));
    }
    else if (frameworkType === 'vitereact') {
        console.log(picocolors_1.default.green('✅ Vite React detected.'));
    }
    else {
        console.log(picocolors_1.default.yellow('⚠️ Unknown or unsupported framework detected. Proceeding in Manual Mode.'));
    }
    // 2. Prompt for user confirmation
    const response = await (0, prompts_1.default)({
        type: 'confirm',
        name: 'proceed',
        message: 'Do you want to proceed with setting up Build-In-Live and injecting the SDK?',
        initial: true
    });
    if (!response.proceed) {
        console.log(picocolors_1.default.yellow('Initialization aborted by user.'));
        process.exit(0);
    }
    // 3. Initiate Device Flow OAuth (Verify if already logged in)
    const { readConfig } = await Promise.resolve().then(() => __importStar(require('./utils/config')));
    const config = await readConfig();
    let token = config.accessToken;
    const APP_BASE = 'https://build-in-live-mvp.vercel.app';
    if (token) {
        console.log(picocolors_1.default.gray('Verifying authentication...'));
        try {
            const res = await fetch(`${APP_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const userInfo = await res.json();
                console.log(picocolors_1.default.green(`✅ Authenticated as ${picocolors_1.default.bold(userInfo.name)} (${userInfo.email})`));
            }
            else {
                console.log(picocolors_1.default.yellow('⚠️  Session expired or invalid. Please log in again.'));
                token = '';
            }
        }
        catch (err) {
            console.log(picocolors_1.default.yellow('⚠️  Connection error during authentication.'));
            token = '';
        }
    }
    if (!token) {
        token = await (0, deviceFlow_1.loginWithDeviceFlow)();
    }
    // 4. Project Info Gathering
    const { projectUrl, demoVideo } = await (0, prompts_1.default)([
        {
            type: 'text',
            name: 'projectUrl',
            message: 'Your deployed project URL (e.g. https://myapp.vercel.app):',
            validate: (v) => v.startsWith('http') ? true : 'Please enter a valid URL starting with http',
        },
        {
            type: 'text',
            name: 'demoVideo',
            message: 'Optional: Your product demo video URL (Press Enter to skip):',
        }
    ]);
    let projectPayload = {
        url: projectUrl,
        demoVideo: demoVideo
    };
    console.log(picocolors_1.default.gray('Reading local README.md for auto-generation...'));
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const readmeContent = await fs.readFile(path.join(cwd, 'README.md'), 'utf-8');
        projectPayload = { ...projectPayload, readmeText: readmeContent };
        console.log(picocolors_1.default.green('✔ README loaded successfully. Auto-generating project details via AI...'));
    }
    catch (err) {
        console.log(picocolors_1.default.yellow('⚠️ No README.md found in the root directory. Proceeding with empty data.'));
        projectPayload = { ...projectPayload, readmeText: '' };
    }
    // 5. Send data to Build-In-Live Backend
    let projectId = '';
    let userId = '';
    console.log(picocolors_1.default.cyan('\n📡 Syncing project with Build-In-Live...'));
    try {
        const res = await fetch(`${APP_BASE}/api/project/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(projectPayload)
        });
        if (!res.ok)
            throw new Error('API Sync Failed');
        const syncData = await res.json();
        projectId = syncData.projectId || '';
        userId = syncData.userId || '';
        console.log(picocolors_1.default.green('✔ Sync complete!'));
    }
    catch (err) {
        console.error(picocolors_1.default.red('❌ Failed to sync project data to backend.'), err);
    }
    // 6. Inject SDK via AST Parsing
    if (frameworkType !== 'unknown' && projectId) {
        console.log(picocolors_1.default.cyan('\n📦 Starting SDK Code Injection...'));
        await (0, injectSDK_1.injectSDK)(cwd, frameworkType, projectId);
    }
    else {
        console.log(picocolors_1.default.yellow('\n⚠️  Could not automatically inject the SDK. Please add it manually:'));
        console.log(picocolors_1.default.yellow('Insert: <script src="https://build-in-live-mvp.vercel.app/sdk.js" data-project-id="' + projectId + '" async></script> before </body>'));
    }
    // 7. Success Guidance
    console.log(picocolors_1.default.bold(picocolors_1.default.green('\n✨ Project Successfully Linked to Build-In-Live!')));
    console.log(picocolors_1.default.white('\n  ──────────────────────────────────────────────────────────────────'));
    console.log(picocolors_1.default.bold(picocolors_1.default.white('  1. 🚀 DEPLOY YOUR PROJECT')));
    console.log(picocolors_1.default.gray('     The SDK is now in your code. You MUST deploy your project to'));
    console.log(picocolors_1.default.gray('     Vercel (or your hosting provider) for changes to take effect.'));
    if (projectId) {
        const verifyUrl = `${APP_BASE}/onboarding?projectId=${projectId}&step=4`;
        const deskUrl = userId ? `${APP_BASE}/desk/${userId}?projectId=${projectId}` : `${APP_BASE}/dashboard`;
        const feedbackUrl = `${APP_BASE}/feedback/${projectId}`;
        console.log(picocolors_1.default.bold(picocolors_1.default.white('\n  2. ✅ VERIFY SDK CONNECTION')));
        console.log(picocolors_1.default.gray('     Once deployed, visit this link to verify your integration:'));
        console.log(picocolors_1.default.cyan(`     ${verifyUrl}`));
        console.log(picocolors_1.default.bold(picocolors_1.default.white('\n  3. 🔗 SHARE & COLLECT FEEDBACK')));
        console.log(picocolors_1.default.gray('     After verification, share this link with your testers:'));
        console.log(picocolors_1.default.cyan(`     ${feedbackUrl}`));
        console.log(picocolors_1.default.white('\n  📋 Manage your project at:'));
        console.log(picocolors_1.default.cyan(`     ${deskUrl}`));
    }
    console.log(picocolors_1.default.white('  ──────────────────────────────────────────────────────────────────\n'));
});
program
    .command('logout')
    .description('Log out from Build-In-Live')
    .action(async () => {
    const { writeConfig } = await Promise.resolve().then(() => __importStar(require('./utils/config')));
    await writeConfig({ accessToken: undefined });
    console.log(picocolors_1.default.green('✅ Successfully logged out.'));
});
program.parse(process.argv);
