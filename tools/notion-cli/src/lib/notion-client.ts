/**
 * Notion API Client Wrapper
 * Handles authentication and API calls
 */

import { Client } from '@notionhq/client';
import type { TaskInput, TaskOutput, QueryOptions } from '../types';
import { configManager } from './config';

export class NotionClientWrapper {
  private client: Client | null = null;
  private projectsCache: Map<string, string> = new Map();

  /**
   * Initialize Notion client with auth token
   */
  private getClient(): Client {
    if (this.client) {
      return this.client;
    }

    const config = configManager.load();
    if (!config.auth.token) {
      throw new Error(
        'Notion API token not configured. Run: notion-cli init --token YOUR_TOKEN'
      );
    }

    this.client = new Client({ auth: config.auth.token });
    return this.client;
  }

  /**
   * Create a task in the Tasks database
   */
  async createTask(task: TaskInput): Promise<TaskOutput> {
    const client = this.getClient();
    const config = configManager.load();
    const databaseId = config.databases.tasks.id;

    // Resolve driver to user ID
    let driverId: string | null = null;
    if (task.driver) {
      driverId = configManager.getUserId(task.driver);
      if (!driverId) {
        throw new Error(`Unknown user: ${task.driver}`);
      }
    } else if (config.defaults.driver) {
      driverId = configManager.getUserId(config.defaults.driver);
    }

    // Resolve project name to page URL
    let projectUrl: string | null = null;
    if (task.project) {
      projectUrl = await this.resolveProjectUrl(task.project);
    }

    // Build properties object
    const properties: any = {
      Task: {
        title: [{ text: { content: task.title } }],
      },
    };

    // Status
    if (task.status || config.defaults.status) {
      properties.Status = {
        status: { name: task.status || config.defaults.status },
      };
    }

    // Priority
    if (task.priority) {
      properties.Priority = {
        select: { name: task.priority },
      };
    }

    // Effort
    if (task.effort) {
      properties.Effort = {
        select: { name: String(task.effort) },
      };
    }

    // Driver
    if (driverId) {
      properties.Driver = {
        people: [{ id: driverId }],
      };
    }

    // Project
    if (projectUrl) {
      properties.Project = {
        relation: [{ id: projectUrl }],
      };
    }

    // Tags
    if (task.tags && task.tags.length > 0) {
      properties.Tags = {
        multi_select: task.tags.map((tag) => ({ name: tag })),
      };
    }

    // Summary
    if (task.summary) {
      properties.Summary = {
        rich_text: [{ text: { content: task.summary } }],
      };
    }

    // URL
    if (task.url) {
      properties['userDefined:URL'] = {
        url: task.url,
      };
    }

    // Date properties
    if (task.startDate) {
      properties['date:Start Date:start'] = task.startDate;
      properties['date:Start Date:is_datetime'] = 0;
    }

    // Create page
    const response = await client.pages.create({
      parent: { database_id: databaseId },
      properties,
      children: task.content
        ? [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ text: { content: task.content } }],
              },
            },
          ]
        : undefined,
    });

    // Construct URL from page ID
    const pageId = response.id.replace(/-/g, '');
    const url = `https://www.notion.so/${pageId}`;

    return {
      id: response.id,
      url,
      title: task.title,
      status: task.status,
      priority: task.priority,
    };
  }

  /**
   * Bulk create tasks
   */
  async bulkCreateTasks(tasks: TaskInput[]): Promise<TaskOutput[]> {
    const results: TaskOutput[] = [];
    const errors: Array<{ task: TaskInput; error: Error }> = [];

    for (const task of tasks) {
      try {
        const result = await this.createTask(task);
        results.push(result);
      } catch (error) {
        errors.push({ task, error: error as Error });
      }
    }

    if (errors.length > 0) {
      console.error(`\n❌ ${errors.length} tasks failed:`);
      errors.forEach(({ task, error }) => {
        console.error(`  - ${task.title}: ${error.message}`);
      });
    }

    return results;
  }

  /**
   * Query tasks with filters
   */
  async queryTasks(options: QueryOptions): Promise<any[]> {
    const client = this.getClient();
    const config = configManager.load();
    const databaseId = config.databases.tasks.id;

    const filter: any = {
      and: [],
    };

    // Driver filter
    if (options.driver) {
      const driverId = configManager.getUserId(options.driver);
      if (driverId) {
        filter.and.push({
          property: 'Driver',
          people: { contains: driverId },
        });
      }
    }

    // Status filter (supports comma-separated list)
    if (options.status) {
      const statuses = options.status.split(',').map((s) => s.trim());
      if (statuses.length === 1) {
        filter.and.push({
          property: 'Status',
          status: { equals: statuses[0] },
        });
      } else {
        filter.and.push({
          or: statuses.map((status) => ({
            property: 'Status',
            status: { equals: status },
          })),
        });
      }
    }

    const response = await client.databases.query({
      database_id: databaseId,
      filter: filter.and.length > 0 ? filter : undefined,
      page_size: options.limit || 100,
    });

    return response.results;
  }

  /**
   * Resolve project name to Notion page URL
   */
  private async resolveProjectUrl(projectName: string): Promise<string | null> {
    // Check cache
    if (this.projectsCache.has(projectName)) {
      return this.projectsCache.get(projectName)!;
    }

    // Check if it's already a URL or UUID
    if (projectName.startsWith('http') || projectName.includes('notion.so')) {
      // Extract page ID from URL
      const match = projectName.match(/([a-f0-9]{32})/);
      if (match) {
        const pageId = match[1];
        this.projectsCache.set(projectName, pageId);
        return pageId;
      }
    }

    // Search for project by name
    const client = this.getClient();
    const config = configManager.load();

    if (config.databases.projects) {
      try {
        const response = await client.databases.query({
          database_id: config.databases.projects.id,
          filter: {
            property: 'Name',
            title: {
              contains: projectName,
            },
          },
          page_size: 1,
        });

        if (response.results.length > 0) {
          const pageId = response.results[0].id;
          this.projectsCache.set(projectName, pageId);
          return pageId;
        }
      } catch (error) {
        // Projects database might not exist
      }
    }

    return null;
  }
}

export const notionClient = new NotionClientWrapper();
