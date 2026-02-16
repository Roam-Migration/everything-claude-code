/**
 * Init Command
 * Initialize Notion CLI configuration
 */

import { Command } from 'commander';
import { configManager } from '../lib/config';
import chalk from 'chalk';

export function initCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize Notion CLI configuration')
    .option('-t, --token <token>', 'Notion API token')
    .action(async (options) => {
      try {
        console.log(chalk.blue('Initializing Notion CLI...'));

        const config = await configManager.init(options.token);

        console.log(chalk.green('✅ Configuration initialized!'));
        console.log('\nConfig location:', chalk.cyan('~/.claude/notion-cli.json'));
        console.log('\nWorkspace:', chalk.cyan(config.auth.workspace));
        console.log(
          'Token:',
          config.auth.token ? chalk.green('✓ Set') : chalk.red('✗ Not set')
        );

        if (!config.auth.token) {
          console.log(
            chalk.yellow(
              '\n⚠️  No token found. Run with --token flag or set NOTION_API_KEY in MCP config.'
            )
          );
        } else {
          console.log(chalk.green('\n✅ Ready to use! Try:'));
          console.log(
            chalk.cyan('  notion-cli create-task --title "Test task"')
          );
        }
      } catch (error) {
        console.error(chalk.red('❌ Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
