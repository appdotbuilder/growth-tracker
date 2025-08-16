import { db } from '../db';
import { chatSessionsTable, usersTable } from '../db/schema';
import { type CreateChatSessionInput, type ChatSession } from '../schema';
import { eq } from 'drizzle-orm';

export const createChatSession = async (input: CreateChatSessionInput): Promise<ChatSession> => {
  try {
    // Validate that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert chat session record
    const result = await db.insert(chatSessionsTable)
      .values({
        user_id: input.user_id,
        title: input.title
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chat session creation failed:', error);
    throw error;
  }
};