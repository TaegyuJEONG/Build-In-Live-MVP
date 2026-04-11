"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFramework = detectFramework;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Detects the framework of the current project.
 * @param cwd The current working directory
 * @returns FrameworkType string
 */
async function detectFramework(cwd) {
    try {
        const packageJsonPath = path_1.default.join(cwd, 'package.json');
        const packageJsonStr = await promises_1.default.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonStr);
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        // 1. Check for Next.js App Router
        if (deps.next) {
            const appDirRoots = [
                path_1.default.join(cwd, 'app'),
                path_1.default.join(cwd, 'src', 'app')
            ];
            for (const dir of appDirRoots) {
                try {
                    const stats = await promises_1.default.stat(dir);
                    if (stats.isDirectory())
                        return 'nextjs';
                }
                catch (e) {
                    // ignore
                }
            }
        }
        // 2. Check for Vite React
        if (deps.vite && (deps.react || deps['@vitejs/plugin-react'])) {
            const viteRoots = [
                path_1.default.join(cwd, 'src', 'main.tsx'),
                path_1.default.join(cwd, 'src', 'main.jsx')
            ];
            for (const file of viteRoots) {
                try {
                    const stats = await promises_1.default.stat(file);
                    if (stats.isFile())
                        return 'vitereact';
                }
                catch (e) {
                    // ignore
                }
            }
        }
        return 'unknown';
    }
    catch (error) {
        return 'unknown';
    }
}
