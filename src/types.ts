/**
 * TypeScript types and interfaces
 */

export interface MailboxInfo {
  path: string;
  name: string;
  messageCount: number;
  unreadCount: number;
}

export interface MessageEnvelope {
  uid: number;
  from: {
    name?: string;
    email: string;
  };
  to?: {
    name?: string;
    email: string;
  }[];
  subject: string;
  date: Date;
  flags: string[];
  seen: boolean;
}

export interface MessageAttachment {
  filename: string;
  contentType: string;
  size: number;
}

export interface FullMessage {
  uid: number;
  from: {
    name?: string;
    email: string;
  };
  to?: {
    name?: string;
    email: string;
  }[];
  cc?: {
    name?: string;
    email: string;
  }[];
  bcc?: {
    name?: string;
    email: string;
  }[];
  subject: string;
  date: Date;
  textBody?: string;
  htmlBody?: string;
  attachments: MessageAttachment[];
  messageId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface SearchCriteria {
  from?: string;
  to?: string;
  subject?: string;
  since?: Date;
  before?: Date;
  body?: string;
  unseen?: boolean;
}
