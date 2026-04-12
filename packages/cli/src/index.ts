#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';
import pc from 'picocolors';
import { detectFramework, FrameworkType } from './utils/frameworks';
import { loginWithDeviceFlow } from './auth/deviceFlow';
import { injectSDK } from './ast/injectSDK';

const program = new Command();

program
  .name('build-in-public')
  .description('CLI to automate Build-In-Live connection and SDK injection')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Build-In-Live for the current project')
  .action(async () => {
    console.log(pc.bold(pc.cyan('🚀 Welcome to Build-In-Live CLI!')));
    console.log(pc.gray('Scanning your project layout...'));

    const cwd = process.cwd();
    // 1. Framework detection
    const frameworkType = await detectFramework(cwd);
    
    if (frameworkType === 'nextjs') {
      console.log(pc.green('✅ Next.js App Router detected.'));
    } else if (frameworkType === 'vitereact') {
      console.log(pc.green('✅ Vite React detected.'));
    } else {
      console.log(pc.yellow('⚠️ Unknown or unsupported framework detected. Proceeding in Manual Mode.'));
    }

    // 2. Prompt for user confirmation
    const response = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: 'Do you want to proceed with setting up Build-In-Live and injecting the SDK?',
      initial: true
    });

    if (!response.proceed) {
      console.log(pc.yellow('Initialization aborted by user.'));
      process.exit(0);
    }

    // 3. Initiate Device Flow OAuth
    const token = await loginWithDeviceFlow();

    // 4. Project Info Gathering (AI vs Manual)
    const { projectUrl } = await prompts({
      type: 'text',
      name: 'projectUrl',
      message: 'Your deployed project URL (e.g. https://myapp.vercel.app):',
      validate: (v: string) => v.startsWith('http') ? true : 'Please enter a valid URL starting with http',
    });

    const infoChoice = await prompts({
      type: 'select',
      name: 'method',
      message: 'How would you like to set up your project details?',
      choices: [
        { title: '🤖 Auto-generate from README (Recommended)', value: 'auto' },
        { title: '✍️  Enter manually', value: 'manual' }
      ]
    });

    let projectPayload: any = { url: projectUrl };

    if (infoChoice.method === 'manual') {
      const manualData = await prompts([
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
        techStacks: manualData.techStacks.split(',').map((s: string) => s.trim()),
        categories: [],
        platforms: ['web'],
        targetAudience: [],
        useCases: [],
      };
    } else if (infoChoice.method === 'auto') {
      console.log(pc.gray('Reading local README.md...'));
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const readmeContent = await fs.readFile(path.join(cwd, 'README.md'), 'utf-8');
        projectPayload = { ...projectPayload, readmeText: readmeContent };
        console.log(pc.green('✔ README loaded successfully.'));
      } catch (err) {
        console.log(pc.yellow('⚠️ No README.md found in the root directory. Falling back to empty data.'));
        projectPayload = { ...projectPayload, readmeText: '' };
      }
    }

    // 5. Send data to Build-In-Live Backend
    const APP_BASE = 'https://build-in-live-mvp.vercel.app';
    let projectId = '';
    let userId = '';
    console.log(pc.cyan('\n📡 Syncing project with Build-In-Live...'));
    try {
      const res = await fetch(`${APP_BASE}/api/project/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(projectPayload)
      });
      if (!res.ok) throw new Error('API Sync Failed');
      const syncData = await res.json();
      projectId = syncData.projectId || '';
      userId = syncData.userId || '';
      console.log(pc.green('✔ Sync complete!'));
    } catch (err) {
      console.error(pc.red('❌ Failed to sync project data to backend.'), err);
    }

    // 6. Inject SDK via AST Parsing
    if (frameworkType !== 'unknown') {
      console.log(pc.cyan('\n📦 Starting SDK Code Injection...'));
      await injectSDK(cwd, frameworkType);
    } else {
      console.log(pc.yellow('\n⚠️  Could not automatically inject the SDK. Please add it manually:'));
      console.log(pc.yellow('import { LiveFeedbackSDK } from "@build-in-live/sdk";\n// Place inside your root component:\n<LiveFeedbackSDK />'));
    }

    // 7. Done — show project links
    console.log(pc.bold(pc.green('\n✨ All done! Your project is live on Build-In-Live.\n')));
    if (projectId) {
      const deskUrl = userId
        ? `${APP_BASE}/desk/${userId}?projectId=${projectId}`
        : `${APP_BASE}/dashboard`;
      const feedbackUrl = `${APP_BASE}/feedback/${projectId}`;
      console.log(pc.white('  📋 Review your project page:'));
      console.log(pc.cyan(`     ${deskUrl}\n`));
      console.log(pc.white('  🔗 Share this link to collect feedback:'));
      console.log(pc.cyan(`     ${feedbackUrl}\n`));
      console.log(pc.gray('  Open the project page to verify your details and start inviting collaborators.'));
    }
  });

program.parse(process.argv);
