#!/usr/bin/env node

/**
 * Environment Verification Script
 *
 * Checks that the development environment is properly configured:
 * - Configuration files exist
 * - MCP servers are built
 * - Required files are in place
 */

const fs = require('fs');
const path = require('path');

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

function check(condition, successMsg, failMsg, warning = false) {
  if (condition) {
    log(`✅ ${successMsg}`, 'green');
    return true;
  } else {
    log(`${warning ? '⚠️ ' : '❌'} ${failMsg}`, warning ? 'yellow' : 'red');
    return false;
  }
}

async function main() {
  header('Everything Claude Code - Environment Verification');

  const projectRoot = process.cwd();
  let criticalIssues = 0;
  let warnings = 0;

  // Check 1: Configuration files
  header('Configuration Files');

  const settingsFile = path.join(projectRoot, '.claude', 'settings.json');
  if (!check(
    fs.existsSync(settingsFile),
    '.claude/settings.json exists',
    '.claude/settings.json missing - run setup script'
  )) criticalIssues++;

  const settingsExample = path.join(projectRoot, '.claude', 'settings.example.json');
  check(
    fs.existsSync(settingsExample),
    '.claude/settings.example.json exists',
    '.claude/settings.example.json missing'
  );

  // Check plugin configuration
  if (fs.existsSync(settingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      const requiredPlugins = [
        'Notion@claude-plugins-official',
        'context7@claude-plugins-official',
        'github@claude-plugins-official',
        'supabase@claude-plugins-official',
      ];

      const enabledPlugins = settings.enabledPlugins || {};
      const missingPlugins = requiredPlugins.filter(
        plugin => !enabledPlugins[plugin]
      );

      if (missingPlugins.length === 0) {
        log('✅ All required plugins enabled in settings', 'green');
      } else {
        log(`⚠️  Some required plugins not enabled: ${missingPlugins.join(', ')}`, 'yellow');
        log('   Enable them in .claude/settings.json', 'blue');
        warnings++;
      }
    } catch (error) {
      log('⚠️  Could not parse .claude/settings.json', 'yellow');
      warnings++;
    }
  }

  // Check 2: MCP Servers
  header('MCP Servers');

  const metabaseDir = path.join(projectRoot, 'mcp-servers', 'metabase');
  check(
    fs.existsSync(metabaseDir),
    'Metabase MCP server directory exists',
    'Metabase MCP server directory missing'
  );

  const metabaseDist = path.join(metabaseDir, 'dist', 'index.js');
  if (!check(
    fs.existsSync(metabaseDist),
    'Metabase MCP server built (dist/index.js exists)',
    'Metabase MCP server not built - run: cd mcp-servers/metabase && npm run build'
  )) criticalIssues++;

  const metabaseConfig = path.join(metabaseDir, '.mcp.json');
  if (!check(
    fs.existsSync(metabaseConfig),
    'Metabase MCP config exists (.mcp.json)',
    'Metabase MCP config missing - copy from .mcp.json.example'
  )) criticalIssues++;

  // Check if config has placeholder values
  if (fs.existsSync(metabaseConfig)) {
    try {
      const config = JSON.parse(fs.readFileSync(metabaseConfig, 'utf8'));
      const env = config.metabase?.env || {};

      if (
        env.METABASE_API_KEY === 'your_api_key_here' ||
        env.METABASE_URL === 'https://your-instance.metabaseapp.com'
      ) {
        log('⚠️  Metabase config has placeholder values - update with real credentials', 'yellow');
        warnings++;
      } else {
        log('✅ Metabase config appears configured', 'green');
      }
    } catch (error) {
      log('⚠️  Could not parse .mcp.json', 'yellow');
      warnings++;
    }
  }

  // Check 3: Documentation
  header('Documentation');

  const docs = [
    ['CLAUDE.md', 'Project configuration'],
    ['README.md', 'Repository overview'],
    ['docs/team-sync-guide.md', 'Team collaboration guide'],
    ['docs/metabase-setup-guide.md', 'Metabase integration guide'],
    ['docs/notion-integration.md', 'Notion workspace schemas'],
  ];

  for (const [file, desc] of docs) {
    check(
      fs.existsSync(path.join(projectRoot, file)),
      `${desc} (${file})`,
      `${desc} missing (${file})`,
      true
    );
  }

  // Check 4: Skills
  header('Skills');

  const skills = [
    ['skills/metabase-card-creation', 'Metabase card creation workflow'],
    ['skills/metabase-sql-server-patterns', 'SQL Server patterns'],
  ];

  for (const [dir, desc] of skills) {
    const skillMd = path.join(projectRoot, dir, 'SKILL.md');
    check(
      fs.existsSync(skillMd),
      `${desc} (${dir}/SKILL.md)`,
      `${desc} missing (${dir}/SKILL.md)`,
      true
    );
  }

  // Check 5: Prompts
  header('Prompts');

  const prompts = [
    ['prompts/notion-integration-handover-request.md', 'Notion handover template'],
    ['prompts/notion-task-supabase-tiptap.md', 'Notion task example'],
  ];

  for (const [file, desc] of prompts) {
    check(
      fs.existsSync(path.join(projectRoot, file)),
      `${desc} (${file})`,
      `${desc} missing (${file})`,
      true
    );
  }

  // Summary
  header('Verification Summary');

  if (criticalIssues === 0 && warnings === 0) {
    log('🎉 Environment is fully configured and ready!', 'green');
    console.log('');
    log('✅ All configuration files present', 'green');
    log('✅ MCP servers built', 'green');
    log('✅ Documentation in place', 'green');
    console.log('');
    log('📋 Next Steps:', 'blue');
    log('   - Ensure plugins are installed in Claude Code', 'blue');
    log('   - Restart Claude Code if you just installed plugins', 'blue');
    log('   - Test MCP tools: "Show me the SQL Server syntax guide"', 'blue');
  } else {
    if (criticalIssues > 0) {
      log(`❌ ${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''} found`, 'red');
    }
    if (warnings > 0) {
      log(`⚠️  ${warnings} warning${warnings > 1 ? 's' : ''} found`, 'yellow');
    }
    console.log('');
    log('📋 To fix issues:', 'blue');
    log('   1. Run: node scripts/setup-team-environment.js', 'blue');
    log('   2. Follow the instructions to install plugins', 'blue');
    log('   3. Update configuration files with your credentials', 'blue');
    log('   4. Run this script again to verify', 'blue');

    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  process.exit(1);
});
