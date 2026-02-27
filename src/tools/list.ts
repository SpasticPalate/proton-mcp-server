/**
 * Tool: proton_list_emails
 * List emails in a folder with pagination
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListEmailsSchema } from '../schemas/index.js';
import { listMessages } from '../services/imap.js';
import { z } from 'zod';

export function registerListEmailsTool(server: McpServer) {
  server.registerTool(
    'proton_list_emails',
    {
      title: 'List Emails in Folder',
      description: 'List emails in a specific folder with pagination. Shows sender, subject, date, and read status. Results are newest first.',
      inputSchema: ListEmailsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof ListEmailsSchema>) => {
      try {
        const messages = await listMessages(params.folder, params.limit, params.offset);

        if (messages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No messages found in this folder.',
              },
            ],
          };
        }

        // Format as markdown table
        let result = `**Folder:** ${params.folder}\n`;
        result += `**Page:** offset=${params.offset}, limit=${params.limit}\n\n`;
        result += '| UID | From | Subject | Date | Read |\n';
        result += '|-----|------|---------|------|------|\n';

        for (const msg of messages) {
          const fromName = msg.from.name || msg.from.email;
          const subject = msg.subject.substring(0, 40);
          const date = msg.date.toISOString().split('T')[0];
          const readStatus = msg.seen ? '✓' : '✗';

          result += `| ${msg.uid} | ${fromName} | ${subject} | ${date} | ${readStatus} |\n`;
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
              text: `Error listing emails: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
