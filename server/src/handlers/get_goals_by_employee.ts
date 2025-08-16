import { db } from '../db';
import { goalsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Goal } from '../schema';

export const getGoalsByEmployee = async (employeeId: number): Promise<Goal[]> => {
  try {
    // Query all goals for the specified employee
    const results = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.employee_id, employeeId))
      .execute();

    // Return the goals - no numeric conversions needed as all fields are already the correct types
    return results;
  } catch (error) {
    console.error('Failed to fetch goals for employee:', error);
    throw error;
  }
};