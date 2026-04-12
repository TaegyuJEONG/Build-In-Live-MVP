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
    // 3. Initiate Device Flow OAuth
    const token = await (0, deviceFlow_1.loginWithDeviceFlow)();
    // 4. Project Info Gathering (AI vs Manual)
    const { projectUrl } = await (0, prompts_1.default)({
        type: 'text',
        name: 'projectUrl',
        message: 'Your deployed project URL (e.g. https://myapp.vercel.app):',
        validate: (v) => v.startsWith('http') ? true : 'Please enter a valid URL starting with http',
    });
    const infoChoice = await (0, prompts_1.default)({
        type: 'select',
        name: 'method',
        message: 'How would you like to set up your project details?',
        choices: [
            { title: '🤖 Auto-generate from README (Recommended)', value: 'auto' },
            { title: '✍️  Enter manually', value: 'manual' }
        ]
    });
    let projectPayload = { url: projectUrl };
    if (infoChoice.method === 'manual') {
        const manualData = await (0, prompts_1.default)([
            {
                type: 'text',
                name: 'name',
                message: 'Project Name:',
            },
            {
                type: 'text',
                name: 'about',
                message: 'Short Description (1-2 sentences):',
            },
            {
                type: 'text',
                name: 'techStacks',
                message: 'Tech Stack (comma separated, e.g. React, Next.js, Node):',
            }
        ]);
        projectPayload = {
            ...projectPayload,
            name: manualData.name,
            about: manualData.about,
            techStacks: manualData.techStacks.split(',').map((s) => s.trim()),
            categories: [],
            platforms: ['web'],
            targetAudience: [],
            useCases: [],
        };
    }
    else if (infoChoice.method === 'auto') {
        console.log(picocolors_1.default.gray('Reading local README.md...'));
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const readmeContent = await fs.readFile(path.join(cwd, 'README.md'), 'utf-8');
            projectPayload = { ...projectPayload, readmeText: readmeContent };
            console.log(picocolors_1.default.green('✔ README loaded successfully.'));
        }
        catch (err) {
            console.log(picocolors_1.default.yellow('⚠️ No README.md found in the root directory. Falling back to empty data.'));
            projectPayload = { ...projectPayload, readmeText: '' };
        }
    }
    // 5. Send data to Build-In-Live Backend
    const APP_BASE = 'https://build-in-live-mvp.vercel.app';
    let projectId = '';
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
        console.log(picocolors_1.default.green('✔ Sync complete!'));
    }
    catch (err) {
        console.error(picocolors_1.default.red('❌ Failed to sync project data to backend.'), err);
    }
    // 6. Inject SDK via AST Parsing
    if (frameworkType !== 'unknown') {
        console.log(picocolors_1.default.cyan('\n📦 Starting SDK Code Injection...'));
        await (0, injectSDK_1.injectSDK)(cwd, frameworkType);
    }
    else {
        console.log(picocolors_1.default.yellow('\n⚠️  Could not automatically inject the SDK. Please add it manually:'));
        console.log(picocolors_1.default.yellow('import { LiveFeedbackSDK } from "@build-in-live/sdk";\n// Place inside your root component:\n<LiveFeedbackSDK />'));
    }
    // 7. Done — show project links
    console.log(picocolors_1.default.bold(picocolors_1.default.green('\n✨ All done! Your project is live on Build-In-Live.\n')));
    if (projectId) {
        const projectUrl = `${APP_BASE}/project/${projectId}`;
        const feedbackUrl = `${APP_BASE}/feedback/${projectId}`;
        console.log(picocolors_1.default.white('  📋 Review your project page:'));
        console.log(picocolors_1.default.cyan(`     ${projectUrl}\n`));
        console.log(picocolors_1.default.white('  🔗 Share this link to collect feedback:'));
        console.log(picocolors_1.default.cyan(`     ${feedbackUrl}\n`));
        console.log(picocolors_1.default.gray('  Open the project page to verify your details and start inviting collaborators.'));
    }
});
program.parse(process.argv);
