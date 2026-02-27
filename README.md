# Proton MCP Server

A complete TypeScript Model Context Protocol (MCP) server for Proton Mail integration via Proton Mail Bridge.

## What This Does

This MCP server provides full email management capabilities through Claude Code by connecting to Proton Mail Bridge running locally. It allows you to:

- List and browse mailbox folders
- List, search, and read emails
- Send new emails and replies
- Move and delete emails
- Access full message content with attachments

## Prerequisites

1. **Proton Mail Bridge** running and accessible on localhost:
   - IMAP server on port 1143 (STARTTLS)
   - SMTP server on port 1025 (STARTTLS)
2. **Node.js** 18 or higher
3. A valid Proton Mail account with Bridge credentials

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the environment template and add your Proton credentials:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PROTON_IMAP_HOST=127.0.0.1
PROTON_IMAP_PORT=1143
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_USER=your-proton-email@protonmail.com
PROTON_PASS=your-bridge-password
```

### 3. Build

```bash
npm run build
```

### 4. Run Locally (Development)

```bash
npm run dev
```

Or run the compiled version:

```bash
npm start
```

## Usage with Claude Code

Add this MCP server to your Claude settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "proton": {
      "command": "node",
      "args": ["/path/to/proton-mcp-server/dist/index.js"],
      "env": {
        "PROTON_USER": "your-email@protonmail.com",
        "PROTON_PASS": "your-bridge-password",
        "PROTON_IMAP_HOST": "127.0.0.1",
        "PROTON_IMAP_PORT": "1143",
        "PROTON_SMTP_HOST": "127.0.0.1",
        "PROTON_SMTP_PORT": "1025"
      }
    }
  }
}
```

Or with TypeScript/tsx:

```json
{
  "mcpServers": {
    "proton": {
      "command": "npx",
      "args": ["tsx", "/path/to/proton-mcp-server/src/index.ts"]
    }
  }
}
```

## Available Tools

### Reading Tools (Read-Only)

- **proton_list_folders** — List all mailbox folders with message and unread counts
- **proton_list_emails** — List emails in a folder with pagination (newest first)
- **proton_search_emails** — Advanced search with filters (from, to, subject, date range, body content, unread status)
- **proton_read_email** — Read the complete email content including headers, body, and attachment list

### Writing Tools

- **proton_send_email** — Send a new email (plain text or HTML)
- **proton_reply_email** — Reply to an email with proper threading headers
- **proton_move_email** — Move email to another folder
- **proton_delete_email** — Delete email (move to Trash)

## Project Structure

```
proton-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── constants.ts          # Configuration constants
│   ├── types.ts              # TypeScript interfaces
│   ├── schemas/
│   │   └── index.ts          # Zod input schemas
│   ├── services/
│   │   ├── imap.ts           # IMAP client wrapper
│   │   └── smtp.ts           # SMTP client wrapper
│   └── tools/
│       ├── folders.ts        # proton_list_folders
│       ├── list.ts           # proton_list_emails
│       ├── search.ts         # proton_search_emails
│       ├── read.ts           # proton_read_email
│       ├── send.ts           # proton_send_email
│       ├── reply.ts          # proton_reply_email
│       ├── move.ts           # proton_move_email
│       └── delete.ts         # proton_delete_email
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md (this file)
```

## Implementation Notes

### IMAP Connection
- Uses `imapflow` library with STARTTLS on port 1143
- Proton Bridge uses self-signed certificates, so `tls.rejectUnauthorized: false`
- All connections are properly closed with `logout()` in finally blocks

### SMTP Connection
- Uses `nodemailer` with STARTTLS on port 1025
- Supports plain text and HTML email bodies
- Properly sets `In-Reply-To` and `References` headers for email threading

### Message Parsing
- Uses `mailparser` to extract full message content
- Supports text, HTML, and attachment handling
- Returns attachment metadata (filename, content type, size)

### Pagination
- Email list pagination uses offset and limit parameters
- Results are always newest first
- Search results also support pagination

## Troubleshooting

### Connection Issues
- Ensure Proton Mail Bridge is running: `protonmail-bridge --cli`
- Check localhost connectivity: `telnet 127.0.0.1 1143` (IMAP) and `1025` (SMTP)
- Verify credentials in `.env` file

### Email Issues
- Some email clients may not recognize replies without proper Message-ID headers
- HTML emails are parsed to text; use the raw HTML body for better formatting
- Large attachments may take time to process

### Build Issues
- Ensure Node.js 18+ is installed: `node --version`
- Clear node_modules and reinstall: `npm clean-install`
- Check TypeScript compilation: `npm run build`

## Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol implementation
- `imapflow` — IMAP client for email reading
- `nodemailer` — SMTP client for sending emails
- `mailparser` — Email parsing and content extraction
- `zod` — Input validation schemas
- `dotenv` — Environment variable loading

## License

MIT

## Support

For issues with Proton Mail Bridge, see: https://proton.me/support/bridge

For MCP protocol documentation, see: https://modelcontextprotocol.io
