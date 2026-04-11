"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNextJsAppRouter = detectNextJsAppRouter;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Detects if the current directory is a Next.js App Router project.
 * @param cwd The current working directory
 * @returns true if it's a Next.js App Router project
 */
async function detectNextJsAppRouter(cwd) {
    try {
        // Check for package.json to verify Next.js dependency
        const packageJsonPath = path_1.default.join(cwd, 'package.json');
        const packageJsonStr = await promises_1.default.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonStr);
        const hasNextDep = (packageJson.dependencies && packageJson.dependencies.next) ||
            (packageJson.devDependencies && packageJson.devDependencies.next);
        if (!hasNextDep) {
            return false;
        }
        // Check for 'app' directory (src/app or app)
        const appDirRoots = [
            path_1.default.join(cwd, 'app'),
            path_1.default.join(cwd, 'src', 'app')
        ];
        let hasAppDir = false;
        for (const dir of appDirRoots) {
            try {
                const stats = await promises_1.default.stat(dir);
                if (stats.isDirectory()) {
                    hasAppDir = true;
                    break;
                }
            }
            catch (e) {
                // Directory does not exist
            }
        }
        return hasAppDir;
    }
    catch (error) {
        console.error('Error detecting framework:', error);
        return false;
    }
}
