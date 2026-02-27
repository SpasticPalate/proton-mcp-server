/**
 * Tool: proton_move_email
 * Move email to another folder
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MoveEmailSchema } from '../schemas/index.js';
import { moveMessage } from '../services/imap.js';
import { z } from 'zod';

export function registerMoveEmailTool(server: McpServer) {
  server.registerTool(
    'proton_move_email',
    {
      title: 'Move Email',
      description: 'Move an email from one folder to another. Specify source folder, email UID, and destination folder.',
      inputSchema: MoveEmailSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof MoveEmailSchema>) => {
      try {
        await moveMessage(params.folder, params.uid, params.destination);

        return {
          content: [
            {
              type: 'text',
              text: `Email UID ${params.uid} moved successfully from "${params.folder}" to "${params.destination}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error moving email: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
