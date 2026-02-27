# Quick Start Guide

Get the Proton MCP Server running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Proton Mail Bridge running locally (IMAP on 1143, SMTP on 1025)
- Your Proton Mail credentials

## Step 1: Install Dependencies (30 seconds)

```bash
cd proton-mcp-server
npm install
```

## Step 2: Configure Credentials (1 minute)

```bash
cp .env.example .env
```

Edit `.env` with your details:

```env
PROTON_USER=your-email@protonmail.com
PROTON_PASS=your-app-password
# (other settings can stay as default)
```

## Step 3: Build (1 minute)

```bash
npm run build
```

## Step 4: Test Locally (1 minute)

Run in development mode:

```bash
npm run dev
```

You should see: `proton-mcp-server listening on stdio`

Press Ctrl+C to stop.

## Step 5: Add to Claude Settings (1 minute)

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "proton": {
      "command": "node",
      "args": ["/absolute/path/to/proton-mcp-server/dist/index.js"],
      "env": {
        "PROTON_USER": "your-email@protonmail.com",
        "PROTON_PASS": "your-app-password"
      }
    }
  }
}
```

Use the **full absolute path** (not relative).

## Done!

Restart Claude Code and you can now use:
- `proton_list_folders`
- `proton_list_emails`
- `proton_search_emails`
- `proton_read_email`
- `proton_send_email`
- `proton_reply_email`
- `proton_move_email`
- `proton_delete_email`

## Troubleshooting

### "PROTON_USER and PROTON_PASS required"
- Check `.env` file exists and has your credentials
- Restart the server after updating `.env`

### "Cannot connect to Bridge"
- Make sure Proton Bridge is running
- Test IMAP: `telnet 127.0.0.1 1143`
- Test SMTP: `telnet 127.0.0.1 1025`

### "Invalid credentials"
- Use the Bridge app-password, not your login password
- In Bridge app: hamburger menu → Credentials → Copy password

### Port 1143/1025 already in use
- Check if Bridge is running twice
- Use `lsof -i :1143` to see what's using the port

### TypeScript compilation errors
- Delete `node_modules` and `dist` folder
- Run `npm clean-install`
- Run `npm run build` again

## Next Steps

See `TOOLS_REFERENCE.md` for complete tool documentation.

See `README.md` for detailed setup and architecture info.
