"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), '.buildinlive');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
async function readConfig() {
    try {
        const data = await promises_1.default.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        return {};
    }
}
async function writeConfig(config) {
    try {
        const existing = await readConfig();
        const newConfig = { ...existing, ...config };
        // Ensure dir exists
        await promises_1.default.mkdir(CONFIG_DIR, { recursive: true });
        await promises_1.default.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('Failed to write config file:', error);
    }
}
