import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable, chatMessagesTable } from '../db/schema';
import { getChatMessagesBySession } from '../handlers/get_chat_messages_by_session';
import { eq } from 'drizzle-orm';

describe('getChatMessagesBySession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all messages for a session in chronological order', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create chat session
    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userId,
        title: 'Test Chat Session'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create messages with different timestamps
    const message1 = await db.insert(chatMessagesTable)
      .values({
        session_id: sessionId,
        message_type: 'User',
        content: 'First message'
      })
      .returning()
      .execute();

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 10));

    const message2 = await db.insert(chatMessagesTable)
      .values({
        session_id: sessionId,
        message_type: 'Assistant',
        content: 'Assistant response'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const message3 = await db.insert(chatMessagesTable)
      .values({
        session_id: sessionId,
        message_type: 'User',
        content: 'Follow-up message'
      })
      .returning()
      .execute();

    // Fetch messages using handler
    const messages = await getChatMessagesBySession(sessionId);

    // Verify results
    expect(messages).toHaveLength(3);
    
    // Check chronological order
    expect(messages[0].content).toEqual('First message');
    expect(messages[0].message_type).toEqual('User');
    
    expect(messages[1].content).toEqual('Assistant response');
    expect(messages[1].message_type).toEqual('Assistant');
    
    expect(messages[2].content).toEqual('Follow-up message');
    expect(messages[2].message_type).toEqual('User');

    // Verify timestamps are in ascending order
    expect(messages[0].created_at <= messages[1].created_at).toBe(true);
    expect(messages[1].created_at <= messages[2].created_at).toBe(true);

    // Verify all messages belong to correct session
    messages.forEach(message => {
      expect(message.session_id).toEqual(sessionId);
      expect(message.id).toBeDefined();
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for non-existent session', async () => {
    const nonExistentSessionId = 999;
    
    const messages = await getChatMessagesBySession(nonExistentSessionId);
    
    expect(messages).toHaveLength(0);
    expect(Array.isArray(messages)).toBe(true);
  });

  it('should return empty array for session with no messages', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create empty chat session
    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userId,
        title: 'Empty Session'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    
    const messages = await getChatMessagesBySession(sessionId);
    
    expect(messages).toHaveLength(0);
    expect(Array.isArray(messages)).toBe(true);
  });

  it('should only return messages for the specified session', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two chat sessions
    const session1Result = await db.insert(chatSessionsTable)
      .values({
        user_id: userId,
        title: 'Session 1'
      })
      .returning()
      .execute();

    const session2Result = await db.insert(chatSessionsTable)
      .values({
        user_id: userId,
        title: 'Session 2'
      })
      .returning()
      .execute();

    const session1Id = session1Result[0].id;
    const session2Id = session2Result[0].id;

    // Create messages for session 1
    await db.insert(chatMessagesTable)
      .values({
        session_id: session1Id,
        message_type: 'User',
        content: 'Message for session 1'
      })
      .execute();

    await db.insert(chatMessagesTable)
      .values({
        session_id: session1Id,
        message_type: 'Assistant',
        content: 'Response for session 1'
      })
      .execute();

    // Create messages for session 2
    await db.insert(chatMessagesTable)
      .values({
        session_id: session2Id,
        message_type: 'User',
        content: 'Message for session 2'
      })
      .execute();

    // Fetch messages for session 1 only
    const session1Messages = await getChatMessagesBySession(session1Id);
    
    expect(session1Messages).toHaveLength(2);
    session1Messages.forEach(message => {
      expect(message.session_id).toEqual(session1Id);
      expect(message.content).toContain('session 1');
    });

    // Verify we don't get messages from other sessions
    expect(session1Messages.some(msg => msg.content.includes('session 2'))).toBe(false);
  });

  it('should handle large number of messages efficiently', async () => {
    // Create test user and session
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Large Session'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create multiple messages sequentially to guarantee order
    for (let i = 1; i <= 50; i++) {
      await db.insert(chatMessagesTable)
        .values({
          session_id: sessionId,
          message_type: i % 2 === 0 ? 'Assistant' : 'User',
          content: `Message ${i}`
        })
        .execute();
    }

    // Fetch all messages
    const messages = await getChatMessagesBySession(sessionId);
    
    expect(messages).toHaveLength(50);
    
    // Verify chronological order is maintained
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i-1].created_at <= messages[i].created_at).toBe(true);
    }

    // Verify all messages are present and ordered correctly
    messages.forEach((message, index) => {
      expect(message.content).toEqual(`Message ${index + 1}`);
      expect(message.session_id).toEqual(sessionId);
    });
  });
});