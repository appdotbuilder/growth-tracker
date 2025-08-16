import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable, achievementsTable } from '../db/schema';
import { type AnalyticsQueryInput } from '../schema';
import { getAnalytics } from '../handlers/get_analytics';

// Test data setup
const testUser1 = {
  email: 'employee1@test.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee' as const,
  department: 'Engineering',
  manager_id: null
};

const testUser2 = {
  email: 'employee2@test.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Employee' as const,
  department: 'Marketing',
  manager_id: null
};

const testManager = {
  email: 'manager@test.com',
  first_name: 'Bob',
  last_name: 'Manager',
  role: 'Manager' as const,
  department: 'Engineering',
  manager_id: null
};

describe('getAnalytics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty analytics for no data', async () => {
    const input: AnalyticsQueryInput = {};
    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(0);
    expect(result.completed_goals).toEqual(0);
    expect(result.pending_goals).toEqual(0);
    expect(result.total_achievements).toEqual(0);
    expect(result.achievements_by_category).toEqual({});
    expect(result.goals_by_priority).toEqual({});
    expect(result.completion_rate).toEqual(0);
    expect(result.average_completion_time).toBeNull();
  });

  it('should calculate basic goal and achievement metrics', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2, testManager])
      .returning()
      .execute();

    const user1 = users[0];
    const user2 = users[1];
    const manager = users[2];

    // Create test goals with different statuses and priorities
    await db.insert(goalsTable)
      .values([
        {
          title: 'Goal 1',
          description: 'Test goal 1',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: manager.id,
          completed_date: new Date('2024-01-15')
        },
        {
          title: 'Goal 2',
          description: 'Test goal 2',
          status: 'In_Progress',
          priority: 'Medium',
          employee_id: user1.id,
          manager_id: manager.id
        },
        {
          title: 'Goal 3',
          description: 'Test goal 3',
          status: 'Completed',
          priority: 'Low',
          employee_id: user2.id,
          manager_id: null,
          completed_date: new Date('2024-01-20')
        },
        {
          title: 'Goal 4',
          description: 'Test goal 4',
          status: 'Draft',
          priority: 'Critical',
          employee_id: user2.id,
          manager_id: null
        }
      ])
      .execute();

    // Create test achievements
    await db.insert(achievementsTable)
      .values([
        {
          title: 'Achievement 1',
          description: 'Test achievement 1',
          category: 'Goal_Completion',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: new Date('2024-01-15')
        },
        {
          title: 'Achievement 2',
          description: 'Test achievement 2',
          category: 'Skill_Development',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: new Date('2024-01-16')
        },
        {
          title: 'Achievement 3',
          description: 'Test achievement 3',
          category: 'Leadership',
          employee_id: user2.id,
          goal_id: null,
          achieved_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const input: AnalyticsQueryInput = {};
    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(4);
    expect(result.completed_goals).toEqual(2);
    expect(result.pending_goals).toEqual(2);
    expect(result.total_achievements).toEqual(3);
    expect(result.completion_rate).toEqual(50);
    
    // Check goals by priority
    expect(result.goals_by_priority['High']).toEqual(1);
    expect(result.goals_by_priority['Medium']).toEqual(1);
    expect(result.goals_by_priority['Low']).toEqual(1);
    expect(result.goals_by_priority['Critical']).toEqual(1);

    // Check achievements by category
    expect(result.achievements_by_category['Goal_Completion']).toEqual(1);
    expect(result.achievements_by_category['Skill_Development']).toEqual(1);
    expect(result.achievements_by_category['Leadership']).toEqual(1);
  });

  it('should filter analytics by specific user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1 = users[0];
    const user2 = users[1];

    // Create goals for different users
    await db.insert(goalsTable)
      .values([
        {
          title: 'User 1 Goal 1',
          description: 'Test goal 1',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null
        },
        {
          title: 'User 1 Goal 2',
          description: 'Test goal 2',
          status: 'In_Progress',
          priority: 'Medium',
          employee_id: user1.id,
          manager_id: null
        },
        {
          title: 'User 2 Goal',
          description: 'Test goal for user 2',
          status: 'Completed',
          priority: 'Low',
          employee_id: user2.id,
          manager_id: null
        }
      ])
      .execute();

    // Create achievements for different users
    await db.insert(achievementsTable)
      .values([
        {
          title: 'User 1 Achievement',
          description: 'Test achievement for user 1',
          category: 'Goal_Completion',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: new Date()
        },
        {
          title: 'User 2 Achievement',
          description: 'Test achievement for user 2',
          category: 'Leadership',
          employee_id: user2.id,
          goal_id: null,
          achieved_date: new Date()
        }
      ])
      .execute();

    // Filter by user 1
    const input: AnalyticsQueryInput = { user_id: user1.id };
    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(2);
    expect(result.completed_goals).toEqual(1);
    expect(result.pending_goals).toEqual(1);
    expect(result.total_achievements).toEqual(1);
    expect(result.completion_rate).toEqual(50);
    expect(result.achievements_by_category['Goal_Completion']).toEqual(1);
    expect(result.achievements_by_category['Leadership']).toBeUndefined();
  });

  it('should filter analytics by department', async () => {
    // Create test users in different departments
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2]) // Engineering and Marketing
      .returning()
      .execute();

    const user1 = users[0]; // Engineering
    const user2 = users[1]; // Marketing

    // Create goals for users in different departments
    await db.insert(goalsTable)
      .values([
        {
          title: 'Engineering Goal 1',
          description: 'Engineering goal',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null
        },
        {
          title: 'Engineering Goal 2',
          description: 'Engineering goal',
          status: 'In_Progress',
          priority: 'Medium',
          employee_id: user1.id,
          manager_id: null
        },
        {
          title: 'Marketing Goal',
          description: 'Marketing goal',
          status: 'Completed',
          priority: 'Low',
          employee_id: user2.id,
          manager_id: null
        }
      ])
      .execute();

    // Create achievements for users in different departments
    await db.insert(achievementsTable)
      .values([
        {
          title: 'Engineering Achievement',
          description: 'Engineering achievement',
          category: 'Innovation',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: new Date()
        },
        {
          title: 'Marketing Achievement',
          description: 'Marketing achievement',
          category: 'Collaboration',
          employee_id: user2.id,
          goal_id: null,
          achieved_date: new Date()
        }
      ])
      .execute();

    // Filter by Engineering department
    const input: AnalyticsQueryInput = { department: 'Engineering' };
    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(2);
    expect(result.completed_goals).toEqual(1);
    expect(result.pending_goals).toEqual(1);
    expect(result.total_achievements).toEqual(1);
    expect(result.completion_rate).toEqual(50);
    expect(result.achievements_by_category['Innovation']).toEqual(1);
    expect(result.achievements_by_category['Collaboration']).toBeUndefined();
  });

  it('should filter analytics by date range', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const user1 = users[0];

    const oldDate = new Date('2024-01-01');
    const recentDate = new Date('2024-02-01');

    // Create goals with different creation dates
    await db.insert(goalsTable)
      .values([
        {
          title: 'Old Goal',
          description: 'Old goal',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null,
          created_at: oldDate
        },
        {
          title: 'Recent Goal',
          description: 'Recent goal',
          status: 'In_Progress',
          priority: 'Medium',
          employee_id: user1.id,
          manager_id: null,
          created_at: recentDate
        }
      ])
      .execute();

    // Create achievements with different achieved dates
    await db.insert(achievementsTable)
      .values([
        {
          title: 'Old Achievement',
          description: 'Old achievement',
          category: 'Goal_Completion',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: oldDate
        },
        {
          title: 'Recent Achievement',
          description: 'Recent achievement',
          category: 'Skill_Development',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: recentDate
        }
      ])
      .execute();

    // Filter by date range (only recent data)
    const input: AnalyticsQueryInput = {
      date_from: new Date('2024-01-15'),
      date_to: new Date('2024-02-15')
    };
    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(1);
    expect(result.completed_goals).toEqual(0);
    expect(result.pending_goals).toEqual(1);
    expect(result.total_achievements).toEqual(1);
    expect(result.achievements_by_category['Skill_Development']).toEqual(1);
    expect(result.achievements_by_category['Goal_Completion']).toBeUndefined();
  });

  it('should calculate average completion time correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const user1 = users[0];

    const startDate = new Date('2024-01-01');
    const completionDate1 = new Date('2024-01-11'); // 10 days
    const completionDate2 = new Date('2024-01-21'); // 20 days

    // Create completed goals with different completion times
    await db.insert(goalsTable)
      .values([
        {
          title: 'Fast Goal',
          description: 'Completed quickly',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null,
          created_at: startDate,
          completed_date: completionDate1
        },
        {
          title: 'Slow Goal',
          description: 'Took longer',
          status: 'Completed',
          priority: 'Medium',
          employee_id: user1.id,
          manager_id: null,
          created_at: startDate,
          completed_date: completionDate2
        },
        {
          title: 'Incomplete Goal',
          description: 'Not completed',
          status: 'In_Progress',
          priority: 'Low',
          employee_id: user1.id,
          manager_id: null,
          created_at: startDate
        }
      ])
      .execute();

    const input: AnalyticsQueryInput = {};
    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(3);
    expect(result.completed_goals).toEqual(2);
    expect(result.pending_goals).toEqual(1);
    expect(result.average_completion_time).toEqual(15); // Average of 10 and 20 days
  });

  it('should filter by goal status and achievement category', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const user1 = users[0];

    // Create goals with different statuses
    await db.insert(goalsTable)
      .values([
        {
          title: 'Completed Goal',
          description: 'Completed goal',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null
        },
        {
          title: 'In Progress Goal',
          description: 'In progress goal',
          status: 'In_Progress',
          priority: 'Medium',
          employee_id: user1.id,
          manager_id: null
        },
        {
          title: 'Draft Goal',
          description: 'Draft goal',
          status: 'Draft',
          priority: 'Low',
          employee_id: user1.id,
          manager_id: null
        }
      ])
      .execute();

    // Create achievements with different categories
    await db.insert(achievementsTable)
      .values([
        {
          title: 'Goal Achievement',
          description: 'Goal completion achievement',
          category: 'Goal_Completion',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: new Date()
        },
        {
          title: 'Leadership Achievement',
          description: 'Leadership achievement',
          category: 'Leadership',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: new Date()
        }
      ])
      .execute();

    // Filter by completed goals only
    const goalFilterInput: AnalyticsQueryInput = {
      goal_status: 'Completed'
    };
    const goalResult = await getAnalytics(goalFilterInput);

    expect(goalResult.total_goals).toEqual(1);
    expect(goalResult.completed_goals).toEqual(1);
    expect(goalResult.total_achievements).toEqual(2); // Achievements not filtered

    // Filter by specific achievement category
    const achievementFilterInput: AnalyticsQueryInput = {
      achievement_category: 'Leadership'
    };
    const achievementResult = await getAnalytics(achievementFilterInput);

    expect(achievementResult.total_goals).toEqual(3); // Goals not filtered
    expect(achievementResult.total_achievements).toEqual(1);
    expect(achievementResult.achievements_by_category['Leadership']).toEqual(1);
    expect(achievementResult.achievements_by_category['Goal_Completion']).toBeUndefined();
  });

  it('should handle combined filters correctly', async () => {
    // Create test users in same department
    const users = await db.insert(usersTable)
      .values([
        { ...testUser1 },
        { ...testUser2, department: 'Engineering' } // Both in Engineering
      ])
      .returning()
      .execute();

    const user1 = users[0];
    const user2 = users[1];

    const targetDate = new Date('2024-02-01');

    // Create goals and achievements for combined filtering
    await db.insert(goalsTable)
      .values([
        {
          title: 'Target Goal',
          description: 'Goal matching all criteria',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null,
          created_at: targetDate
        },
        {
          title: 'Wrong Date Goal',
          description: 'Goal with wrong date',
          status: 'Completed',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null,
          created_at: new Date('2024-01-01')
        },
        {
          title: 'Wrong Status Goal',
          description: 'Goal with wrong status',
          status: 'Draft',
          priority: 'High',
          employee_id: user1.id,
          manager_id: null,
          created_at: targetDate
        }
      ])
      .execute();

    await db.insert(achievementsTable)
      .values([
        {
          title: 'Target Achievement',
          description: 'Achievement matching criteria',
          category: 'Goal_Completion',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: targetDate
        },
        {
          title: 'Wrong Category Achievement',
          description: 'Achievement with wrong category',
          category: 'Leadership',
          employee_id: user1.id,
          goal_id: null,
          achieved_date: targetDate
        }
      ])
      .execute();

    // Apply combined filters
    const input: AnalyticsQueryInput = {
      department: 'Engineering',
      goal_status: 'Completed',
      achievement_category: 'Goal_Completion',
      date_from: new Date('2024-01-15'),
      date_to: new Date('2024-02-15')
    };

    const result = await getAnalytics(input);

    expect(result.total_goals).toEqual(1);
    expect(result.completed_goals).toEqual(1);
    expect(result.pending_goals).toEqual(0);
    expect(result.total_achievements).toEqual(1);
    expect(result.completion_rate).toEqual(100);
    expect(result.achievements_by_category['Goal_Completion']).toEqual(1);
  });
});