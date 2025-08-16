import { db } from '../db';
import { integrationsTable } from '../db/schema';
import { type CreateIntegrationInput, type Integration } from '../schema';

export const createIntegration = async (input: CreateIntegrationInput): Promise<Integration> => {
  try {
    // Insert integration record
    const result = await db.insert(integrationsTable)
      .values({
        name: input.name,
        type: input.type,
        enabled: input.enabled,
        config: input.config
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Integration creation failed:', error);
    throw error;
  }
};