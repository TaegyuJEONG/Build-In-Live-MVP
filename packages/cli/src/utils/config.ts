import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.buildinlive');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface CLIConfig {
  accessToken?: string;
  projectId?: string;
}

export async function readConfig(): Promise<CLIConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as CLIConfig;
  } catch (error) {
    return {};
  }
}

export async function writeConfig(config: Partial<CLIConfig>): Promise<void> {
  try {
    const existing = await readConfig();
    const newConfig = { ...existing, ...config };
    
    // Ensure dir exists
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write config file:', error);
  }
}
