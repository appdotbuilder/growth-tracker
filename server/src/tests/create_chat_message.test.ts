import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatMessagesTable, chatSessionsTable, usersTable } from '../db/schema';
import { type CreateChatMessageInput } from '../schema';
import { createChatMessage } from '../handlers/create_chat_message';
import { eq } from 'drizzle-orm';

describe('createChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'Employee'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestSession = async (userId: number) => {
    const result = await db.insert(chatSessionsTable)
      .values({
        user_id: userId,
        title: 'Test Chat Session'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a user message', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    const input: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'User',
      content: 'Hello, this is a test message'
    };

    const result = await createChatMessage(input);

    // Verify the returned message
    expect(result.id).toBeDefined();
    expect(result.session_id).toBe(session.id);
    expect(result.message_type).toBe('User');
    expect(result.content).toBe('Hello, this is a test message');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an assistant message', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    const input: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'Assistant',
      content: 'Hello! How can I help you today?'
    };

    const result = await createChatMessage(input);

    // Verify the returned message
    expect(result.id).toBeDefined();
    expect(result.session_id).toBe(session.id);
    expect(result.message_type).toBe('Assistant');
    expect(result.content).toBe('Hello! How can I help you today?');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    const input: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'User',
      content: 'Test database persistence'
    };

    const result = await createChatMessage(input);

    // Query the database to verify the message was saved
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].session_id).toBe(session.id);
    expect(messages[0].message_type).toBe('User');
    expect(messages[0].content).toBe('Test database persistence');
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple messages in same session', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    const userMessage: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'User',
      content: 'What are my current goals?'
    };

    const assistantMessage: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'Assistant',
      content: 'Let me help you find your current goals.'
    };

    const userResult = await createChatMessage(userMessage);
    const assistantResult = await createChatMessage(assistantMessage);

    // Verify both messages were created with different IDs
    expect(userResult.id).not.toBe(assistantResult.id);
    expect(userResult.session_id).toBe(session.id);
    expect(assistantResult.session_id).toBe(session.id);

    // Verify both messages exist in database
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, session.id))
      .execute();

    expect(messages).toHaveLength(2);
    
    const userMsg = messages.find(m => m.message_type === 'User');
    const assistantMsg = messages.find(m => m.message_type === 'Assistant');
    
    expect(userMsg?.content).toBe('What are my current goals?');
    expect(assistantMsg?.content).toBe('Let me help you find your current goals.');
  });

  it('should handle long message content', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    const longContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50);

    const input: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'User',
      content: longContent
    };

    const result = await createChatMessage(input);

    expect(result.content).toBe(longContent);
    expect(result.content.length).toBeGreaterThan(1000);
  });

  it('should throw error when session does not exist', async () => {
    const input: CreateChatMessageInput = {
      session_id: 99999, // Non-existent session ID
      message_type: 'User',
      content: 'This should fail'
    };

    await expect(createChatMessage(input)).rejects.toThrow(/Chat session with id 99999 does not exist/);
  });

  it('should preserve message order by creation time', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    // Create messages with small delay to ensure different timestamps
    const message1 = await createChatMessage({
      session_id: session.id,
      message_type: 'User',
      content: 'First message'
    });

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const message2 = await createChatMessage({
      session_id: session.id,
      message_type: 'Assistant',
      content: 'Second message'
    });

    // Verify timestamps show correct order
    expect(message2.created_at.getTime()).toBeGreaterThan(message1.created_at.getTime());

    // Query messages from database in creation order
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, session.id))
      .execute();

    expect(messages).toHaveLength(2);
    
    // Sort by creation time and verify content order
    const sortedMessages = messages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    expect(sortedMessages[0].content).toBe('First message');
    expect(sortedMessages[1].content).toBe('Second message');
  });

  it('should validate foreign key constraint with valid session', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const session = await createTestSession(user.id);

    const input: CreateChatMessageInput = {
      session_id: session.id,
      message_type: 'User',
      content: 'Valid session reference'
    };

    // This should succeed because session exists
    const result = await createChatMessage(input);
    expect(result.session_id).toBe(session.id);

    // Verify the foreign key relationship works by checking session still exists
    const sessionCheck = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, session.id))
      .execute();

    expect(sessionCheck).toHaveLength(1);
  });
});