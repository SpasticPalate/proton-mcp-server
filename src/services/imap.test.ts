import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ImapFlow before importing the module under test
const mockMessageMove = vi.fn();
const mockFetchOne = vi.fn();
const mockMailboxOpen = vi.fn();
const mockRelease = vi.fn();
const mockGetMailboxLock = vi.fn();
const mockConnect = vi.fn();
const mockLogout = vi.fn();

vi.mock('imapflow', () => {
  return {
    ImapFlow: class MockImapFlow {
      connect = mockConnect;
      logout = mockLogout;
      mailboxOpen = mockMailboxOpen;
      getMailboxLock = mockGetMailboxLock;
      messageMove = mockMessageMove;
      fetchOne = mockFetchOne;
      constructor() {}
    },
  };
});

// Import after mocks are set up
import { moveMessage, deleteMessage, fetchMessage } from './imap.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockMailboxOpen.mockResolvedValue({ exists: 10 });
  mockConnect.mockResolvedValue(undefined);
  mockLogout.mockResolvedValue(undefined);
  mockGetMailboxLock.mockResolvedValue({ release: mockRelease });
});

describe('moveMessage', () => {
  it('calls messageMove (not move) with uid: true option', async () => {
    mockMessageMove.mockResolvedValue({ uidMap: new Map([[42, 100]]) });

    await moveMessage('INBOX', 42, '_cleanup');

    expect(mockMessageMove).toHaveBeenCalledTimes(1);
    expect(mockMessageMove).toHaveBeenCalledWith('42', '_cleanup', { uid: true });
  });

  it('passes UID as string, not number', async () => {
    mockMessageMove.mockResolvedValue({ uidMap: new Map([[99, 200]]) });

    await moveMessage('INBOX', 99, 'Archive');

    const [range] = mockMessageMove.mock.calls[0];
    expect(typeof range).toBe('string');
    expect(range).toBe('99');
  });

  it('throws when messageMove returns false (UID not found)', async () => {
    mockMessageMove.mockResolvedValue(false);

    await expect(moveMessage('INBOX', 999, '_cleanup')).rejects.toThrow(
      'Message UID 999 not found in "INBOX"'
    );
  });

  it('releases lock and logs out even on error', async () => {
    mockMessageMove.mockRejectedValue(new Error('connection lost'));

    await expect(moveMessage('INBOX', 1, 'Trash')).rejects.toThrow('connection lost');
    expect(mockRelease).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });
});

describe('deleteMessage', () => {
  it('calls messageMove to Trash with uid: true option', async () => {
    mockMessageMove.mockResolvedValue({ uidMap: new Map([[10, 50]]) });

    await deleteMessage('INBOX', 10);

    expect(mockMessageMove).toHaveBeenCalledWith('10', 'Trash', { uid: true });
  });

  it('throws when messageMove returns false (UID not found)', async () => {
    mockMessageMove.mockResolvedValue(false);

    await expect(deleteMessage('INBOX', 999)).rejects.toThrow(
      'Message UID 999 not found in "INBOX"'
    );
  });
});

describe('fetchMessage', () => {
  it('calls fetchOne with uid: true in options (third arg)', async () => {
    mockFetchOne.mockResolvedValue({
      uid: 42,
      envelope: {
        from: [{ name: 'Test', address: 'test@example.com' }],
        to: [{ name: 'Me', address: 'me@example.com' }],
        subject: 'Test',
        date: new Date(),
      },
      flags: new Set(),
      source: Buffer.from('Subject: Test\r\n\r\nHello'),
    });

    await fetchMessage('INBOX', 42);

    expect(mockFetchOne).toHaveBeenCalledTimes(1);
    const [seq, query, options] = mockFetchOne.mock.calls[0];
    expect(seq).toBe('42');
    expect(options).toEqual({ uid: true });
  });
});
