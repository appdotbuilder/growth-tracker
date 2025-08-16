import { db } from '../db';
import { usersTable, goalsTable, achievementsTable } from '../db/schema';
import { type User, type Goal, type Achievement } from '../schema';
import { eq, desc, and, or, count, SQL } from 'drizzle-orm';

// Dashboard data structure
export interface DashboardData {
  user: User;
  recentGoals: Goal[];
  recentAchievements: Achievement[];
  pendingApprovals: Goal[];
  teamGoalsCount?: number;
  teamAchievementsCount?: number;
}

export const getDashboardData = async (userId: number): Promise<DashboardData> => {
  try {
    // Get user information
    const userResult = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult[0];

    // Get recent goals (last 5 goals for the user)
    const recentGoals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.employee_id, userId))
      .orderBy(desc(goalsTable.created_at))
      .limit(5)
      .execute();

    // Get recent achievements (last 5 achievements for the user)
    const recentAchievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.employee_id, userId))
      .orderBy(desc(achievementsTable.achieved_date))
      .limit(5)
      .execute();

    // Get pending approvals for the user (goals that need approval)
    const pendingApprovals = await db.select()
      .from(goalsTable)
      .where(
        and(
          eq(goalsTable.employee_id, userId),
          eq(goalsTable.status, 'Pending_Approval')
        )
      )
      .orderBy(desc(goalsTable.created_at))
      .execute();

    let teamGoalsCount: number | undefined;
    let teamAchievementsCount: number | undefined;

    // If user is a manager, get team statistics
    if (user.role === 'Manager' || user.role === 'HR_Admin' || user.role === 'System_Admin') {
      // Count goals for team members (where user is the manager)
      const teamGoalsResult = await db.select({ count: count() })
        .from(goalsTable)
        .where(eq(goalsTable.manager_id, userId))
        .execute();

      teamGoalsCount = teamGoalsResult[0]?.count || 0;

      // Count achievements for team members
      // We need to join with goals to find achievements for goals managed by this user
      const teamAchievementsResult = await db.select({ count: count() })
        .from(achievementsTable)
        .innerJoin(goalsTable, eq(achievementsTable.goal_id, goalsTable.id))
        .where(eq(goalsTable.manager_id, userId))
        .execute();

      teamAchievementsCount = teamAchievementsResult[0]?.count || 0;
    }

    return {
      user,
      recentGoals,
      recentAchievements,
      pendingApprovals,
      teamGoalsCount,
      teamAchievementsCount
    };
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    throw error;
  }
};