/**
 * Tool: proton_search_emails
 * Search emails with advanced criteria
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SearchEmailsSchema } from '../schemas/index.js';
import { searchMessages } from '../services/imap.js';
import type { SearchCriteria } from '../types.js';
import { z } from 'zod';

export function registerSearchEmailsTool(server: McpServer) {
  server.registerTool(
    'proton_search_emails',
    {
      title: 'Search Emails',
      description: 'Search emails by sender, recipient, subject, date range, body content, or unread status. Multiple criteria are combined with AND logic.',
      inputSchema: SearchEmailsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof SearchEmailsSchema>) => {
      try {
        const criteria: SearchCriteria = {
          from: params.from,
          to: params.to,
          subject: params.subject,
          body: params.body,
          unseen: params.unseen_only,
        };

        // Parse ISO date strings to Date objects
        if (params.since) {
          criteria.since = new Date(params.since);
        }
        if (params.before) {
          criteria.before = new Date(params.before);
        }

        const messages = await searchMessages(params.folder, criteria, params.limit, params.offset);

        if (messages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No messages found matching the search criteria.',
              },
            ],
          };
        }

        // Format as markdown table
        let result = `**Folder:** ${params.folder}\n`;
        result += '**Search Criteria:**\n';
        if (params.from) result += `- From: ${params.from}\n`;
        if (params.to) result += `- To: ${params.to}\n`;
        if (params.subject) result += `- Subject: ${params.subject}\n`;
        if (params.body) result += `- Body contains: ${params.body}\n`;
        if (params.since) result += `- Since: ${params.since}\n`;
        if (params.before) result += `- Before: ${params.before}\n`;
        if (params.unseen_only) result += `- Unread only: yes\n`;
        result += `\n**Results:** ${messages.length} message(s)\n\n`;

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
              text: `Error searching emails: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
