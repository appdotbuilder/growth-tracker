import { db } from '../db';
import { achievementsTable } from '../db/schema';
import { type Achievement } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getAchievementsByEmployee = async (employeeId: number): Promise<Achievement[]> => {
  try {
    // Query achievements for the specific employee, ordered by achieved date (most recent first)
    const results = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.employee_id, employeeId))
      .orderBy(desc(achievementsTable.achieved_date))
      .execute();

    // Return achievements (no numeric conversions needed as this table has no numeric columns)
    return results;
  } catch (error) {
    console.error('Failed to fetch achievements by employee:', error);
    throw error;
  }
};