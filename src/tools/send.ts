/**
 * Tool: proton_send_email
 * Send a new email via SMTP
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SendEmailSchema } from '../schemas/index.js';
import { sendMail } from '../services/smtp.js';
import { PROTON_USER } from '../constants.js';
import { z } from 'zod';

export function registerSendEmailTool(server: McpServer) {
  server.registerTool(
    'proton_send_email',
    {
      title: 'Send Email',
      description: 'Send a new email. Supports plain text and HTML formats. Recipients can be a single string or array of strings.',
      inputSchema: SendEmailSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof SendEmailSchema>) => {
      try {
        // Ensure to, cc, bcc are arrays
        const toArray = Array.isArray(params.to) ? params.to : [params.to];
        const ccArray = params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined;
        const bccArray = params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : undefined;

        const messageId = await sendMail({
          from: PROTON_USER,
          to: toArray,
          cc: ccArray,
          bcc: bccArray,
          subject: params.subject,
          text: !params.html ? params.body : undefined,
          html: params.html ? params.body : undefined,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Email sent successfully!\nMessage ID: ${messageId}\nTo: ${toArray.join(', ')}\nSubject: ${params.subject}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error sending email: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
