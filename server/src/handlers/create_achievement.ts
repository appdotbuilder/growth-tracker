import { db } from '../db';
import { achievementsTable, usersTable, goalsTable } from '../db/schema';
import { type CreateAchievementInput, type Achievement } from '../schema';
import { eq } from 'drizzle-orm';

export const createAchievement = async (input: CreateAchievementInput): Promise<Achievement> => {
  try {
    // Validate that the employee exists
    const employee = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.employee_id))
      .execute();

    if (employee.length === 0) {
      throw new Error(`Employee with id ${input.employee_id} not found`);
    }

    // If goal_id is provided, validate that the goal exists and belongs to the employee
    if (input.goal_id !== null) {
      const goal = await db.select()
        .from(goalsTable)
        .where(eq(goalsTable.id, input.goal_id))
        .execute();

      if (goal.length === 0) {
        throw new Error(`Goal with id ${input.goal_id} not found`);
      }

      if (goal[0].employee_id !== input.employee_id) {
        throw new Error(`Goal with id ${input.goal_id} does not belong to employee ${input.employee_id}`);
      }
    }

    // Insert achievement record
    const result = await db.insert(achievementsTable)
      .values({
        title: input.title,
        description: input.description,
        category: input.category,
        employee_id: input.employee_id,
        goal_id: input.goal_id,
        achieved_date: input.achieved_date
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Achievement creation failed:', error);
    throw error;
  }
};