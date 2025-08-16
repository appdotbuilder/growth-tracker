import { db } from '../db';
import { goalsTable, achievementsTable, usersTable } from '../db/schema';
import { type AnalyticsQueryInput, type AnalyticsResponse } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getAnalytics = async (input: AnalyticsQueryInput): Promise<AnalyticsResponse> => {
  try {
    // Build conditions array for goals filtering
    const goalConditions: SQL<unknown>[] = [];
    
    if (input.user_id !== undefined) {
      goalConditions.push(eq(goalsTable.employee_id, input.user_id));
    }
    
    if (input.date_from !== undefined) {
      goalConditions.push(gte(goalsTable.created_at, input.date_from));
    }
    
    if (input.date_to !== undefined) {
      goalConditions.push(lte(goalsTable.created_at, input.date_to));
    }
    
    if (input.goal_status !== undefined) {
      goalConditions.push(eq(goalsTable.status, input.goal_status));
    }

    // Handle goals query with or without department filter
    let goalsResults;
    if (input.department !== undefined) {
      // Add department condition to goals conditions
      goalConditions.push(eq(usersTable.department, input.department));

      // Query with JOIN for department filtering
      if (goalConditions.length > 0) {
        goalsResults = await db.select()
          .from(goalsTable)
          .innerJoin(usersTable, eq(goalsTable.employee_id, usersTable.id))
          .where(and(...goalConditions))
          .execute();
      } else {
        goalsResults = await db.select()
          .from(goalsTable)
          .innerJoin(usersTable, eq(goalsTable.employee_id, usersTable.id))
          .execute();
      }
    } else {
      // Query without JOIN
      if (goalConditions.length > 0) {
        goalsResults = await db.select()
          .from(goalsTable)
          .where(and(...goalConditions))
          .execute();
      } else {
        goalsResults = await db.select()
          .from(goalsTable)
          .execute();
      }
    }

    // Process goals data based on query type
    const goals = goalsResults.map(result => {
      return input.department !== undefined
        ? (result as any).goals
        : result;
    });

    // Count total goals, completed goals, and pending goals
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.status === 'Completed').length;
    const pendingGoals = goals.filter(goal => 
      ['Draft', 'Pending_Approval', 'Approved', 'In_Progress'].includes(goal.status)
    ).length;

    // Count goals by priority
    const goalsByPriority: Record<string, number> = {};
    goals.forEach(goal => {
      goalsByPriority[goal.priority] = (goalsByPriority[goal.priority] || 0) + 1;
    });

    // Calculate average completion time for completed goals
    const completedGoalsWithDates = goals.filter(goal => 
      goal.status === 'Completed' && 
      goal.completed_date && 
      goal.created_at
    );
    
    let averageCompletionTime: number | null = null;
    if (completedGoalsWithDates.length > 0) {
      const totalCompletionTime = completedGoalsWithDates.reduce((sum, goal) => {
        const completionTime = new Date(goal.completed_date!).getTime() - new Date(goal.created_at).getTime();
        return sum + completionTime;
      }, 0);
      averageCompletionTime = Math.round(totalCompletionTime / completedGoalsWithDates.length / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Build conditions array for achievements filtering
    const achievementConditions: SQL<unknown>[] = [];
    
    if (input.user_id !== undefined) {
      achievementConditions.push(eq(achievementsTable.employee_id, input.user_id));
    }
    
    if (input.date_from !== undefined) {
      achievementConditions.push(gte(achievementsTable.achieved_date, input.date_from));
    }
    
    if (input.date_to !== undefined) {
      achievementConditions.push(lte(achievementsTable.achieved_date, input.date_to));
    }
    
    if (input.achievement_category !== undefined) {
      achievementConditions.push(eq(achievementsTable.category, input.achievement_category));
    }

    // Handle achievements query with or without department filter
    let achievementsResults;
    if (input.department !== undefined) {
      // Add department condition to achievements conditions
      achievementConditions.push(eq(usersTable.department, input.department));

      // Query with JOIN for department filtering
      if (achievementConditions.length > 0) {
        achievementsResults = await db.select()
          .from(achievementsTable)
          .innerJoin(usersTable, eq(achievementsTable.employee_id, usersTable.id))
          .where(and(...achievementConditions))
          .execute();
      } else {
        achievementsResults = await db.select()
          .from(achievementsTable)
          .innerJoin(usersTable, eq(achievementsTable.employee_id, usersTable.id))
          .execute();
      }
    } else {
      // Query without JOIN
      if (achievementConditions.length > 0) {
        achievementsResults = await db.select()
          .from(achievementsTable)
          .where(and(...achievementConditions))
          .execute();
      } else {
        achievementsResults = await db.select()
          .from(achievementsTable)
          .execute();
      }
    }

    // Process achievements data based on query type
    const achievements = achievementsResults.map(result => {
      return input.department !== undefined
        ? (result as any).achievements
        : result;
    });

    // Count total achievements and group by category
    const totalAchievements = achievements.length;
    const achievementsByCategory: Record<string, number> = {};
    achievements.forEach(achievement => {
      achievementsByCategory[achievement.category] = (achievementsByCategory[achievement.category] || 0) + 1;
    });

    // Calculate completion rate
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return {
      total_goals: totalGoals,
      completed_goals: completedGoals,
      pending_goals: pendingGoals,
      total_achievements: totalAchievements,
      achievements_by_category: achievementsByCategory,
      goals_by_priority: goalsByPriority,
      completion_rate: completionRate,
      average_completion_time: averageCompletionTime
    };
  } catch (error) {
    console.error('Analytics query failed:', error);
    throw error;
  }
};