/**
 * Zod schemas for all MCP tool inputs
 */

import { z } from 'zod';

export const ListFoldersSchema = z.object({
  response_format: z.enum(['text', 'json']).optional().default('text'),
});

export const ListEmailsSchema = z.object({
  folder: z.string().default('INBOX'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const SearchEmailsSchema = z.object({
  folder: z.string().default('INBOX'),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  since: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
  body: z.string().optional(),
  unseen_only: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const ReadEmailSchema = z.object({
  folder: z.string().default('INBOX'),
  uid: z.number().int().positive(),
});

export const SendEmailSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),
  subject: z.string(),
  body: z.string(),
  html: z.boolean().default(false),
});

export const ReplyEmailSchema = z.object({
  folder: z.string().default('INBOX'),
  uid: z.number().int().positive(),
  body: z.string(),
  reply_all: z.boolean().default(false),
});

export const MoveEmailSchema = z.object({
  folder: z.string(),
  uid: z.number().int().positive(),
  destination: z.string(),
});

export const DeleteEmailSchema = z.object({
  folder: z.string().default('INBOX'),
  uid: z.number().int().positive(),
});
