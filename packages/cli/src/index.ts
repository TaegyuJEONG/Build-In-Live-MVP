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

    // 3. Initiate Device Flow OAuth (Verify if already logged in)
    const { readConfig } = await import('./utils/config');
    const config = await readConfig();
    let token = config.accessToken;
    const APP_BASE = 'https://build-in-live-mvp.vercel.app';

    if (token) {
      console.log(pc.gray('Verifying authentication...'));
      try {
        const res = await fetch(`${APP_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userInfo = await res.json();
          console.log(pc.green(`✅ Authenticated as ${pc.bold(userInfo.name)} (${userInfo.email})`));
        } else {
          console.log(pc.yellow('⚠️  Session expired or invalid. Please log in again.'));
          token = '';
        }
      } catch (err) {
        console.log(pc.yellow('⚠️  Connection error during authentication.'));
        token = '';
      }
    }

    if (!token) {
      token = await loginWithDeviceFlow();
    }

    // 4. Project Info Gathering
    const { projectUrl, demoVideo } = await prompts([
      {
        type: 'text',
        name: 'projectUrl',
        message: 'Your deployed project URL (e.g. https://myapp.vercel.app):',
        validate: (v: string) => v.startsWith('http') ? true : 'Please enter a valid URL starting with http',
      },
      {
        type: 'text',
        name: 'demoVideo',
        message: 'Optional: Your product demo video URL (Press Enter to skip):',
      }
    ]);

    let projectPayload: any = { 
      url: projectUrl,
      demoVideo: demoVideo
    };

    console.log(pc.gray('Reading local README.md for auto-generation...'));
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const readmeContent = await fs.readFile(path.join(cwd, 'README.md'), 'utf-8');
      projectPayload = { ...projectPayload, readmeText: readmeContent };
      console.log(pc.green('✔ README loaded successfully. Auto-generating project details via AI...'));
    } catch (err) {
      console.log(pc.yellow('⚠️ No README.md found in the root directory. Proceeding with empty data.'));
      projectPayload = { ...projectPayload, readmeText: '' };
    }

    // 5. Send data to Build-In-Live Backend
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
    if (frameworkType !== 'unknown' && projectId) {
      console.log(pc.cyan('\n📦 Starting SDK Code Injection...'));
      await injectSDK(cwd, frameworkType, projectId);
    } else {
      console.log(pc.yellow('\n⚠️  Could not automatically inject the SDK. Please add it manually:'));
      console.log(pc.yellow('Insert: <script src="https://build-in-live-mvp.vercel.app/sdk.js" data-project-id="' + projectId + '" async></script> before </body>'));
    }

    // 7. Success Guidance
    console.log(pc.bold(pc.green('\n✨ Project Successfully Linked to Build-In-Live!')));
    
    console.log(pc.white('\n  ──────────────────────────────────────────────────────────────────'));
    console.log(pc.bold(pc.white('  1. 🚀 DEPLOY YOUR PROJECT')));
    console.log(pc.gray('     The SDK is now in your code. You MUST deploy your project to'));
    console.log(pc.gray('     Vercel (or your hosting provider) for changes to take effect.'));

    if (projectId) {
      const verifyUrl = `${APP_BASE}/onboarding?projectId=${projectId}&step=4`;
      const deskUrl = userId ? `${APP_BASE}/desk/${userId}?projectId=${projectId}` : `${APP_BASE}/dashboard`;
      const feedbackUrl = `${APP_BASE}/feedback/${projectId}`;

      console.log(pc.bold(pc.white('\n  2. ✅ VERIFY SDK CONNECTION')));
      console.log(pc.gray('     Once deployed, visit this link to verify your integration:'));
      console.log(pc.cyan(`     ${verifyUrl}`));

      console.log(pc.bold(pc.white('\n  3. 🔗 SHARE & COLLECT FEEDBACK')));
      console.log(pc.gray('     After verification, share this link with your testers:'));
      console.log(pc.cyan(`     ${feedbackUrl}`));

      console.log(pc.white('\n  📋 Manage your project at:'));
      console.log(pc.cyan(`     ${deskUrl}`));
    }
    console.log(pc.white('  ──────────────────────────────────────────────────────────────────\n'));
  });

program
  .command('logout')
  .description('Log out from Build-In-Live')
  .action(async () => {
    const { writeConfig } = await import('./utils/config');
    await writeConfig({ accessToken: undefined });
    console.log(pc.green('✅ Successfully logged out.'));
  });

program.parse(process.argv);
