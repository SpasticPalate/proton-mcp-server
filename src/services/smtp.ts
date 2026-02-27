/**
 * SMTP client wrapper for Proton Mail Bridge
 */

import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, PROTON_USER, PROTON_PASS } from '../constants.js';

interface MailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Create and return a nodemailer transporter
 */
export function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: PROTON_USER,
      pass: PROTON_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send an email via SMTP
 */
export async function sendMail(options: MailOptions): Promise<string> {
  const transporter = getTransporter();

  const mailOptions = {
    from: options.from || PROTON_USER,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
    headers: {} as Record<string, string>,
  };

  // Set threading headers if provided
  if (options.inReplyTo) {
    mailOptions.headers['In-Reply-To'] = options.inReplyTo;
  }
  if (options.references) {
    mailOptions.headers['References'] = options.references;
  }

  const result = await transporter.sendMail(mailOptions);
  return result.messageId || 'success';
}

/**
 * Send a reply to an email
 */
export async function sendReply(
  originalMessageId: string,
  originalReferences: string | undefined,
  originalSubject: string,
  replyText: string,
  replyHtml?: string
): Promise<string> {
  const references = originalReferences
    ? `${originalReferences} ${originalMessageId}`
    : originalMessageId;

  return sendMail({
    to: PROTON_USER,
    subject: `Re: ${originalSubject}`,
    text: replyText,
    html: replyHtml,
    inReplyTo: originalMessageId,
    references,
  });
}
