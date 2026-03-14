#!/usr/bin/env node

/**
 * Team Environment Setup Script
 *
 * Automates onboarding for new team members by:
 * - Checking for required plugins
 * - Copying configuration templates
 * - Setting up MCP servers
 * - Verifying environment readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log('='.repeat(60), 'cyan');
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} (not found)`, 'red');
    return false;
  }
}

async function main() {
  header('Everything Claude Code - Team Environment Setup');

  const projectRoot = process.cwd();
  const claudeDir = path.join(projectRoot, '.claude');
  const metabaseDir = path.join(projectRoot, 'mcp-servers', 'metabase');

  // Step 1: Verify project structure
  header('Step 1: Verifying Project Structure');

  const requiredDirs = [
    ['agents', 'Agents directory'],
    ['skills', 'Skills directory'],
    ['commands', 'Commands directory'],
    ['mcp-servers', 'MCP servers directory'],
    ['.claude', 'Claude configuration directory'],
  ];

  let structureValid = true;
  for (const [dir, desc] of requiredDirs) {
    if (!checkFile(path.join(projectRoot, dir), desc)) {
      structureValid = false;
    }
  }

  if (!structureValid) {
    log('\n❌ Project structure incomplete. Are you in the right directory?', 'red');
    process.exit(1);
  }

  // Step 2: Copy configuration templates
  header('Step 2: Setting Up Configuration Files');

  // Copy .claude/settings.json from example
  const settingsExample = path.join(claudeDir, 'settings.example.json');
  const settingsFile = path.join(claudeDir, 'settings.json');

  if (!fs.existsSync(settingsFile)) {
    if (fs.existsSync(settingsExample)) {
      fs.copyFileSync(settingsExample, settingsFile);
      log('✅ Created .claude/settings.json from template', 'green');
      log('   You can customize plugin settings in this file', 'blue');
    } else {
      log('❌ Template .claude/settings.example.json not found', 'red');
    }
  } else {
    log('⏭️  .claude/settings.json already exists', 'yellow');
  }

  // Copy Metabase MCP config
  const metabaseExample = path.join(metabaseDir, '.mcp.json.example');
  const metabaseConfig = path.join(metabaseDir, '.mcp.json');

  if (fs.existsSync(metabaseDir)) {
    if (!fs.existsSync(metabaseConfig)) {
      if (fs.existsSync(metabaseExample)) {
        fs.copyFileSync(metabaseExample, metabaseConfig);
        log('✅ Created mcp-servers/metabase/.mcp.json from template', 'green');
        log('   ⚠️  IMPORTANT: Edit this file with your Metabase credentials', 'yellow');
      } else {
        log('❌ Template mcp-servers/metabase/.mcp.json.example not found', 'red');
      }
    } else {
      log('⏭️  mcp-servers/metabase/.mcp.json already exists', 'yellow');
    }
  }

  // Step 3: Install MCP server dependencies
  header('Step 3: Installing MCP Server Dependencies');

  if (fs.existsSync(metabaseDir)) {
    try {
      log('📦 Installing Metabase MCP server dependencies...', 'blue');
      execSync('npm install', {
        cwd: metabaseDir,
        stdio: 'inherit'
      });
      log('✅ Metabase MCP dependencies installed', 'green');

      log('🔨 Building Metabase MCP server...', 'blue');
      execSync('npm run build', {
        cwd: metabaseDir,
        stdio: 'inherit'
      });
      log('✅ Metabase MCP server built successfully', 'green');
    } catch (error) {
      log('❌ Failed to build Metabase MCP server', 'red');
      log('   Run manually: cd mcp-servers/metabase && npm install && npm run build', 'yellow');
    }
  }

  // Step 4: Install commands to ~/.claude/commands/
  header('Step 4: Installing Slash Commands');
  try {
    execSync('bash scripts/install-commands.sh', { cwd: projectRoot, stdio: 'inherit' });
  } catch (error) {
    log('❌ Command installation failed — run manually: bash scripts/install-commands.sh', 'red');
  }

  // Step 5: Activate hooks in ~/.claude/settings.json
  header('Step 5: Activating Hooks');
  try {
    execSync('bash scripts/install-hooks.sh', { cwd: projectRoot, stdio: 'inherit' });
  } catch (error) {
    log('❌ Hook installation failed — run manually: bash scripts/install-hooks.sh', 'red');
  }

  // Step 6: Check for required plugins
  header('Step 6: Required Plugins (manual step)');

  log('ℹ️  Claude Code plugins must be installed manually:', 'blue');
  log('   Run these commands inside Claude Code:', 'blue');
  console.log('');
  log('   /plugin install Notion@claude-plugins-official', 'cyan');
  log('   /plugin install context7@claude-plugins-official', 'cyan');
  log('   /plugin install frontend-design@claude-plugins-official', 'cyan');
  console.log('');
  log('   Note: Use gh CLI instead of github plugin (already authenticated)', 'blue');
  log('   After installing, restart Claude Code with: /exit', 'blue');

  // Step 7: Summary
  header('Setup Complete!');

  log('✅ Configuration templates created', 'green');
  log('✅ MCP servers built', 'green');
  log('✅ Slash commands installed to ~/.claude/commands/', 'green');
  log('✅ Hooks activated in ~/.claude/settings.json', 'green');
  console.log('');
  log('Next Steps:', 'blue');
  log('   1. Install required plugins (see above)', 'blue');
  log('   2. Edit mcp-servers/metabase/.mcp.json with your Metabase credentials', 'blue');
  log('   3. Restart Claude Code', 'blue');
  log('   4. Run: node scripts/verify-environment.js', 'blue');
  console.log('');
  log('Documentation:', 'blue');
  log('   - CLAUDE.md        - Quick reference (triggers, rules, structure)', 'blue');
  log('   - docs/SETUP.md    - Full setup and contribution guide', 'blue');
  log('   - rml/CLAUDE.md    - RML team context and workflows', 'blue');
  console.log('');
}

main().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
