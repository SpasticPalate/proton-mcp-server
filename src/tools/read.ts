/**
 * Tool: proton_read_email
 * Read full email content with headers and attachments
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReadEmailSchema } from '../schemas/index.js';
import { fetchMessage } from '../services/imap.js';
import { z } from 'zod';

export function registerReadEmailTool(server: McpServer) {
  server.registerTool(
    'proton_read_email',
    {
      title: 'Read Full Email',
      description: 'Read the complete content of an email, including headers, body, and attachments. Specify folder and email UID.',
      inputSchema: ReadEmailSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof ReadEmailSchema>) => {
      try {
        const message = await fetchMessage(params.folder, params.uid);

        // Format email content
        let result = `**From:** ${message.from.name || message.from.email} <${message.from.email}>\n`;
        
        if (message.to && message.to.length > 0) {
          const toList = message.to
            .map(t => `${t.name || t.email} <${t.email}>`)
            .join(', ');
          result += `**To:** ${toList}\n`;
        }

        if (message.cc && message.cc.length > 0) {
          const ccList = message.cc
            .map(c => `${c.name || c.email} <${c.email}>`)
            .join(', ');
          result += `**CC:** ${ccList}\n`;
        }

        result += `**Subject:** ${message.subject}\n`;
        result += `**Date:** ${message.date.toISOString()}\n`;

        if (message.messageId) {
          result += `**Message-ID:** ${message.messageId}\n`;
        }

        if (message.inReplyTo) {
          result += `**In-Reply-To:** ${message.inReplyTo}\n`;
        }

        result += '\n---\n\n';

        // Add body
        if (message.textBody) {
          result += message.textBody;
        } else if (message.htmlBody) {
          result += `[HTML Body]\n${message.htmlBody}`;
        } else {
          result += '[No message body]';
        }

        // Add attachments section
        if (message.attachments && message.attachments.length > 0) {
          result += '\n\n---\n\n**Attachments:**\n';
          for (const attachment of message.attachments) {
            const size = formatBytes(attachment.size);
            result += `- ${attachment.filename} (${attachment.contentType}, ${size})\n`;
          }
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
              text: `Error reading email: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
