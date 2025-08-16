import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type ChatMessage } from '../schema';

export const getChatMessagesBySession = async (sessionId: number): Promise<ChatMessage[]> => {
  try {
    // Fetch all messages for the session in chronological order
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, sessionId))
      .orderBy(asc(chatMessagesTable.created_at))
      .execute();

    return messages;
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
};