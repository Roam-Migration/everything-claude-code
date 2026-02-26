/**
 * Configuration Management
 * Handles loading and saving Notion CLI configuration
 */

import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { NotionConfig } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.claude');
const CONFIG_FILE = path.join(CONFIG_DIR, 'notion-cli.json');

const DEFAULT_CONFIG: NotionConfig = {
  auth: {
    token: '',
    workspace: 'roammigrationlaw',
  },
  databases: {
    tasks: {
      id: '502c024ad46441a4938ca25e852e4f91',
      collection_id: '4b3348c5-136e-4339-8166-b3680e3b6396',
    },
  },
  users: {
    jackson: 'cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87',
  },
  defaults: {
    driver: 'jackson',
    status: 'Not started',
  },
};

export class ConfigManager {
  private config: NotionConfig | null = null;

  /**
   * Load configuration from file or return default
   */
  load(): NotionConfig {
    if (this.config) {
      return this.config;
    }

    // Try to load from config file
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
      this.config = JSON.parse(configData) as NotionConfig;
      return this.config!;
    }

    // Try to load Notion token from MCP config
    const mcpConfigPath = path.join(CONFIG_DIR, 'mcp.json');
    if (fs.existsSync(mcpConfigPath)) {
      try {
        const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
        const notionMcp = mcpConfig.mcpServers?.['plugin:Notion:notion'];
        if (notionMcp?.env?.NOTION_API_KEY) {
          DEFAULT_CONFIG.auth.token = notionMcp.env.NOTION_API_KEY;
        }
      } catch (error) {
        // Ignore MCP config errors
      }
    }

    this.config = { ...DEFAULT_CONFIG };
    return this.config;
  }

  /**
   * Save configuration to file
   */
  save(config: NotionConfig): void {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    this.config = config;
  }

  /**
   * Initialize config with prompts (called by init command)
   */
  async init(token?: string): Promise<NotionConfig> {
    const config = this.load();

    // Update token if provided
    if (token) {
      config.auth.token = token;
    }

    // Validate token is set
    if (!config.auth.token) {
      throw new Error(
        'Notion API token not found. Please provide via --token flag or set in MCP config.'
      );
    }

    this.save(config);
    return config;
  }

  /**
   * Get user ID by name
   */
  getUserId(name: string): string | null {
    const config = this.load();
    const normalizedName = name.toLowerCase().trim();

    // Direct match
    if (config.users[normalizedName]) {
      return config.users[normalizedName];
    }

    // Check if it's already a UUID
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        name
      )
    ) {
      return name;
    }

    // Special case: "me" uses default driver
    if (normalizedName === 'me' && config.defaults.driver) {
      return config.users[config.defaults.driver] || null;
    }

    return null;
  }

  /**
   * Get database ID by name
   */
  getDatabaseId(name: string): string | null {
    const config = this.load();
    const normalizedName = name.toLowerCase().trim();

    if (normalizedName === 'tasks' && config.databases.tasks) {
      return config.databases.tasks.id;
    }

    if (normalizedName === 'projects' && config.databases.projects) {
      return config.databases.projects.id;
    }

    return null;
  }

  /**
   * Get default value for a property
   */
  getDefault(property: string): string | undefined {
    const config = this.load();
    return (config.defaults as any)[property];
  }
}

export const configManager = new ConfigManager();
