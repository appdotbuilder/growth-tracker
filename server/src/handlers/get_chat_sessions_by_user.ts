import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type ChatSession } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getChatSessionsByUser = async (userId: number): Promise<ChatSession[]> => {
  try {
    const results = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.user_id, userId))
      .orderBy(desc(chatSessionsTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch chat sessions for user:', error);
    throw error;
  }
};