import { db } from '../db';
import { goalsTable } from '../db/schema';
import { type Goal } from '../schema';
import { desc } from 'drizzle-orm';

export const getGoals = async (): Promise<Goal[]> => {
  try {
    // Fetch all goals ordered by creation date (newest first)
    const results = await db.select()
      .from(goalsTable)
      .orderBy(desc(goalsTable.created_at))
      .execute();

    // No numeric conversions needed - all fields are already in correct types
    // (timestamps are automatically converted to Date objects by Drizzle)
    return results;
  } catch (error) {
    console.error('Goals retrieval failed:', error);
    throw error;
  }
};