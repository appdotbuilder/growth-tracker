import { db } from '../db';
import { integrationsTable } from '../db/schema';
import { type UpdateIntegrationInput, type Integration } from '../schema';
import { eq } from 'drizzle-orm';

export const updateIntegration = async (input: UpdateIntegrationInput): Promise<Integration> => {
  try {
    // First check if the integration exists
    const existingIntegrations = await db.select()
      .from(integrationsTable)
      .where(eq(integrationsTable.id, input.id))
      .execute();

    if (existingIntegrations.length === 0) {
      throw new Error(`Integration with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.enabled !== undefined) {
      updateData.enabled = input.enabled;
    }

    if (input.config !== undefined) {
      updateData.config = input.config;
    }

    // Update the integration
    const result = await db.update(integrationsTable)
      .set(updateData)
      .where(eq(integrationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Integration update failed:', error);
    throw error;
  }
};