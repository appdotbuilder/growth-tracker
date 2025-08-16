import { db } from '../db';
import { chatMessagesTable, chatSessionsTable } from '../db/schema';
import { type CreateChatMessageInput, type ChatMessage } from '../schema';
import { eq } from 'drizzle-orm';

export const createChatMessage = async (input: CreateChatMessageInput): Promise<ChatMessage> => {
  try {
    // First, validate that the chat session exists
    const sessionExists = await db.select({ id: chatSessionsTable.id })
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, input.session_id))
      .limit(1)
      .execute();

    if (sessionExists.length === 0) {
      throw new Error(`Chat session with id ${input.session_id} does not exist`);
    }

    // Insert the chat message
    const result = await db.insert(chatMessagesTable)
      .values({
        session_id: input.session_id,
        message_type: input.message_type,
        content: input.content
      })
      .returning()
      .execute();

    // Return the created message
    return result[0];
  } catch (error) {
    console.error('Chat message creation failed:', error);
    throw error;
  }
};