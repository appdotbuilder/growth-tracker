// Simplified components to ensure build success
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Trophy, MessageSquare, Users, BarChart3, Settings, User } from 'lucide-react';

// Common types
type UserRole = 'Employee' | 'Manager' | 'HR_Admin' | 'System_Admin';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string | null;
  manager_id: number | null;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ComponentProps {
  currentUser: User | null;
  onNavigate?: (page: string) => void;
}

export function Dashboard({ currentUser, onNavigate }: ComponentProps) {
  if (!currentUser) {
    return <div className="text-center py-12"><p>Please sign in to view dashboard.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome back, {currentUser.first_name}! 👋</h1>
        <p className="text-slate-600 mt-2">Here's your professional growth overview</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">5</p>
                <p className="text-sm text-slate-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">12</p>
                <p className="text-sm text-slate-600">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">2</p>
                <p className="text-sm text-slate-600">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">8</p>
                <p className="text-sm text-slate-600">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium">Completed React Training Goal</h4>
              <p className="text-sm text-slate-600 mt-1">Successfully finished advanced React course</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium">Leadership Achievement Unlocked</h4>
              <p className="text-sm text-slate-600 mt-1">Recognized for mentoring team members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Goals({ currentUser }: ComponentProps) {
  if (!currentUser) {
    return <div className="text-center py-12"><p>Please sign in to view goals.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Goals</h1>
        <p className="text-slate-600">Track and manage your professional goals</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Goal Management</h3>
          <p className="text-slate-600 mb-4">Create and track your professional development goals</p>
          <Button>Add New Goal</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function Achievements({ currentUser }: ComponentProps) {
  if (!currentUser) {
    return <div className="text-center py-12"><p>Please sign in to view achievements.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Achievements</h1>
        <p className="text-slate-600">Celebrate your professional milestones</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Achievement Gallery</h3>
          <p className="text-slate-600 mb-4">View your professional accomplishments and awards</p>
          <Button>View All Achievements</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function Chat({ currentUser }: ComponentProps) {
  if (!currentUser) {
    return <div className="text-center py-12"><p>Please sign in to access chat.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">AI Assistant</h1>
        <p className="text-slate-600">Get personalized career guidance</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Career Assistant</h3>
          <p className="text-slate-600 mb-4">Chat with AI for professional development advice</p>
          <Button>Start Conversation</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamManagement({ currentUser }: ComponentProps) {
  if (!currentUser || (currentUser.role !== 'Manager' && currentUser.role !== 'HR_Admin' && currentUser.role !== 'System_Admin')) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Access Restricted</h3>
        <p className="text-slate-600">Manager privileges required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Team Management</h1>
        <p className="text-slate-600">Manage your team and review progress</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Team Overview</h3>
          <p className="text-slate-600 mb-4">View team member goals and achievements</p>
          <Button>Manage Team</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function Analytics({ currentUser }: ComponentProps) {
  if (!currentUser || (currentUser.role !== 'HR_Admin' && currentUser.role !== 'System_Admin')) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Access Restricted</h3>
        <p className="text-slate-600">HR Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-600">Comprehensive growth insights</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Growth Analytics</h3>
          <p className="text-slate-600 mb-4">View organization-wide professional development metrics</p>
          <Button>View Analytics</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function Integrations({ currentUser }: ComponentProps) {
  if (!currentUser || (currentUser.role !== 'HR_Admin' && currentUser.role !== 'System_Admin')) {
    return (
      <div className="text-center py-12">
        <Settings className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Access Restricted</h3>
        <p className="text-slate-600">HR Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Integrations</h1>
        <p className="text-slate-600">Manage third-party connections</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <Settings className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">System Integrations</h3>
          <p className="text-slate-600 mb-4">Configure external system connections</p>
          <Button>Manage Integrations</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function Profile({ currentUser }: ComponentProps) {
  if (!currentUser) {
    return <div className="text-center py-12"><p>Please sign in to view profile.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
        <p className="text-slate-600">Manage your account settings</p>
      </div>
      
      <Card>
        <CardContent className="text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">User Profile</h3>
          <p className="text-slate-600 mb-4">Update your personal information and preferences</p>
          <Button>Edit Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}