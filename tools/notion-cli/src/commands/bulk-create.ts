/**
 * Bulk Create Command
 * Create multiple tasks from JSON file
 */

import { Command } from 'commander';
import { notionClient } from '../lib/notion-client';
import type { BulkTasksInput, TaskInput } from '../types';
import chalk from 'chalk';
import fs from 'fs';

export function bulkCreateCommand(): Command {
  const command = new Command('bulk-create');

  command
    .description('Create multiple tasks from JSON file')
    .argument('<file>', 'Path to JSON file with tasks')
    .option('--format <format>', 'Output format: table, json, urls', 'table')
    .action(async (file, options) => {
      try {
        // Read and parse JSON file
        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`);
        }

        const jsonData = fs.readFileSync(file, 'utf-8');
        const input: BulkTasksInput = JSON.parse(jsonData);

        if (!input.tasks || !Array.isArray(input.tasks)) {
          throw new Error('Invalid JSON format. Expected "tasks" array.');
        }

        console.log(
          chalk.blue(`Creating ${input.tasks.length} tasks...`)
        );

        // Apply defaults to all tasks
        const tasksWithDefaults: TaskInput[] = input.tasks.map((task) => ({
          ...input.defaults,
          ...task,
        }));

        // Create tasks
        const results = await notionClient.bulkCreateTasks(tasksWithDefaults);

        // Output results based on format
        if (options.format === 'urls') {
          results.forEach((result) => console.log(result.url));
        } else if (options.format === 'json') {
          console.log(JSON.stringify(results, null, 2));
        } else {
          // Table format
          console.log(chalk.green(`\n✅ Created ${results.length} tasks:\n`));
          results.forEach((result, index) => {
            console.log(
              `${chalk.cyan((index + 1).toString())}. ${chalk.white(
                result.title
              )}`
            );
            console.log(`   ${chalk.gray(result.url)}\n`);
          });
        }

        if (results.length < input.tasks.length) {
          const failed = input.tasks.length - results.length;
          console.log(
            chalk.yellow(`\n⚠️  ${failed} task(s) failed (see errors above)`)
          );
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('\n❌ Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
