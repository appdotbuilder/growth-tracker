import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable, achievementsTable } from '../db/schema';
import { type CreateUserInput, type CreateGoalInput, type CreateAchievementInput } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

// Test data
const testEmployee: CreateUserInput = {
  email: 'employee@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testManager: CreateUserInput = {
  email: 'manager@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testGoal: Omit<CreateGoalInput, 'employee_id' | 'manager_id'> = {
  title: 'Complete Project Alpha',
  description: 'Finish the Alpha project by the deadline',
  priority: 'High',
  due_date: new Date('2024-12-31')
};

const testAchievement: Omit<CreateAchievementInput, 'employee_id' | 'goal_id'> = {
  title: 'Project Beta Completion',
  description: 'Successfully completed Project Beta',
  category: 'Goal_Completion',
  achieved_date: new Date('2024-01-15')
};

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch dashboard data for an employee', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test goal
    await db.insert(goalsTable)
      .values({
        ...testGoal,
        employee_id: userId,
        manager_id: null
      })
      .execute();

    // Create test achievement
    await db.insert(achievementsTable)
      .values({
        ...testAchievement,
        employee_id: userId,
        goal_id: null
      })
      .execute();

    const result = await getDashboardData(userId);

    // Verify user data
    expect(result.user.id).toBe(userId);
    expect(result.user.email).toBe('employee@example.com');
    expect(result.user.first_name).toBe('John');
    expect(result.user.role).toBe('Employee');

    // Verify recent goals
    expect(result.recentGoals).toHaveLength(1);
    expect(result.recentGoals[0].title).toBe('Complete Project Alpha');
    expect(result.recentGoals[0].employee_id).toBe(userId);

    // Verify recent achievements
    expect(result.recentAchievements).toHaveLength(1);
    expect(result.recentAchievements[0].title).toBe('Project Beta Completion');
    expect(result.recentAchievements[0].employee_id).toBe(userId);

    // Verify pending approvals
    expect(result.pendingApprovals).toHaveLength(0);

    // Employee should not have team statistics
    expect(result.teamGoalsCount).toBeUndefined();
    expect(result.teamAchievementsCount).toBeUndefined();
  });

  it('should include pending approvals for user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create pending approval goal
    await db.insert(goalsTable)
      .values({
        ...testGoal,
        employee_id: userId,
        manager_id: null,
        status: 'Pending_Approval'
      })
      .execute();

    const result = await getDashboardData(userId);

    expect(result.pendingApprovals).toHaveLength(1);
    expect(result.pendingApprovals[0].status).toBe('Pending_Approval');
    expect(result.pendingApprovals[0].employee_id).toBe(userId);
  });

  it('should fetch team statistics for managers', async () => {
    // Create manager
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create employee under manager
    const employeeResult = await db.insert(usersTable)
      .values({
        ...testEmployee,
        email: 'employee2@example.com',
        manager_id: managerId
      })
      .returning()
      .execute();
    const employeeId = employeeResult[0].id;

    // Create goal managed by the manager
    const goalResult = await db.insert(goalsTable)
      .values({
        ...testGoal,
        employee_id: employeeId,
        manager_id: managerId
      })
      .returning()
      .execute();
    const goalId = goalResult[0].id;

    // Create achievement linked to the managed goal
    await db.insert(achievementsTable)
      .values({
        ...testAchievement,
        employee_id: employeeId,
        goal_id: goalId
      })
      .execute();

    const result = await getDashboardData(managerId);

    // Verify manager user data
    expect(result.user.role).toBe('Manager');

    // Verify team statistics are included
    expect(result.teamGoalsCount).toBe(1);
    expect(result.teamAchievementsCount).toBe(1);
  });

  it('should limit recent goals and achievements to 5 items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create 7 goals
    for (let i = 0; i < 7; i++) {
      await db.insert(goalsTable)
        .values({
          title: `Goal ${i + 1}`,
          description: `Description for goal ${i + 1}`,
          priority: 'Medium',
          employee_id: userId,
          manager_id: null,
          due_date: new Date()
        })
        .execute();
    }

    // Create 7 achievements
    for (let i = 0; i < 7; i++) {
      await db.insert(achievementsTable)
        .values({
          title: `Achievement ${i + 1}`,
          description: `Description for achievement ${i + 1}`,
          category: 'Performance',
          employee_id: userId,
          goal_id: null,
          achieved_date: new Date()
        })
        .execute();
    }

    const result = await getDashboardData(userId);

    // Should only return 5 most recent items
    expect(result.recentGoals).toHaveLength(5);
    expect(result.recentAchievements).toHaveLength(5);
  });

  it('should handle HR Admin role with team statistics', async () => {
    // Create HR Admin user
    const hrAdminResult = await db.insert(usersTable)
      .values({
        ...testManager,
        email: 'hradmin@example.com',
        role: 'HR_Admin'
      })
      .returning()
      .execute();
    const hrAdminId = hrAdminResult[0].id;

    const result = await getDashboardData(hrAdminId);

    expect(result.user.role).toBe('HR_Admin');
    expect(result.teamGoalsCount).toBeDefined();
    expect(result.teamAchievementsCount).toBeDefined();
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 999;

    await expect(getDashboardData(nonExistentUserId))
      .rejects
      .toThrow(/user not found/i);
  });

  it('should handle user with no goals or achievements', async () => {
    // Create user with no associated data
    const userResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await getDashboardData(userId);

    expect(result.user.id).toBe(userId);
    expect(result.recentGoals).toHaveLength(0);
    expect(result.recentAchievements).toHaveLength(0);
    expect(result.pendingApprovals).toHaveLength(0);
  });

  it('should order recent goals and achievements by creation/achievement date', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create goals with different creation times
    const firstGoal = await db.insert(goalsTable)
      .values({
        title: 'First Goal',
        description: 'First goal description',
        priority: 'Low',
        employee_id: userId,
        manager_id: null,
        due_date: null
      })
      .returning()
      .execute();

    // Create second goal (should be more recent)
    const secondGoal = await db.insert(goalsTable)
      .values({
        title: 'Second Goal',
        description: 'Second goal description',
        priority: 'High',
        employee_id: userId,
        manager_id: null,
        due_date: null
      })
      .returning()
      .execute();

    // Create achievements with different achievement dates
    const olderDate = new Date('2024-01-01');
    const newerDate = new Date('2024-02-01');

    await db.insert(achievementsTable)
      .values({
        title: 'Older Achievement',
        description: 'Older achievement description',
        category: 'Performance',
        employee_id: userId,
        goal_id: null,
        achieved_date: olderDate
      })
      .execute();

    await db.insert(achievementsTable)
      .values({
        title: 'Newer Achievement',
        description: 'Newer achievement description',
        category: 'Innovation',
        employee_id: userId,
        goal_id: null,
        achieved_date: newerDate
      })
      .execute();

    const result = await getDashboardData(userId);

    // Goals should be ordered by creation date (most recent first)
    expect(result.recentGoals[0].title).toBe('Second Goal');
    expect(result.recentGoals[1].title).toBe('First Goal');

    // Achievements should be ordered by achievement date (most recent first)
    expect(result.recentAchievements[0].title).toBe('Newer Achievement');
    expect(result.recentAchievements[1].title).toBe('Older Achievement');
  });
});