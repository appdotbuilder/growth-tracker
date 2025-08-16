import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable } from '../db/schema';
import { getChatSessionsByUser } from '../handlers/get_chat_sessions_by_user';
import { eq } from 'drizzle-orm';

describe('getChatSessionsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no chat sessions', async () => {
    // Create a user first
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    const result = await getChatSessionsByUser(user.id);

    expect(result).toEqual([]);
  });

  it('should return all chat sessions for a specific user', async () => {
    // Create users
    const [user1, user2] = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          first_name: 'User',
          last_name: 'One',
          role: 'Employee'
        },
        {
          email: 'user2@example.com',
          first_name: 'User',
          last_name: 'Two',
          role: 'Employee'
        }
      ])
      .returning()
      .execute();

    // Create chat sessions for both users
    const [session1, session2, session3] = await db.insert(chatSessionsTable)
      .values([
        {
          user_id: user1.id,
          title: 'First Session'
        },
        {
          user_id: user1.id,
          title: 'Second Session'
        },
        {
          user_id: user2.id,
          title: 'Other User Session'
        }
      ])
      .returning()
      .execute();

    const result = await getChatSessionsByUser(user1.id);

    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toContain(session1.id);
    expect(result.map(s => s.id)).toContain(session2.id);
    expect(result.map(s => s.id)).not.toContain(session3.id);
  });

  it('should order sessions by updated_at descending (most recent first)', async () => {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    // Create sessions with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const [oldestSession] = await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'Oldest Session'
      })
      .returning()
      .execute();

    // Manually update timestamps to control order
    await db.update(chatSessionsTable)
      .set({ updated_at: twoDaysAgo })
      .where(eq(chatSessionsTable.id, oldestSession.id))
      .execute();

    const [middleSession] = await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'Middle Session'
      })
      .returning()
      .execute();

    await db.update(chatSessionsTable)
      .set({ updated_at: oneHourAgo })
      .where(eq(chatSessionsTable.id, middleSession.id))
      .execute();

    const [newestSession] = await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'Newest Session'
      })
      .returning()
      .execute();

    await db.update(chatSessionsTable)
      .set({ updated_at: now })
      .where(eq(chatSessionsTable.id, newestSession.id))
      .execute();

    const result = await getChatSessionsByUser(user.id);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(newestSession.id);
    expect(result[1].id).toBe(middleSession.id);
    expect(result[2].id).toBe(oldestSession.id);
    
    // Verify timestamps are in descending order
    expect(result[0].updated_at.getTime()).toBeGreaterThan(result[1].updated_at.getTime());
    expect(result[1].updated_at.getTime()).toBeGreaterThan(result[2].updated_at.getTime());
  });

  it('should return sessions with all required fields', async () => {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    // Create a session with title
    await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'Test Session'
      })
      .returning()
      .execute();

    // Create a session without title (nullable)
    await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: null
      })
      .returning()
      .execute();

    const result = await getChatSessionsByUser(user.id);

    expect(result).toHaveLength(2);
    
    result.forEach(session => {
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('number');
      expect(session.user_id).toBe(user.id);
      expect(session.created_at).toBeInstanceOf(Date);
      expect(session.updated_at).toBeInstanceOf(Date);
      // title can be string or null
      expect(typeof session.title === 'string' || session.title === null).toBe(true);
    });

    // Verify one has title and one doesn't
    const withTitle = result.find(s => s.title === 'Test Session');
    const withoutTitle = result.find(s => s.title === null);
    
    expect(withTitle).toBeDefined();
    expect(withoutTitle).toBeDefined();
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 99999;

    const result = await getChatSessionsByUser(nonExistentUserId);

    expect(result).toEqual([]);
  });
});