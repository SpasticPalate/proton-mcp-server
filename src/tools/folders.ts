/**
 * Tool: proton_list_folders
 * List all mailbox folders
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListFoldersSchema } from '../schemas/index.js';
import { listMailboxes } from '../services/imap.js';
import { z } from 'zod';

export function registerListFoldersTool(server: McpServer) {
  server.registerTool(
    'proton_list_folders',
    {
      title: 'List Proton Mail Folders',
      description: 'List all mailbox folders (INBOX, Sent, Drafts, Trash, etc.) with message counts and unread counts',
      inputSchema: ListFoldersSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof ListFoldersSchema>) => {
      try {
        const folders = await listMailboxes();

        if (params.response_format === 'json') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(folders, null, 2),
              },
            ],
          };
        }

        // Format as markdown table
        let result = '| Folder | Messages | Unread |\n';
        result += '|--------|----------|--------|\n';

        for (const folder of folders) {
          const name = folder.name || folder.path;
          result += `| ${name} | ${folder.messageCount} | ${folder.unreadCount} |\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error listing folders: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
