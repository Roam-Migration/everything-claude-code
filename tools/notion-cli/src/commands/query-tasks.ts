/**
 * Query Tasks Command
 * Query and filter tasks
 */

import { Command } from 'commander';
import { notionClient } from '../lib/notion-client';
import type { QueryOptions } from '../types';
import chalk from 'chalk';

export function queryTasksCommand(): Command {
  const command = new Command('query-tasks');

  command
    .description('Query tasks with filters')
    .option('--driver <driver>', 'Filter by driver (name or "me")')
    .option('--status <status>', 'Filter by status (comma-separated)')
    .option('--project <project>', 'Filter by project name')
    .option('--limit <limit>', 'Maximum number of results', '10')
    .option('--format <format>', 'Output format: table, json, urls', 'table')
    .action(async (options) => {
      try {
        const queryOptions: QueryOptions = {
          driver: options.driver,
          status: options.status,
          project: options.project,
          limit: parseInt(options.limit),
          format: options.format,
        };

        console.log(chalk.blue('Querying tasks...'));

        const results = await notionClient.queryTasks(queryOptions);

        if (results.length === 0) {
          console.log(chalk.yellow('\nNo tasks found matching criteria.'));
          return;
        }

        // Output based on format
        if (options.format === 'json') {
          console.log(JSON.stringify(results, null, 2));
        } else if (options.format === 'urls') {
          results.forEach((result: any) => console.log(result.url));
        } else {
          // Table format
          console.log(chalk.green(`\nFound ${results.length} tasks:\n`));

          results.forEach((result: any, index: number) => {
            const title =
              result.properties.Task?.title?.[0]?.text?.content || 'Untitled';
            const status =
              result.properties.Status?.status?.name || 'No status';
            const priority =
              result.properties.Priority?.select?.name || 'No priority';
            const effort =
              result.properties.Effort?.select?.name || '-';

            console.log(
              `${chalk.cyan((index + 1).toString())}. ${chalk.white(title)}`
            );
            console.log(
              `   Status: ${chalk.yellow(status)} | Priority: ${chalk.yellow(
                priority
              )} | Effort: ${chalk.yellow(effort)}`
            );
            console.log(`   ${chalk.gray(result.url)}\n`);
          });
        }
      } catch (error) {
        console.error(chalk.red('\n❌ Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
