/**
 * IMAP client wrapper for Proton Mail Bridge
 */

import { ImapFlow } from 'imapflow';
import { IMAP_HOST, IMAP_PORT, PROTON_USER, PROTON_PASS } from '../constants.js';
import type { MailboxInfo, MessageEnvelope, FullMessage, SearchCriteria } from '../types.js';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';

/**
 * Create and return a connected IMAP client
 */
export async function getImapClient(): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: false,
    auth: {
      user: PROTON_USER,
      pass: PROTON_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    logger: false,
  });

  await client.connect();
  return client;
}

/**
 * List all mailboxes/folders
 */
export async function listMailboxes(): Promise<MailboxInfo[]> {
  const client = await getImapClient();
  try {
    const mailboxes = await client.list();
    const folders: MailboxInfo[] = [];

    for (const mailbox of mailboxes) {
      const status = await client.status(mailbox.path, {
        messages: true,
        unseen: true,
      });

      folders.push({
        path: mailbox.path,
        name: mailbox.name,
        messageCount: status.messages || 0,
        unreadCount: status.unseen || 0,
      });
    }

    return folders;
  } finally {
    await client.logout();
  }
}

/**
 * List messages in a folder with pagination
 */
export async function listMessages(
  folder: string,
  limit: number,
  offset: number
): Promise<MessageEnvelope[]> {
  const client = await getImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      // Get total message count
      const mailbox = await client.mailboxOpen(folder);
      const totalMessages = mailbox.exists || 0;

      // Calculate range for pagination
      const start = Math.max(1, totalMessages - offset - limit + 1);
      const end = Math.max(1, totalMessages - offset);

      if (start > end) {
        return [];
      }

      const messages: MessageEnvelope[] = [];
      const fetchQuery = await client.fetch(`${start}:${end}`, {
        envelope: true,
        uid: true,
        flags: true,
      });

      for await (const msg of fetchQuery) {
        if (msg.envelope) {
          const from = msg.envelope.from?.[0];
          const to = msg.envelope.to;

          messages.push({
            uid: msg.uid as number,
            from: {
              name: from?.name || undefined,
              email: from?.address || '',
            },
            to: to?.map(t => ({
              name: t.name || undefined,
              email: t.address || '',
            })),
            subject: msg.envelope.subject || '(no subject)',
            date: msg.envelope.date || new Date(),
            flags: Array.from(msg.flags || []).map(f => String(f)),
            seen: msg.flags.has('\\Seen'),
          });
        }
      }

      // Reverse to show newest first
      return messages.reverse();
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

/**
 * Search messages in a folder with criteria
 */
export async function searchMessages(
  folder: string,
  criteria: SearchCriteria,
  limit: number,
  offset: number
): Promise<MessageEnvelope[]> {
  const client = await getImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const mailbox = await client.mailboxOpen(folder);

      // Build search criteria
      const searchCriteria: any[] = [];

      if (criteria.unseen) {
        searchCriteria.push('UNSEEN');
      }
      if (criteria.from) {
        searchCriteria.push(['FROM', criteria.from]);
      }
      if (criteria.to) {
        searchCriteria.push(['TO', criteria.to]);
      }
      if (criteria.subject) {
        searchCriteria.push(['SUBJECT', criteria.subject]);
      }
      if (criteria.body) {
        searchCriteria.push(['BODY', criteria.body]);
      }
      if (criteria.since) {
        searchCriteria.push(['SINCE', criteria.since]);
      }
      if (criteria.before) {
        searchCriteria.push(['BEFORE', criteria.before]);
      }

      // If no criteria, just return empty
      if (searchCriteria.length === 0) {
        searchCriteria.push('ALL');
      }

      const uids = await client.search(searchCriteria);
      if (!uids || uids.length === 0) {
        return [];
      }

      const messages: MessageEnvelope[] = [];

      // Apply pagination
      const start = Math.max(0, uids.length - offset - limit);
      const end = Math.max(0, uids.length - offset);
      const paginatedUids = uids.slice(start, end);

      const fetchQuery = await client.fetch(paginatedUids.join(','), {
        envelope: true,
        uid: true,
        flags: true,
      });

      for await (const msg of fetchQuery) {
        if (msg.envelope) {
          const from = msg.envelope.from?.[0];
          const to = msg.envelope.to;

          messages.push({
            uid: msg.uid as number,
            from: {
              name: from?.name || undefined,
              email: from?.address || '',
            },
            to: to?.map(t => ({
              name: t.name || undefined,
              email: t.address || '',
            })),
            subject: msg.envelope.subject || '(no subject)',
            date: msg.envelope.date || new Date(),
            flags: Array.from(msg.flags || []).map(f => String(f)),
            seen: msg.flags.has('\\Seen'),
          });
        }
      }

      return messages.reverse();
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

/**
 * Fetch full message content
 */
export async function fetchMessage(folder: string, uid: number): Promise<FullMessage> {
  const client = await getImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.mailboxOpen(folder);

      const message = await client.fetchOne(String(uid), {
        envelope: true,
        source: true,
        uid: true,
        flags: true,
      }, { uid: true });

      if (!message) {
        throw new Error(`Message with UID ${uid} not found`);
      }

      // Parse the message source
      let textBody: string | undefined;
      let htmlBody: string | undefined;
      const attachments: Array<{
        filename: string;
        contentType: string;
        size: number;
      }> = [];

      if (message.source) {
        const parsed = await simpleParser(message.source);

        textBody = parsed.text;
        htmlBody = parsed.html || undefined;

        if (parsed.attachments) {
          for (const attachment of parsed.attachments) {
            attachments.push({
              filename: attachment.filename || 'unknown',
              contentType: attachment.contentType || 'application/octet-stream',
              size: attachment.size || 0,
            });
          }
        }
      }

      const envelope = message.envelope;
      const from = envelope?.from?.[0];
      const to = envelope?.to;
      const cc = envelope?.cc;
      const bcc = envelope?.bcc;

      return {
        uid: message.uid as number,
        from: {
          name: from?.name || undefined,
          email: from?.address || '',
        },
        to: to?.map(t => ({
          name: t.name || undefined,
          email: t.address || '',
        })),
        cc: cc?.map(c => ({
          name: c.name || undefined,
          email: c.address || '',
        })),
        bcc: bcc?.map(b => ({
          name: b.name || undefined,
          email: b.address || '',
        })),
        subject: envelope?.subject || '(no subject)',
        date: envelope?.date || new Date(),
        textBody,
        htmlBody,
        attachments,
        messageId: envelope?.messageId || undefined,
        inReplyTo: envelope?.inReplyTo || undefined,
        references: envelope?.references ? envelope.references.join(' ') : undefined,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

/**
 * Move message to another folder
 */
export async function moveMessage(
  sourceFolder: string,
  uid: number,
  destinationFolder: string
): Promise<void> {
  const client = await getImapClient();
  try {
    const lock = await client.getMailboxLock(sourceFolder);
    try {
      await client.mailboxOpen(sourceFolder);
      const result = await client.messageMove(String(uid), destinationFolder, { uid: true });
      if (!result) {
        throw new Error(`Message UID ${uid} not found in "${sourceFolder}"`);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

/**
 * Delete message (move to Trash)
 */
export async function deleteMessage(folder: string, uid: number): Promise<void> {
  const client = await getImapClient();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.mailboxOpen(folder);
      const result = await client.messageMove(String(uid), 'Trash', { uid: true });
      if (!result) {
        throw new Error(`Message UID ${uid} not found in "${folder}"`);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
