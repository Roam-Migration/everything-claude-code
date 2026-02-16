/**
 * Create Task Command
 * Create a single task in Notion
 */

import { Command } from 'commander';
import { notionClient } from '../lib/notion-client';
import type { TaskInput } from '../types';
import chalk from 'chalk';

export function createTaskCommand(): Command {
  const command = new Command('create-task');

  command
    .description('Create a new task in Notion')
    .requiredOption('--title <title>', 'Task title')
    .option('--status <status>', 'Task status (e.g., "Not started", "In progress")')
    .option('--priority <priority>', 'Task priority (e.g., "High", "🟡 Normal")')
    .option('--effort <effort>', 'Task effort (Fibonacci: 1, 2, 3, 5, 8)')
    .option('--driver <driver>', 'Task driver/owner (name or user ID)')
    .option('--project <project>', 'Project name or URL')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--summary <summary>', 'Brief task summary')
    .option('--url <url>', 'Related URL (e.g., GitHub repo)')
    .option('--content <content>', 'Task content/description')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .action(async (options) => {
      try {
        const task: TaskInput = {
          title: options.title,
          status: options.status,
          priority: options.priority,
          effort: options.effort,
          driver: options.driver,
          project: options.project,
          tags: options.tags?.split(',').map((t: string) => t.trim()),
          summary: options.summary,
          url: options.url,
          content: options.content,
          startDate: options.startDate,
        };

        console.log(chalk.blue('Creating task...'));

        const result = await notionClient.createTask(task);

        console.log(chalk.green('\n✅ Task created successfully!'));
        console.log('\nTitle:', chalk.cyan(result.title));
        console.log('URL:', chalk.cyan(result.url));

        if (result.status) {
          console.log('Status:', chalk.yellow(result.status));
        }
        if (result.priority) {
          console.log('Priority:', chalk.yellow(result.priority));
        }
      } catch (error) {
        console.error(chalk.red('\n❌ Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
