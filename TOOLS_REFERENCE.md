# Proton MCP Tools Reference

Complete reference for all 8 available tools.

## proton_list_folders

List all mailbox folders with message and unread counts.

**Type:** Read-Only

**Parameters:**
- `response_format` (optional): `"text"` (default) or `"json"`

**Example Usage:**
```
proton_list_folders()
```

**Output Format (text):**
```
| Folder | Messages | Unread |
|--------|----------|--------|
| INBOX  | 245      | 12     |
| Sent   | 1203     | 0      |
| Drafts | 5        | 0      |
| Trash  | 48       | 0      |
```

**Output Format (JSON):**
```json
[
  {
    "path": "INBOX",
    "name": "INBOX",
    "messageCount": 245,
    "unreadCount": 12
  }
]
```

---

## proton_list_emails

List emails in a folder with pagination (newest first).

**Type:** Read-Only

**Parameters:**
- `folder` (default: `"INBOX"`): Mailbox folder name
- `limit` (default: `20`, min: 1, max: 100): Number of emails per page
- `offset` (default: `0`, min: 0): Number of emails to skip

**Example Usage:**
```
proton_list_emails({
  folder: "INBOX",
  limit: 20,
  offset: 0
})
```

**Output:**
```
**Folder:** INBOX
**Page:** offset=0, limit=20

| UID | From | Subject | Date | Read |
|-----|------|---------|------|------|
| 456 | John Smith | Meeting Notes | 2025-02-27 | ✓ |
| 455 | Sarah Jones | Project Update | 2025-02-26 | ✗ |
```

---

## proton_search_emails

Advanced search with multiple filter criteria combined with AND logic.

**Type:** Read-Only

**Parameters:**
- `folder` (default: `"INBOX"`): Mailbox folder to search
- `from` (optional): Sender email address or name
- `to` (optional): Recipient email address
- `subject` (optional): Subject line keywords
- `since` (optional): ISO 8601 datetime string (e.g., `"2025-02-01T00:00:00Z"`)
- `before` (optional): ISO 8601 datetime string
- `body` (optional): Keywords to find in message body
- `unseen_only` (default: `false`): Only unread messages
- `limit` (default: `20`, min: 1, max: 100): Results per page
- `offset` (default: `0`): Pagination offset

**Example Usage:**
```
proton_search_emails({
  folder: "INBOX",
  from: "boss@company.com",
  subject: "urgent",
  unseen_only: true,
  limit: 10
})
```

**Output:**
```
**Folder:** INBOX
**Search Criteria:**
- From: boss@company.com
- Subject: urgent
- Unread only: yes

**Results:** 2 message(s)

| UID | From | Subject | Date | Read |
|-----|------|---------|------|------|
| 450 | Boss | Urgent Meeting | 2025-02-27 | ✗ |
```

---

## proton_read_email

Read the complete content of an email including headers, body, and attachments.

**Type:** Read-Only

**Parameters:**
- `folder` (default: `"INBOX"`): Mailbox folder
- `uid` (required): Unique email identifier (use UID from list_emails)

**Example Usage:**
```
proton_read_email({
  folder: "INBOX",
  uid: 450
})
```

**Output:**
```
**From:** Boss <boss@company.com>
**To:** You <your-email@protonmail.com>
**Subject:** Urgent Meeting
**Date:** 2025-02-27T14:30:00.000Z
**Message-ID:** <abc123@company.com>

---

Please attend the emergency meeting at 3 PM today.
Conference room B.

---

**Attachments:**
- agenda.pdf (application/pdf, 245.3 KB)
- notes.txt (text/plain, 12.5 KB)
```

---

## proton_send_email

Send a new email (not a reply).

**Type:** Write

**Parameters:**
- `to` (required): Recipient(s) - string or array of strings
- `cc` (optional): CC recipient(s) - string or array
- `bcc` (optional): BCC recipient(s) - string or array
- `subject` (required): Email subject line
- `body` (required): Email body content
- `html` (default: `false`): `true` if body is HTML, `false` if plain text

**Example Usage:**
```
proton_send_email({
  to: ["alice@example.com", "bob@example.com"],
  cc: "manager@example.com",
  subject: "Project Update",
  body: "The project is on track for completion by Friday.",
  html: false
})
```

**Output:**
```
Email sent successfully!
Message ID: <msg-20250227-001@protonmail.com>
To: alice@example.com, bob@example.com
Subject: Project Update
```

---

## proton_reply_email

Send a reply to an existing email with proper threading headers.

**Type:** Write

**Parameters:**
- `folder` (default: `"INBOX"`): Folder containing the original email
- `uid` (required): UID of the email to reply to
- `body` (required): Reply message body
- `reply_all` (default: `false`): `true` to reply to all, `false` to reply only to sender

**Example Usage:**
```
proton_reply_email({
  folder: "INBOX",
  uid: 450,
  body: "Sounds good. I'll be there at 3 PM.",
  reply_all: false
})
```

**Output:**
```
Reply sent successfully!
Message ID: <msg-20250227-002@protonmail.com>
To: boss@company.com
Original Subject: Urgent Meeting
```

---

## proton_move_email

Move an email from one folder to another.

**Type:** Write

**Parameters:**
- `folder` (required): Source folder name
- `uid` (required): Email UID to move
- `destination` (required): Target folder name

**Example Usage:**
```
proton_move_email({
  folder: "INBOX",
  uid: 450,
  destination: "Archive"
})
```

**Output:**
```
Email UID 450 moved successfully from "INBOX" to "Archive"
```

---

## proton_delete_email

Delete an email by moving it to the Trash folder.

**Type:** Write (Destructive)

**Parameters:**
- `folder` (default: `"INBOX"`): Folder containing the email
- `uid` (required): Email UID to delete

**Example Usage:**
```
proton_delete_email({
  folder: "INBOX",
  uid: 450
})
```

**Output:**
```
Email UID 450 deleted successfully (moved to Trash)
```

---

## Common Folder Names

Standard Proton Mail Bridge folder names:
- `INBOX` - Incoming messages
- `Sent` - Sent messages
- `Drafts` - Draft messages
- `Trash` - Deleted messages
- `Spam` - Spam/Junk messages
- `Archive` - Archived messages
- Custom folders - User-created folders

List folders with `proton_list_folders` to see your actual folder structure.

## Tips & Best Practices

### Email UIDs
- UIDs are unique identifiers within a folder
- Always specify the folder when using UIDs
- Get UIDs from `list_emails` or `search_emails`
- Don't assume UIDs are sequential or stable

### Pagination
- Use `offset` and `limit` for large result sets
- Default limit is 20, max is 100
- Results are always newest first
- Calculate pages with: `total_results / limit`

### Searching
- Multiple criteria are combined with AND logic
- Date filters use ISO 8601 format: `"2025-02-27T00:00:00Z"`
- Body search may be slower on large mailboxes
- Unread-only search is faster than full search

### Replying
- Always use `proton_reply_email` for replies (not `send_email`)
- This ensures proper email threading
- Set `reply_all: true` to include CC recipients
- Original Message-ID is automatically included

### Error Handling
- If a folder doesn't exist, you'll get an error
- Check folder names with `list_folders` first
- Network issues may cause temporary failures
- Invalid UIDs will return "message not found" errors

### Rate Limiting
- No official rate limits, but be reasonable
- Large bulk operations may be slow
- Proton Bridge has local rate limits
- Test with small batches first
