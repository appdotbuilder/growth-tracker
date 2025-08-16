import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['Employee', 'Manager', 'HR_Admin', 'System_Admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Goal status enum
export const goalStatusSchema = z.enum(['Draft', 'Pending_Approval', 'Approved', 'In_Progress', 'Completed', 'Cancelled']);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

// Goal priority enum
export const goalPrioritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);
export type GoalPriority = z.infer<typeof goalPrioritySchema>;

// Achievement category enum
export const achievementCategorySchema = z.enum(['Goal_Completion', 'Skill_Development', 'Leadership', 'Innovation', 'Collaboration', 'Performance']);
export type AchievementCategory = z.infer<typeof achievementCategorySchema>;

// Chat message type enum
export const messageTypeSchema = z.enum(['User', 'Assistant']);
export type MessageType = z.infer<typeof messageTypeSchema>;

// Integration type enum
export const integrationTypeSchema = z.enum(['HRIS', 'Learning_Management', 'Performance_Review', 'Calendar', 'Communication']);
export type IntegrationType = z.infer<typeof integrationTypeSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  department: z.string().nullable(),
  manager_id: z.number().nullable(),
  profile_picture: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Create user input schema
export const createUserInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: userRoleSchema,
  department: z.string().nullable(),
  manager_id: z.number().nullable(),
  profile_picture: z.string().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Update user input schema
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  department: z.string().nullable().optional(),
  manager_id: z.number().nullable().optional(),
  profile_picture: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Goal schema
export const goalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: goalStatusSchema,
  priority: goalPrioritySchema,
  employee_id: z.number(),
  manager_id: z.number().nullable(),
  due_date: z.coerce.date().nullable(),
  completed_date: z.coerce.date().nullable(),
  approval_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Goal = z.infer<typeof goalSchema>;

// Create goal input schema
export const createGoalInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: goalPrioritySchema,
  employee_id: z.number(),
  manager_id: z.number().nullable(),
  due_date: z.coerce.date().nullable()
});

export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;

// Update goal input schema
export const updateGoalInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: goalStatusSchema.optional(),
  priority: goalPrioritySchema.optional(),
  manager_id: z.number().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  completed_date: z.coerce.date().nullable().optional(),
  approval_date: z.coerce.date().nullable().optional()
});

export type UpdateGoalInput = z.infer<typeof updateGoalInputSchema>;

// Achievement schema
export const achievementSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: achievementCategorySchema,
  employee_id: z.number(),
  goal_id: z.number().nullable(),
  achieved_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Achievement = z.infer<typeof achievementSchema>;

// Create achievement input schema
export const createAchievementInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: achievementCategorySchema,
  employee_id: z.number(),
  goal_id: z.number().nullable(),
  achieved_date: z.coerce.date()
});

export type CreateAchievementInput = z.infer<typeof createAchievementInputSchema>;

// Chat session schema
export const chatSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

// Create chat session input schema
export const createChatSessionInputSchema = z.object({
  user_id: z.number(),
  title: z.string().nullable()
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionInputSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  message_type: messageTypeSchema,
  content: z.string(),
  created_at: z.coerce.date()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Create chat message input schema
export const createChatMessageInputSchema = z.object({
  session_id: z.number(),
  message_type: messageTypeSchema,
  content: z.string().min(1)
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageInputSchema>;

// Integration schema
export const integrationSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: integrationTypeSchema,
  enabled: z.boolean(),
  config: z.string(), // JSON string
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Integration = z.infer<typeof integrationSchema>;

// Create integration input schema
export const createIntegrationInputSchema = z.object({
  name: z.string().min(1),
  type: integrationTypeSchema,
  enabled: z.boolean().default(false),
  config: z.string() // JSON string
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationInputSchema>;

// Update integration input schema
export const updateIntegrationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  config: z.string().optional() // JSON string
});

export type UpdateIntegrationInput = z.infer<typeof updateIntegrationInputSchema>;

// Team membership schema
export const teamMembershipSchema = z.object({
  id: z.number(),
  manager_id: z.number(),
  employee_id: z.number(),
  created_at: z.coerce.date()
});

export type TeamMembership = z.infer<typeof teamMembershipSchema>;

// Create team membership input schema
export const createTeamMembershipInputSchema = z.object({
  manager_id: z.number(),
  employee_id: z.number()
});

export type CreateTeamMembershipInput = z.infer<typeof createTeamMembershipInputSchema>;

// Analytics query input schema
export const analyticsQueryInputSchema = z.object({
  user_id: z.number().optional(),
  department: z.string().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  goal_status: goalStatusSchema.optional(),
  achievement_category: achievementCategorySchema.optional()
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQueryInputSchema>;

// Analytics response schema
export const analyticsResponseSchema = z.object({
  total_goals: z.number(),
  completed_goals: z.number(),
  pending_goals: z.number(),
  total_achievements: z.number(),
  achievements_by_category: z.record(z.number()),
  goals_by_priority: z.record(z.number()),
  completion_rate: z.number(),
  average_completion_time: z.number().nullable()
});

export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;