import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable } from '../db/schema';
import { type CreateUserInput, type CreateGoalInput } from '../schema';
import { getGoalsByEmployee } from '../handlers/get_goals_by_employee';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
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

describe('getGoalsByEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return goals for a specific employee', async () => {
    // Create test users
    const [employee] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [manager] = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();

    // Create test goals for the employee
    const goalInputs: CreateGoalInput[] = [
      {
        title: 'Complete Project A',
        description: 'Finish the implementation of project A',
        priority: 'High',
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-12-31')
      },
      {
        title: 'Learn New Technology',
        description: 'Master React and TypeScript',
        priority: 'Medium',
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-11-30')
      }
    ];

    await db.insert(goalsTable)
      .values(goalInputs)
      .execute();

    // Test the handler
    const result = await getGoalsByEmployee(employee.id);

    // Verify results
    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Complete Project A');
    expect(result[0].employee_id).toEqual(employee.id);
    expect(result[0].manager_id).toEqual(manager.id);
    expect(result[0].priority).toEqual('High');
    expect(result[0].status).toEqual('Draft'); // Default status
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Learn New Technology');
    expect(result[1].employee_id).toEqual(employee.id);
    expect(result[1].priority).toEqual('Medium');
  });

  it('should return empty array for employee with no goals', async () => {
    // Create test user without goals
    const [employee] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await getGoalsByEmployee(employee.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent employee', async () => {
    const result = await getGoalsByEmployee(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return goals for the specified employee', async () => {
    // Create two employees
    const [employee1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [employee2] = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'employee2@example.com',
        first_name: 'Alice'
      })
      .returning()
      .execute();

    const [manager] = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();

    // Create goals for both employees
    await db.insert(goalsTable)
      .values([
        {
          title: 'Goal for Employee 1',
          description: 'First employee goal',
          priority: 'High',
          employee_id: employee1.id,
          manager_id: manager.id,
          due_date: new Date('2024-12-31')
        },
        {
          title: 'Goal for Employee 2',
          description: 'Second employee goal',
          priority: 'Medium',
          employee_id: employee2.id,
          manager_id: manager.id,
          due_date: new Date('2024-12-31')
        },
        {
          title: 'Another Goal for Employee 1',
          description: 'Another goal for first employee',
          priority: 'Low',
          employee_id: employee1.id,
          manager_id: manager.id,
          due_date: new Date('2024-12-31')
        }
      ])
      .execute();

    // Test getting goals for employee1
    const employee1Goals = await getGoalsByEmployee(employee1.id);
    expect(employee1Goals).toHaveLength(2);
    employee1Goals.forEach(goal => {
      expect(goal.employee_id).toEqual(employee1.id);
    });

    // Test getting goals for employee2
    const employee2Goals = await getGoalsByEmployee(employee2.id);
    expect(employee2Goals).toHaveLength(1);
    expect(employee2Goals[0].employee_id).toEqual(employee2.id);
    expect(employee2Goals[0].title).toEqual('Goal for Employee 2');
  });

  it('should return goals with all statuses and priorities', async () => {
    // Create test user
    const [employee] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [manager] = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();

    // Create goals with different statuses and priorities
    const goalData = [
      {
        title: 'Draft Goal',
        description: 'A draft goal',
        priority: 'Low' as const,
        status: 'Draft' as const,
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-12-31')
      },
      {
        title: 'Approved Goal',
        description: 'An approved goal',
        priority: 'Critical' as const,
        status: 'Approved' as const,
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-12-31')
      },
      {
        title: 'Completed Goal',
        description: 'A completed goal',
        priority: 'High' as const,
        status: 'Completed' as const,
        employee_id: employee.id,
        manager_id: manager.id,
        due_date: new Date('2024-12-31'),
        completed_date: new Date('2024-01-15')
      }
    ];

    await db.insert(goalsTable)
      .values(goalData)
      .execute();

    const result = await getGoalsByEmployee(employee.id);

    expect(result).toHaveLength(3);
    
    const draftGoal = result.find(g => g.title === 'Draft Goal');
    expect(draftGoal?.status).toEqual('Draft');
    expect(draftGoal?.priority).toEqual('Low');

    const approvedGoal = result.find(g => g.title === 'Approved Goal');
    expect(approvedGoal?.status).toEqual('Approved');
    expect(approvedGoal?.priority).toEqual('Critical');

    const completedGoal = result.find(g => g.title === 'Completed Goal');
    expect(completedGoal?.status).toEqual('Completed');
    expect(completedGoal?.priority).toEqual('High');
    expect(completedGoal?.completed_date).toBeInstanceOf(Date);
  });

  it('should handle goals with null optional fields', async () => {
    // Create test user
    const [employee] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create goal with minimal data (null optional fields)
    const goalInput: CreateGoalInput = {
      title: 'Simple Goal',
      description: 'A goal with minimal data',
      priority: 'Medium',
      employee_id: employee.id,
      manager_id: null,
      due_date: null
    };

    await db.insert(goalsTable)
      .values(goalInput)
      .execute();

    const result = await getGoalsByEmployee(employee.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Simple Goal');
    expect(result[0].manager_id).toBeNull();
    expect(result[0].due_date).toBeNull();
    expect(result[0].completed_date).toBeNull();
    expect(result[0].approval_date).toBeNull();
  });
});