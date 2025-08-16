import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Building, Users, Calendar, Settings, Save, Upload, Key } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User as UserType, UpdateUserInput, UserRole } from '../../../server/src/schema';

interface ProfileProps {
  currentUser: UserType | null;
}

export function Profile({ currentUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manager, setManager] = useState<UserType | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  const [formData, setFormData] = useState<UpdateUserInput>({
    id: currentUser?.id || 0,
    email: currentUser?.email || '',
    first_name: currentUser?.first_name || '',
    last_name: currentUser?.last_name || '',
    role: currentUser?.role || 'Employee',
    department: currentUser?.department || '',
    manager_id: currentUser?.manager_id || null,
    profile_picture: currentUser?.profile_picture || ''
  });

  const loadAdditionalData = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Load all users for manager selection (if current user is admin)
      if (currentUser.role === 'HR_Admin' || currentUser.role === 'System_Admin') {
        const users = await trpc.getUsers.query();
        setAllUsers(users.filter(u => u.id !== currentUser.id));
      }

      // Load manager information if user has a manager
      if (currentUser.manager_id) {
        const managerInfo = await trpc.getUserById.query({ id: currentUser.manager_id });
        setManager(managerInfo);
      }
    } catch (error) {
      console.error('Failed to load additional profile data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAdditionalData();
  }, [loadAdditionalData]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        id: currentUser.id,
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        role: currentUser.role,
        department: currentUser.department,
        manager_id: currentUser.manager_id,
        profile_picture: currentUser.profile_picture
      });
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await trpc.updateUser.mutate(formData);
      setIsEditing(false);
      // In a real app, you'd update the current user state here
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentUser) {
      setFormData({
        id: currentUser.id,
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        role: currentUser.role,
        department: currentUser.department,
        manager_id: currentUser.manager_id,
        profile_picture: currentUser.profile_picture
      });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'System_Admin':
        return 'bg-red-100 text-red-800';
      case 'HR_Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-600">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={currentUser.profile_picture || undefined} />
                <AvatarFallback className="text-2xl">
                  {currentUser.first_name[0]}{currentUser.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-slate-800">
                {currentUser.first_name} {currentUser.last_name}
              </h3>
              <p className="text-slate-600 mb-3">{currentUser.email}</p>
              <Badge className={`status-badge ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role.replace('_', ' ')}
              </Badge>
              
              {currentUser.department && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Building className="h-4 w-4" />
                    {currentUser.department}
                  </div>
                </div>
              )}

              {manager && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4" />
                    Manager: {manager.first_name} {manager.last_name}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  Member since {currentUser.created_at.toLocaleDateString()}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              {isEditing ? 'Update your profile information' : 'Your current account information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <form onSubmit={handleSave}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: UpdateUserInput) => ({ ...prev, first_name: e.target.value }))
                          }
                          disabled={!isEditing}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: UpdateUserInput) => ({ ...prev, last_name: e.target.value }))
                          }
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: UpdateUserInput) => ({ ...prev, email: e.target.value }))
                        }
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: UpdateUserInput) => ({ ...prev, department: e.target.value || null }))
                        }
                        disabled={!isEditing}
                        placeholder="Enter your department"
                      />
                    </div>

                    {(currentUser.role === 'HR_Admin' || currentUser.role === 'System_Admin') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value: UserRole) =>
                              setFormData((prev: UpdateUserInput) => ({ ...prev, role: value }))
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Employee">Employee</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="HR_Admin">HR Admin</SelectItem>
                              {currentUser.role === 'System_Admin' && (
                                <SelectItem value="System_Admin">System Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manager">Manager</Label>
                          <Select
                            value={formData.manager_id?.toString() || 'none'}
                            onValueChange={(value: string) =>
                              setFormData((prev: UpdateUserInput) => ({
                                ...prev,
                                manager_id: value === 'none' ? null : parseInt(value)
                              }))
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Manager</SelectItem>
                              {allUsers
                                .filter(u => u.role === 'Manager' || u.role === 'HR_Admin' || u.role === 'System_Admin')
                                .map((user: UserType) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="profile_picture">Profile Picture URL</Label>
                      <Input
                        id="profile_picture"
                        type="url"
                        value={formData.profile_picture || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: UpdateUserInput) => ({ ...prev, profile_picture: e.target.value || null }))
                        }
                        disabled={!isEditing}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={isSaving}>
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-4">Password & Security</h3>
                    
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-800 mb-2">Account Security Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Email verified</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Strong password policy enabled</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Two-factor authentication: Not enabled</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Enable Two-Factor Authentication
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Account Created</p>
                        <p className="font-medium">{currentUser.created_at.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Last Updated</p>
                        <p className="font-medium">{currentUser.updated_at.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">User ID</p>
                        <p className="font-mono text-xs font-medium">{currentUser.id}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Account Status</p>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}