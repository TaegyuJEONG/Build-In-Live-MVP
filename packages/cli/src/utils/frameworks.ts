import fs from 'fs/promises';
import path from 'path';

/**
 * Detects if the current directory is a Next.js App Router project.
 * @param cwd The current working directory
 * @returns true if it's a Next.js App Router project
 */
export async function detectNextJsAppRouter(cwd: string): Promise<boolean> {
  try {
    // Check for package.json to verify Next.js dependency
    const packageJsonPath = path.join(cwd, 'package.json');
    const packageJsonStr = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonStr);

    const hasNextDep = 
      (packageJson.dependencies && packageJson.dependencies.next) || 
      (packageJson.devDependencies && packageJson.devDependencies.next);

    if (!hasNextDep) {
      return false;
    }

    // Check for 'app' directory (src/app or app)
    const appDirRoots = [
      path.join(cwd, 'app'),
      path.join(cwd, 'src', 'app')
    ];

    let hasAppDir = false;
    for (const dir of appDirRoots) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          hasAppDir = true;
          break;
        }
      } catch (e) {
        // Directory does not exist
      }
    }

    return hasAppDir;
  } catch (error) {
    console.error('Error detecting framework:', error);
    return false;
  }
}
