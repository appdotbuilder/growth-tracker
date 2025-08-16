import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { goalsTable, usersTable } from '../db/schema';
import { type CreateGoalInput } from '../schema';
import { createGoal } from '../handlers/create_goal';
import { eq } from 'drizzle-orm';

// Test user data
const testEmployee = {
  email: 'employee@test.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee' as const,
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testManager = {
  email: 'manager@test.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Manager' as const,
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

describe('createGoal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a goal with all required fields', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const employee = employeeResult[0];

    // Create test manager
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const manager = managerResult[0];

    const testInput: CreateGoalInput = {
      title: 'Complete Project Alpha',
      description: 'Finish the Alpha project by the end of Q4',
      priority: 'High',
      employee_id: employee.id,
      manager_id: manager.id,
      due_date: new Date('2024-12-31')
    };

    const result = await createGoal(testInput);

    // Verify returned goal
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Complete Project Alpha');
    expect(result.description).toEqual('Finish the Alpha project by the end of Q4');
    expect(result.priority).toEqual('High');
    expect(result.status).toEqual('Draft'); // Default status
    expect(result.employee_id).toEqual(employee.id);
    expect(result.manager_id).toEqual(manager.id);
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toEqual(new Date('2024-12-31').getTime());
    expect(result.completed_date).toBeNull();
    expect(result.approval_date).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a goal without manager_id', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const testInput: CreateGoalInput = {
      title: 'Self Development Goal',
      description: 'Learn new programming language',
      priority: 'Medium',
      employee_id: employee.id,
      manager_id: null,
      due_date: null
    };

    const result = await createGoal(testInput);

    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Self Development Goal');
    expect(result.description).toEqual('Learn new programming language');
    expect(result.priority).toEqual('Medium');
    expect(result.status).toEqual('Draft');
    expect(result.employee_id).toEqual(employee.id);
    expect(result.manager_id).toBeNull();
    expect(result.due_date).toBeNull();
  });

  it('should save goal to database correctly', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const testInput: CreateGoalInput = {
      title: 'Database Test Goal',
      description: 'Testing database persistence',
      priority: 'Low',
      employee_id: employee.id,
      manager_id: null,
      due_date: new Date('2024-06-15')
    };

    const result = await createGoal(testInput);

    // Verify goal exists in database
    const goals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, result.id))
      .execute();

    expect(goals).toHaveLength(1);
    const savedGoal = goals[0];
    expect(savedGoal.title).toEqual('Database Test Goal');
    expect(savedGoal.description).toEqual('Testing database persistence');
    expect(savedGoal.priority).toEqual('Low');
    expect(savedGoal.status).toEqual('Draft');
    expect(savedGoal.employee_id).toEqual(employee.id);
    expect(savedGoal.manager_id).toBeNull();
    expect(savedGoal.due_date).toBeInstanceOf(Date);
    expect(savedGoal.created_at).toBeInstanceOf(Date);
    expect(savedGoal.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when employee does not exist', async () => {
    const testInput: CreateGoalInput = {
      title: 'Invalid Employee Goal',
      description: 'This should fail',
      priority: 'High',
      employee_id: 99999, // Non-existent employee
      manager_id: null,
      due_date: null
    };

    await expect(createGoal(testInput)).rejects.toThrow(/employee not found/i);
  });

  it('should throw error when manager does not exist', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const testInput: CreateGoalInput = {
      title: 'Invalid Manager Goal',
      description: 'This should fail due to invalid manager',
      priority: 'High',
      employee_id: employee.id,
      manager_id: 99999, // Non-existent manager
      due_date: null
    };

    await expect(createGoal(testInput)).rejects.toThrow(/manager not found/i);
  });

  it('should handle all priority levels correctly', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const priorities = ['Low', 'Medium', 'High', 'Critical'] as const;

    for (const priority of priorities) {
      const testInput: CreateGoalInput = {
        title: `${priority} Priority Goal`,
        description: `Testing ${priority} priority`,
        priority: priority,
        employee_id: employee.id,
        manager_id: null,
        due_date: null
      };

      const result = await createGoal(testInput);
      expect(result.priority).toEqual(priority);
      expect(result.status).toEqual('Draft');
    }
  });

  it('should handle date fields correctly', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values(testEmployee)
      .returning()
      .execute();
    const employee = employeeResult[0];

    const testDate = new Date('2024-08-15T10:30:00Z');
    
    const testInput: CreateGoalInput = {
      title: 'Date Test Goal',
      description: 'Testing date handling',
      priority: 'Medium',
      employee_id: employee.id,
      manager_id: null,
      due_date: testDate
    };

    const result = await createGoal(testInput);
    
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toEqual(testDate.getTime());
    expect(result.completed_date).toBeNull();
    expect(result.approval_date).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});