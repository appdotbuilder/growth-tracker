import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable, usersTable } from '../db/schema';
import { type CreateChatSessionInput, type CreateUserInput } from '../schema';
import { createChatSession } from '../handlers/create_chat_session';
import { eq } from 'drizzle-orm';

describe('createChatSession', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test user first
    const testUser: CreateUserInput = {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'Employee',
      department: 'Engineering',
      manager_id: null,
      profile_picture: null
    };

    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a chat session with title', async () => {
    const testInput: CreateChatSessionInput = {
      user_id: testUserId,
      title: 'My Chat Session'
    };

    const result = await createChatSession(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('My Chat Session');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a chat session without title', async () => {
    const testInput: CreateChatSessionInput = {
      user_id: testUserId,
      title: null
    };

    const result = await createChatSession(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save chat session to database', async () => {
    const testInput: CreateChatSessionInput = {
      user_id: testUserId,
      title: 'Test Session'
    };

    const result = await createChatSession(testInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toEqual(testUserId);
    expect(sessions[0].title).toEqual('Test Session');
    expect(sessions[0].created_at).toBeInstanceOf(Date);
    expect(sessions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateChatSessionInput = {
      user_id: 99999, // Non-existent user ID
      title: 'Test Session'
    };

    await expect(createChatSession(testInput)).rejects.toThrow(/User with id 99999 does not exist/i);
  });

  it('should create multiple sessions for the same user', async () => {
    const testInput1: CreateChatSessionInput = {
      user_id: testUserId,
      title: 'First Session'
    };

    const testInput2: CreateChatSessionInput = {
      user_id: testUserId,
      title: 'Second Session'
    };

    const result1 = await createChatSession(testInput1);
    const result2 = await createChatSession(testInput2);

    // Verify both sessions exist and have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.title).toEqual('First Session');
    expect(result2.title).toEqual('Second Session');

    // Verify both are saved in database
    const sessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.user_id, testUserId))
      .execute();

    expect(sessions).toHaveLength(2);
  });

  it('should set created_at and updated_at timestamps correctly', async () => {
    const testInput: CreateChatSessionInput = {
      user_id: testUserId,
      title: 'Timestamp Test'
    };

    const beforeCreate = new Date();
    const result = await createChatSession(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});