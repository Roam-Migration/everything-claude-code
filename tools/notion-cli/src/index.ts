#!/usr/bin/env node

/**
 * Notion CLI - Main Entry Point
 * CLI tool for automating Notion task creation and management
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { createTaskCommand } from './commands/create-task';
import { bulkCreateCommand } from './commands/bulk-create';
import { queryTasksCommand } from './commands/query-tasks';

const program = new Command();

program
  .name('notion-cli')
  .description('CLI tool for automating Notion task creation and management')
  .version('0.1.0');

// Add commands
program.addCommand(initCommand());
program.addCommand(createTaskCommand());
program.addCommand(bulkCreateCommand());
program.addCommand(queryTasksCommand());

// Parse arguments
program.parse(process.argv);
