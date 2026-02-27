/**
 * Tool: proton_reply_email
 * Send a reply to an existing email
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReplyEmailSchema } from '../schemas/index.js';
import { fetchMessage } from '../services/imap.js';
import { sendMail } from '../services/smtp.js';
import { PROTON_USER } from '../constants.js';
import { z } from 'zod';

export function registerReplyEmailTool(server: McpServer) {
  server.registerTool(
    'proton_reply_email',
    {
      title: 'Reply to Email',
      description: 'Send a reply to an existing email. Properly sets In-Reply-To and References headers for threading. Can reply to all or just the sender.',
      inputSchema: ReplyEmailSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof ReplyEmailSchema>) => {
      try {
        // Fetch the original message to get Message-ID and thread info
        const original = await fetchMessage(params.folder, params.uid);

        // Build recipient list
        let replyTo: string[] = [];

        if (params.reply_all) {
          // Reply to all: sender + cc recipients (exclude self)
          if (original.from.email && original.from.email !== PROTON_USER) {
            replyTo.push(original.from.email);
          }

          if (original.cc && original.cc.length > 0) {
            for (const cc of original.cc) {
              if (cc.email && cc.email !== PROTON_USER) {
                replyTo.push(cc.email);
              }
            }
          }
        } else {
          // Reply to just the sender
          if (original.from.email) {
            replyTo.push(original.from.email);
          }
        }

        if (replyTo.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: No valid recipients found for reply.',
              },
            ],
          };
        }

        // Send reply with threading headers
        const messageId = await sendMail({
          from: PROTON_USER,
          to: replyTo,
          subject: original.subject.startsWith('Re: ')
            ? original.subject
            : `Re: ${original.subject}`,
          text: params.body,
          inReplyTo: original.messageId,
          references: original.references,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Reply sent successfully!\nMessage ID: ${messageId}\nTo: ${replyTo.join(', ')}\nOriginal Subject: ${original.subject}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error sending reply: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
