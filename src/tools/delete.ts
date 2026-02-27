/**
 * Tool: proton_delete_email
 * Delete email by moving to Trash
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DeleteEmailSchema } from '../schemas/index.js';
import { deleteMessage } from '../services/imap.js';
import { z } from 'zod';

export function registerDeleteEmailTool(server: McpServer) {
  server.registerTool(
    'proton_delete_email',
    {
      title: 'Delete Email',
      description: 'Delete an email by moving it to the Trash folder. Use the folder name and email UID.',
      inputSchema: DeleteEmailSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: z.infer<typeof DeleteEmailSchema>) => {
      try {
        await deleteMessage(params.folder, params.uid);

        return {
          content: [
            {
              type: 'text',
              text: `Email UID ${params.uid} deleted successfully (moved to Trash)`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting email: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
