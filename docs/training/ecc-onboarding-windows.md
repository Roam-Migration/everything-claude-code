# ECC Onboarding — Windows Setup Guide

**Audience:** New team members setting up Claude Code on Windows from scratch
**Last updated:** 2026-02-25
**Related Notion task:** T1 — Set up Windows development environment for Claude Code

---

## Prerequisites

Before starting, confirm you have:
- [ ] A Windows machine (Windows 10 or 11)
- [ ] A @roammigrationlaw.com Google account
- [ ] Claude Code access (login credentials from Jackson)
- [ ] GitHub account added to the Roam-Migration organisation

---

## Step 1: Enable WSL2 (Windows Subsystem for Linux)

WSL2 lets you run a Linux environment inside Windows. Claude Code and Node.js work best in Linux, and VS Code connects to WSL2 seamlessly.

1. Open **PowerShell as Administrator** (right-click Start > Terminal (Admin))
2. Run:
   ```powershell
   wsl --install
   ```
3. Restart your computer when prompted
4. After restart, Ubuntu opens automatically — create a Linux username and password when asked (keep it simple, e.g., your first name)

**Verify:**
```bash
wsl --version
# Should show WSL version 2
```

---

## Step 2: Install Node.js via nvm

`nvm` is a Node.js version manager that makes it easy to install and update Node.js.

Open the Ubuntu terminal (search "Ubuntu" in Start menu) and run:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Reload shell config
source ~/.bashrc

# Install latest LTS version of Node.js
nvm install --lts

# Verify
node --version   # Should show v22.x or similar
npm --version    # Should show v10.x or similar
```

---

## Step 3: Install Git

```bash
sudo apt update && sudo apt install git -y

# Configure your identity
git config --global user.name "Aaron Taylor"
git config --global user.email "a.taylor@roammigrationlaw.com"

# Verify
git --version
```

---

## Step 4: Install Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code

# Verify
claude --version
```

---

## Step 5: Authenticate Claude Code

```bash
claude
```

Claude will open a browser window for authentication. Log in with your Anthropic credentials (provided by Jackson).

Once authenticated, you'll see the Claude Code prompt. Type `exit` or press `Ctrl+C` to quit for now.

---

## Step 6: Install VS Code

1. Download VS Code from https://code.visualstudio.com (Windows installer)
2. During installation, check **"Add to PATH"** when prompted
3. Install VS Code

---

## Step 7: Connect VS Code to WSL2

1. In the Ubuntu terminal, navigate to your home directory:
   ```bash
   cd ~
   ```
2. Open VS Code from WSL:
   ```bash
   code .
   ```
3. VS Code will install the **WSL Remote extension** automatically on first launch
4. Confirm you see **"WSL: Ubuntu"** in the bottom-left corner of VS Code — this means you're running inside Linux

---

## Step 8: Install the Claude Code VS Code Extension

1. In VS Code, press `Ctrl+Shift+X` to open Extensions
2. Search for **"Claude Code"**
3. Install the official **Anthropic** extension
4. The Claude Code panel will appear in your sidebar

---

## Step 9: Clone the ECC Repository

```bash
# From the Ubuntu terminal
cd ~
mkdir projects && cd projects
git clone https://github.com/Roam-Migration/everything-claude-code.git
cd everything-claude-code

# Open in VS Code
code .
```

---

## Step 10: Run Your First Session

In the VS Code terminal (`` Ctrl+` ``):

```bash
cd ~/projects/everything-claude-code
claude
```

Claude will load the project context from `CLAUDE.md` and show your top 5 priority tasks from Notion.

Try your first prompt:
> "I'm Aaron, the CEO of Roam Migration Law. I'm setting up Claude Code for the first time. Can you confirm my Notion tasks are loading correctly and show me my training project?"

---

## Troubleshooting

### WSL2 not installing
- Ensure Windows is up to date (Settings > Windows Update)
- Enable virtualisation in BIOS if prompted
- Try: `wsl --install -d Ubuntu`

### `claude: command not found`
```bash
source ~/.bashrc
# or
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Notion not connecting
```bash
# Inside a claude session, type:
/mcp
# Follow the re-authentication prompts for Notion
```

### VS Code not showing WSL
- Close VS Code
- Open Ubuntu terminal, navigate to a folder, run `code .`
- VS Code should install WSL Remote automatically

---

## What's Next

Once setup is complete, continue with:
- **T2**: Connect Claude Code to VS Code and complete first session
- **T3**: Read Notion workspace orientation guide
- **Module 2**: Notion as mission control (first priority)

Your training project in Notion: https://www.notion.so/312e1901e36e81feb00bd5d0a6145206
