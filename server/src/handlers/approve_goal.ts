import { db } from '../db';
import { goalsTable, usersTable } from '../db/schema';
import { type Goal } from '../schema';
import { eq, and } from 'drizzle-orm';

export const approveGoal = async (goalId: number, managerId: number): Promise<Goal> => {
  try {
    // First, verify the goal exists and is in a state that can be approved
    const existingGoal = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, goalId))
      .execute();

    if (existingGoal.length === 0) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    const goal = existingGoal[0];

    // Check if goal is in a state that can be approved
    if (goal.status !== 'Pending_Approval') {
      throw new Error(`Goal is not pending approval. Current status: ${goal.status}`);
    }

    // Verify the manager exists and has permission to approve this goal
    const manager = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, managerId))
      .execute();

    if (manager.length === 0) {
      throw new Error(`Manager with id ${managerId} not found`);
    }

    const managerUser = manager[0];

    // Check if the user has manager or admin role
    if (!['Manager', 'HR_Admin', 'System_Admin'].includes(managerUser.role)) {
      throw new Error('User does not have permission to approve goals');
    }

    // Verify manager has permission to approve this specific goal
    // Manager can approve if they are:
    // 1. The assigned manager for this goal, OR
    // 2. The direct manager of the employee, OR
    // 3. An HR Admin or System Admin
    const canApprove = goal.manager_id === managerId || 
                      managerUser.role === 'HR_Admin' || 
                      managerUser.role === 'System_Admin';

    // If not directly assigned and not admin, check if they're the employee's direct manager
    if (!canApprove) {
      const employee = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, goal.employee_id))
        .execute();

      if (employee.length === 0) {
        throw new Error(`Employee with id ${goal.employee_id} not found`);
      }

      if (employee[0].manager_id !== managerId) {
        throw new Error('Manager does not have permission to approve this goal');
      }
    }

    // Update the goal with approval
    const now = new Date();
    const result = await db.update(goalsTable)
      .set({
        status: 'Approved',
        manager_id: managerId, // Assign the approving manager
        approval_date: now,
        updated_at: now
      })
      .where(eq(goalsTable.id, goalId))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Goal approval failed:', error);
    throw error;
  }
};