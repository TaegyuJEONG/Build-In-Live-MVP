import fs from 'fs/promises';
import path from 'path';

export type FrameworkType = 'nextjs' | 'vitereact' | 'unknown';

/**
 * Detects the framework of the current project.
 * @param cwd The current working directory
 * @returns FrameworkType string
 */
export async function detectFramework(cwd: string): Promise<FrameworkType> {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    const packageJsonStr = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonStr);

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // 1. Check for Next.js App Router
    if (deps.next) {
      const appDirRoots = [
        path.join(cwd, 'app'),
        path.join(cwd, 'src', 'app')
      ];
      for (const dir of appDirRoots) {
        try {
          const stats = await fs.stat(dir);
          if (stats.isDirectory()) return 'nextjs';
        } catch (e) {
          // ignore
        }
      }
    }

    // 2. Check for Vite React
    if (deps.vite && (deps.react || deps['@vitejs/plugin-react'])) {
      const viteRoots = [
        path.join(cwd, 'src', 'main.tsx'),
        path.join(cwd, 'src', 'main.jsx')
      ];
      for (const file of viteRoots) {
        try {
          const stats = await fs.stat(file);
          if (stats.isFile()) return 'vitereact';
        } catch (e) {
          // ignore
        }
      }
    }

    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}
