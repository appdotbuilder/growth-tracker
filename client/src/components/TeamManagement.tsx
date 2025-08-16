import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Target, Trophy, Clock, CheckCircle2, Search, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, Goal, Achievement } from '../../../server/src/schema';

interface TeamManagementProps {
  currentUser: User | null;
}

export function TeamManagement({ currentUser }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [memberGoals, setMemberGoals] = useState<Goal[]>([]);
  const [memberAchievements, setMemberAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTeamMembers = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getTeamMembers.query({ managerId: currentUser.id });
      setTeamMembers(result);
      
      // Also load all users for adding new team members
      const users = await trpc.getUsers.query();
      setAllUsers(users.filter(u => u.id !== currentUser.id && u.manager_id !== currentUser.id));
    } catch (error) {
      console.error('Failed to load team members:', error);
      // Using stub data when API fails
      setTeamMembers([]);
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const loadMemberData = useCallback(async (memberId: number) => {
    try {
      const [goals, achievements] = await Promise.all([
        trpc.getGoalsByEmployee.query({ employeeId: memberId }),
        trpc.getAchievementsByEmployee.query({ employeeId: memberId })
      ]);
      setMemberGoals(goals);
      setMemberAchievements(achievements);
    } catch (error) {
      console.error('Failed to load member data:', error);
      // Using stub data when API fails
      setMemberGoals([]);
      setMemberAchievements([]);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  useEffect(() => {
    if (selectedMember) {
      loadMemberData(selectedMember.id);
    }
  }, [selectedMember, loadMemberData]);

  const handleAddTeamMember = async (employeeId: number) => {
    if (!currentUser) return;

    try {
      await trpc.createTeamMembership.mutate({
        manager_id: currentUser.id,
        employee_id: employeeId
      });
      
      // Refresh team members
      loadTeamMembers();
      setIsAddMemberDialogOpen(false);
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleApproveGoal = async (goalId: number) => {
    if (!currentUser) return;

    try {
      await trpc.approveGoal.mutate({
        goalId,
        managerId: currentUser.id
      });
      
      // Refresh member goals
      if (selectedMember) {
        loadMemberData(selectedMember.id);
      }
    } catch (error) {
      console.error('Failed to approve goal:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-${status.toLowerCase().replace('_', '-')}`;
  };

  const getPriorityBadgeClass = (priority: string) => {
    return `status-badge priority-${priority.toLowerCase()}`;
  };

  const filteredMembers = teamMembers.filter((member: User) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (!currentUser || (currentUser.role !== 'Manager' && currentUser.role !== 'HR_Admin' && currentUser.role !== 'System_Admin')) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Access Restricted</h3>
        <p className="text-slate-600">You need manager or admin privileges to access team management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Team Management</h1>
          <p className="text-slate-600">Manage your team members and review their progress</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Select an employee to add to your team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Available Employees</Label>
                  <div className="max-h-60 overflow-y-auto mt-2 space-y-2">
                    {allUsers.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center">
                        No available employees to add
                      </p>
                    ) : (
                      allUsers.map((user: User) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profile_picture || undefined} />
                              <AvatarFallback>
                                {user.first_name[0]}{user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                              {user.department && (
                                <p className="text-xs text-slate-400">{user.department}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddTeamMember(user.id)}
                          >
                            Add
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{teamMembers.length}</p>
                <p className="text-sm text-slate-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {memberGoals.filter(g => g.status === 'Completed').length}
                </p>
                <p className="text-sm text-slate-600">Completed Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {memberGoals.filter(g => g.status === 'Pending_Approval').length}
                </p>
                <p className="text-sm text-slate-600">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{memberAchievements.length}</p>
                <p className="text-sm text-slate-600">Team Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Select a member to view their details</CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Loading team members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">
                  {teamMembers.length === 0 
                    ? "No team members yet. Add employees to your team to get started."
                    : "No members match your search criteria."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member: User) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMember?.id === member.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile_picture || undefined} />
                        <AvatarFallback>
                          {member.first_name[0]}{member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{member.email}</p>
                        {member.department && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {member.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedMember
                ? `${selectedMember.first_name} ${selectedMember.last_name}`
                : 'Select a Team Member'
              }
            </CardTitle>
            <CardDescription>
              {selectedMember
                ? 'View goals, achievements, and manage approvals'
                : 'Choose a team member from the list to view their details'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedMember ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Select a team member to view their progress and manage their goals.</p>
              </div>
            ) : (
              <Tabs defaultValue="goals" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="goals" className="space-y-4">
                  {memberGoals.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">No goals found for this team member.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberGoals.map((goal: Goal) => (
                        <div key={goal.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-slate-800">{goal.title}</h4>
                            <div className="flex gap-2">
                              <Badge className={getPriorityBadgeClass(goal.priority)}>
                                {goal.priority}
                              </Badge>
                              <Badge className={getStatusBadgeClass(goal.status)}>
                                {goal.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              {goal.due_date && `Due: ${goal.due_date.toLocaleDateString()}`}
                            </div>
                            {goal.status === 'Pending_Approval' && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveGoal(goal.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="achievements" className="space-y-4">
                  {memberAchievements.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">No achievements recorded for this team member.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberAchievements.map((achievement: Achievement) => (
                        <div key={achievement.id} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <Trophy className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">{achievement.title}</h4>
                              <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline">
                                  {achievement.category.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {achievement.achieved_date.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}