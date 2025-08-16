import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable } from '../db/schema';
import { getGoals } from '../handlers/get_goals';

// Test data
const testUser1 = {
  email: 'employee1@company.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee' as const,
  department: 'Engineering',
  manager_id: null
};

const testUser2 = {
  email: 'employee2@company.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Employee' as const,
  department: 'Marketing',
  manager_id: null
};

const testManager = {
  email: 'manager@company.com',
  first_name: 'Bob',
  last_name: 'Johnson',
  role: 'Manager' as const,
  department: 'Engineering',
  manager_id: null
};

describe('getGoals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no goals exist', async () => {
    const result = await getGoals();
    expect(result).toEqual([]);
  });

  it('should fetch all goals from database', async () => {
    // Create test users first
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2, testManager])
      .returning()
      .execute();

    const [employee1, employee2, manager] = users;

    // Create test goals
    const testGoals = [
      {
        title: 'Complete Project A',
        description: 'Finish the main project deliverables',
        priority: 'High' as const,
        employee_id: employee1.id,
        manager_id: manager.id,
        due_date: new Date('2024-06-01')
      },
      {
        title: 'Learn New Framework',
        description: 'Study and implement new technology',
        priority: 'Medium' as const,
        employee_id: employee2.id,
        manager_id: manager.id,
        due_date: new Date('2024-07-15')
      },
      {
        title: 'Team Collaboration',
        description: 'Improve cross-team communication',
        priority: 'Low' as const,
        employee_id: employee1.id,
        manager_id: null,
        due_date: null
      }
    ];

    await db.insert(goalsTable)
      .values(testGoals)
      .execute();

    const result = await getGoals();

    // Verify all goals are returned
    expect(result).toHaveLength(3);
    
    // Verify goal properties
    const goalTitles = result.map(goal => goal.title);
    expect(goalTitles).toContain('Complete Project A');
    expect(goalTitles).toContain('Learn New Framework');
    expect(goalTitles).toContain('Team Collaboration');

    // Verify data types and required fields
    result.forEach(goal => {
      expect(goal.id).toBeDefined();
      expect(typeof goal.id).toBe('number');
      expect(typeof goal.title).toBe('string');
      expect(typeof goal.description).toBe('string');
      expect(goal.status).toBeDefined();
      expect(goal.priority).toBeDefined();
      expect(typeof goal.employee_id).toBe('number');
      expect(goal.created_at).toBeInstanceOf(Date);
      expect(goal.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return goals ordered by creation date (newest first)', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create goals with different creation times (simulate by inserting in sequence)
    const goal1 = await db.insert(goalsTable)
      .values({
        title: 'First Goal',
        description: 'The first goal created',
        priority: 'Medium' as const,
        employee_id: user.id,
        manager_id: null,
        due_date: null
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const goal2 = await db.insert(goalsTable)
      .values({
        title: 'Second Goal',
        description: 'The second goal created',
        priority: 'High' as const,
        employee_id: user.id,
        manager_id: null,
        due_date: null
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const goal3 = await db.insert(goalsTable)
      .values({
        title: 'Third Goal',
        description: 'The third goal created',
        priority: 'Low' as const,
        employee_id: user.id,
        manager_id: null,
        due_date: null
      })
      .returning()
      .execute();

    const result = await getGoals();

    expect(result).toHaveLength(3);
    
    // Verify goals are ordered by creation date (newest first)
    expect(result[0].title).toBe('Third Goal');
    expect(result[1].title).toBe('Second Goal');
    expect(result[2].title).toBe('First Goal');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle goals with different statuses and priorities', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testManager])
      .returning()
      .execute();

    const [employee, manager] = users;

    // Create goals with various statuses and priorities
    const testGoals = [
      {
        title: 'Draft Goal',
        description: 'A goal in draft status',
        status: 'Draft' as const,
        priority: 'Critical' as const,
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-08-01')
      },
      {
        title: 'In Progress Goal',
        description: 'Currently working on this',
        status: 'In_Progress' as const,
        priority: 'High' as const,
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-09-01')
      },
      {
        title: 'Completed Goal',
        description: 'This goal is done',
        status: 'Completed' as const,
        priority: 'Medium' as const,
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-05-01'),
        completed_date: new Date('2024-04-30')
      }
    ];

    await db.insert(goalsTable)
      .values(testGoals)
      .execute();

    const result = await getGoals();

    expect(result).toHaveLength(3);

    // Verify all different statuses are present
    const statuses = result.map(goal => goal.status);
    expect(statuses).toContain('Draft');
    expect(statuses).toContain('In_Progress');
    expect(statuses).toContain('Completed');

    // Verify all different priorities are present
    const priorities = result.map(goal => goal.priority);
    expect(priorities).toContain('Critical');
    expect(priorities).toContain('High');
    expect(priorities).toContain('Medium');

    // Check completed goal has completion date
    const completedGoal = result.find(goal => goal.status === 'Completed');
    expect(completedGoal?.completed_date).toBeInstanceOf(Date);
  });

  it('should handle goals with nullable fields', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    // Create goal with nullable fields set to null
    await db.insert(goalsTable)
      .values({
        title: 'Goal with Nulls',
        description: 'Testing nullable fields',
        priority: 'Low' as const,
        employee_id: user.id,
        manager_id: null,
        due_date: null,
        completed_date: null,
        approval_date: null
      })
      .execute();

    const result = await getGoals();

    expect(result).toHaveLength(1);
    
    const goal = result[0];
    expect(goal.manager_id).toBeNull();
    expect(goal.due_date).toBeNull();
    expect(goal.completed_date).toBeNull();
    expect(goal.approval_date).toBeNull();
  });
});