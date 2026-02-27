/**
 * Constants for Proton Mail Bridge integration
 */

export const IMAP_HOST = process.env.PROTON_IMAP_HOST || '127.0.0.1';
export const IMAP_PORT = parseInt(process.env.PROTON_IMAP_PORT || '1143', 10);
export const SMTP_HOST = process.env.PROTON_SMTP_HOST || '127.0.0.1';
export const SMTP_PORT = parseInt(process.env.PROTON_SMTP_PORT || '1025', 10);
export const PROTON_USER = process.env.PROTON_USER || '';
export const PROTON_PASS = process.env.PROTON_PASS || '';

export const CHARACTER_LIMIT = 25000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
