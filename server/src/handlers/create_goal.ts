import { db } from '../db';
import { goalsTable, usersTable } from '../db/schema';
import { type CreateGoalInput, type Goal } from '../schema';
import { eq } from 'drizzle-orm';

export const createGoal = async (input: CreateGoalInput): Promise<Goal> => {
  try {
    // Validate employee exists
    const employee = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.employee_id))
      .execute();

    if (employee.length === 0) {
      throw new Error('Employee not found');
    }

    // Validate manager exists if provided
    if (input.manager_id) {
      const manager = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.manager_id))
        .execute();

      if (manager.length === 0) {
        throw new Error('Manager not found');
      }
    }

    // Insert goal record
    const result = await db.insert(goalsTable)
      .values({
        title: input.title,
        description: input.description,
        priority: input.priority,
        employee_id: input.employee_id,
        manager_id: input.manager_id,
        due_date: input.due_date,
        status: 'Draft' // Default status for new goals
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Goal creation failed:', error);
    throw error;
  }
};