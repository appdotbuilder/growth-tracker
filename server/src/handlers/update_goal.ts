import { db } from '../db';
import { goalsTable } from '../db/schema';
import { type UpdateGoalInput, type Goal } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGoal = async (input: UpdateGoalInput): Promise<Goal> => {
  try {
    // First check if the goal exists
    const existingGoal = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingGoal.length === 0) {
      throw new Error('Goal not found');
    }

    const current = existingGoal[0];

    // Prepare update object with only provided fields
    const updateData: Partial<typeof goalsTable.$inferInsert> = {
      updated_at: new Date()
    };

    // Handle status transitions and set related dates
    if (input.status !== undefined) {
      updateData.status = input.status;
      
      // Set approval_date when status changes to 'Approved'
      if (input.status === 'Approved' && current.status !== 'Approved') {
        updateData.approval_date = new Date();
      }
      
      // Set completed_date when status changes to 'Completed'
      if (input.status === 'Completed' && current.status !== 'Completed') {
        updateData.completed_date = new Date();
      }
      
      // Clear completed_date if status changes away from 'Completed'
      if (input.status !== 'Completed' && current.status === 'Completed') {
        updateData.completed_date = null;
      }
    }

    // Apply other optional updates
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    
    if (input.manager_id !== undefined) {
      updateData.manager_id = input.manager_id;
    }
    
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }
    
    // Allow manual override of completed_date if provided
    if (input.completed_date !== undefined) {
      updateData.completed_date = input.completed_date;
    }
    
    // Allow manual override of approval_date if provided
    if (input.approval_date !== undefined) {
      updateData.approval_date = input.approval_date;
    }

    // Perform the update
    const result = await db.update(goalsTable)
      .set(updateData)
      .where(eq(goalsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Goal update failed:', error);
    throw error;
  }
};