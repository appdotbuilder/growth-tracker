import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['Employee', 'Manager', 'HR_Admin', 'System_Admin']);
export const goalStatusEnum = pgEnum('goal_status', ['Draft', 'Pending_Approval', 'Approved', 'In_Progress', 'Completed', 'Cancelled']);
export const goalPriorityEnum = pgEnum('goal_priority', ['Low', 'Medium', 'High', 'Critical']);
export const achievementCategoryEnum = pgEnum('achievement_category', ['Goal_Completion', 'Skill_Development', 'Leadership', 'Innovation', 'Collaboration', 'Performance']);
export const messageTypeEnum = pgEnum('message_type', ['User', 'Assistant']);
export const integrationTypeEnum = pgEnum('integration_type', ['HRIS', 'Learning_Management', 'Performance_Review', 'Calendar', 'Communication']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: userRoleEnum('role').notNull(),
  department: text('department'),
  manager_id: integer('manager_id'),
  profile_picture: text('profile_picture'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Goals table
export const goalsTable = pgTable('goals', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: goalStatusEnum('status').default('Draft').notNull(),
  priority: goalPriorityEnum('priority').notNull(),
  employee_id: integer('employee_id').notNull(),
  manager_id: integer('manager_id'),
  due_date: timestamp('due_date'),
  completed_date: timestamp('completed_date'),
  approval_date: timestamp('approval_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Achievements table
export const achievementsTable = pgTable('achievements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: achievementCategoryEnum('category').notNull(),
  employee_id: integer('employee_id').notNull(),
  goal_id: integer('goal_id'),
  achieved_date: timestamp('achieved_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Chat sessions table
export const chatSessionsTable = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  title: text('title'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Chat messages table
export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id').notNull(),
  message_type: messageTypeEnum('message_type').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Integrations table
export const integrationsTable = pgTable('integrations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: integrationTypeEnum('type').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  config: text('config').notNull(), // JSON string
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Team memberships table (for managing who reports to whom)
export const teamMembershipsTable = pgTable('team_memberships', {
  id: serial('id').primaryKey(),
  manager_id: integer('manager_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  manager: one(usersTable, {
    fields: [usersTable.manager_id],
    references: [usersTable.id]
  }),
  directReports: many(usersTable),
  goals: many(goalsTable, { relationName: 'employee_goals' }),
  managedGoals: many(goalsTable, { relationName: 'managed_goals' }),
  achievements: many(achievementsTable),
  chatSessions: many(chatSessionsTable),
  teamMembershipsAsManager: many(teamMembershipsTable, { relationName: 'manager_memberships' }),
  teamMembershipsAsEmployee: many(teamMembershipsTable, { relationName: 'employee_memberships' })
}));

export const goalsRelations = relations(goalsTable, ({ one, many }) => ({
  employee: one(usersTable, {
    fields: [goalsTable.employee_id],
    references: [usersTable.id],
    relationName: 'employee_goals'
  }),
  manager: one(usersTable, {
    fields: [goalsTable.manager_id],
    references: [usersTable.id],
    relationName: 'managed_goals'
  }),
  achievements: many(achievementsTable)
}));

export const achievementsRelations = relations(achievementsTable, ({ one }) => ({
  employee: one(usersTable, {
    fields: [achievementsTable.employee_id],
    references: [usersTable.id]
  }),
  goal: one(goalsTable, {
    fields: [achievementsTable.goal_id],
    references: [goalsTable.id]
  })
}));

export const chatSessionsRelations = relations(chatSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [chatSessionsTable.user_id],
    references: [usersTable.id]
  }),
  messages: many(chatMessagesTable)
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  session: one(chatSessionsTable, {
    fields: [chatMessagesTable.session_id],
    references: [chatSessionsTable.id]
  })
}));

export const teamMembershipsRelations = relations(teamMembershipsTable, ({ one }) => ({
  manager: one(usersTable, {
    fields: [teamMembershipsTable.manager_id],
    references: [usersTable.id],
    relationName: 'manager_memberships'
  }),
  employee: one(usersTable, {
    fields: [teamMembershipsTable.employee_id],
    references: [usersTable.id],
    relationName: 'employee_memberships'
  })
}));

// TypeScript types for table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Goal = typeof goalsTable.$inferSelect;
export type NewGoal = typeof goalsTable.$inferInsert;

export type Achievement = typeof achievementsTable.$inferSelect;
export type NewAchievement = typeof achievementsTable.$inferInsert;

export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type NewChatSession = typeof chatSessionsTable.$inferInsert;

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewChatMessage = typeof chatMessagesTable.$inferInsert;

export type Integration = typeof integrationsTable.$inferSelect;
export type NewIntegration = typeof integrationsTable.$inferInsert;

export type TeamMembership = typeof teamMembershipsTable.$inferSelect;
export type NewTeamMembership = typeof teamMembershipsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  goals: goalsTable,
  achievements: achievementsTable,
  chatSessions: chatSessionsTable,
  chatMessages: chatMessagesTable,
  integrations: integrationsTable,
  teamMemberships: teamMembershipsTable
};