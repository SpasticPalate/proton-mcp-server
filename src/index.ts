/**
 * Proton Mail Bridge MCP Server
 * Main entry point with stdio transport
 */

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PROTON_USER, PROTON_PASS } from './constants.js';

// Import tool registrars
import { registerListFoldersTool } from './tools/folders.js';
import { registerListEmailsTool } from './tools/list.js';
import { registerSearchEmailsTool } from './tools/search.js';
import { registerReadEmailTool } from './tools/read.js';
import { registerSendEmailTool } from './tools/send.js';
import { registerReplyEmailTool } from './tools/reply.js';
import { registerMoveEmailTool } from './tools/move.js';
import { registerDeleteEmailTool } from './tools/delete.js';

// Validate required environment variables
if (!PROTON_USER || !PROTON_PASS) {
  console.error('ERROR: PROTON_USER and PROTON_PASS environment variables are required');
  process.exit(1);
}

// Create MCP server instance
const server = new McpServer({
  name: 'proton-mcp-server',
  version: '1.0.0',
});

// Register all tools
registerListFoldersTool(server);
registerListEmailsTool(server);
registerSearchEmailsTool(server);
registerReadEmailTool(server);
registerSendEmailTool(server);
registerReplyEmailTool(server);
registerMoveEmailTool(server);
registerDeleteEmailTool(server);

/**
 * Main entry point
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('proton-mcp-server listening on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
