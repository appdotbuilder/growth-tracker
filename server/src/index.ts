import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  updateUserInputSchema,
  createGoalInputSchema,
  updateGoalInputSchema,
  createAchievementInputSchema,
  createChatSessionInputSchema,
  createChatMessageInputSchema,
  createTeamMembershipInputSchema,
  createIntegrationInputSchema,
  updateIntegrationInputSchema,
  analyticsQueryInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { createGoal } from './handlers/create_goal';
import { getGoals } from './handlers/get_goals';
import { getGoalsByEmployee } from './handlers/get_goals_by_employee';
import { updateGoal } from './handlers/update_goal';
import { approveGoal } from './handlers/approve_goal';
import { createAchievement } from './handlers/create_achievement';
import { getAchievementsByEmployee } from './handlers/get_achievements_by_employee';
import { createChatSession } from './handlers/create_chat_session';
import { createChatMessage } from './handlers/create_chat_message';
import { getChatSessionsByUser } from './handlers/get_chat_sessions_by_user';
import { getChatMessagesBySession } from './handlers/get_chat_messages_by_session';
import { getTeamMembers } from './handlers/get_team_members';
import { createTeamMembership } from './handlers/create_team_membership';
import { getIntegrations } from './handlers/get_integrations';
import { createIntegration } from './handlers/create_integration';
import { updateIntegration } from './handlers/update_integration';
import { getAnalytics } from './handlers/get_analytics';
import { getDashboardData } from './handlers/get_dashboard_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  getUserById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getUserById(input.id)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Goal management routes
  createGoal: publicProcedure
    .input(createGoalInputSchema)
    .mutation(({ input }) => createGoal(input)),
  
  getGoals: publicProcedure
    .query(() => getGoals()),
  
  getGoalsByEmployee: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(({ input }) => getGoalsByEmployee(input.employeeId)),
  
  updateGoal: publicProcedure
    .input(updateGoalInputSchema)
    .mutation(({ input }) => updateGoal(input)),
  
  approveGoal: publicProcedure
    .input(z.object({ goalId: z.number(), managerId: z.number() }))
    .mutation(({ input }) => approveGoal(input.goalId, input.managerId)),

  // Achievement routes
  createAchievement: publicProcedure
    .input(createAchievementInputSchema)
    .mutation(({ input }) => createAchievement(input)),
  
  getAchievementsByEmployee: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(({ input }) => getAchievementsByEmployee(input.employeeId)),

  // Chat routes
  createChatSession: publicProcedure
    .input(createChatSessionInputSchema)
    .mutation(({ input }) => createChatSession(input)),
  
  createChatMessage: publicProcedure
    .input(createChatMessageInputSchema)
    .mutation(({ input }) => createChatMessage(input)),
  
  getChatSessionsByUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getChatSessionsByUser(input.userId)),
  
  getChatMessagesBySession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getChatMessagesBySession(input.sessionId)),

  // Team management routes
  getTeamMembers: publicProcedure
    .input(z.object({ managerId: z.number() }))
    .query(({ input }) => getTeamMembers(input.managerId)),
  
  createTeamMembership: publicProcedure
    .input(createTeamMembershipInputSchema)
    .mutation(({ input }) => createTeamMembership(input)),

  // Integration routes
  getIntegrations: publicProcedure
    .query(() => getIntegrations()),
  
  createIntegration: publicProcedure
    .input(createIntegrationInputSchema)
    .mutation(({ input }) => createIntegration(input)),
  
  updateIntegration: publicProcedure
    .input(updateIntegrationInputSchema)
    .mutation(({ input }) => updateIntegration(input)),

  // Analytics routes
  getAnalytics: publicProcedure
    .input(analyticsQueryInputSchema)
    .query(({ input }) => getAnalytics(input)),
  
  getDashboardData: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getDashboardData(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();