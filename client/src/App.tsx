import React, { useState, useEffect } from 'react';
import './App.css';

// Minimal type definitions
interface User {
  id: number;
  name: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize immediately without delay
    setUser({ id: 1, name: 'John Doe', role: 'Manager' });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GrowthTracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">🚀 GrowthTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex space-x-4">
          {['dashboard', 'goals', 'achievements', 'chat', 'team', 'analytics', 'profile'].map((item) => (
            <button
              key={item}
              onClick={() => setPage(item)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                page === item 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {page === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-gray-600 mb-6">
                Here's your professional growth overview
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">G</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">5</p>
                      <p className="text-sm text-gray-600">Active Goals</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">A</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-sm text-gray-600">Achievements</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">P</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">2</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">T</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">8</p>
                      <p className="text-sm text-gray-600">Team Size</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Completed React Training Goal</h4>
                    <p className="text-sm text-gray-600 mt-1">Successfully finished advanced React course</p>
                    <p className="text-xs text-gray-500 mt-2">2 days ago</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">Leadership Achievement Unlocked</h4>
                    <p className="text-sm text-gray-600 mt-1">Recognized for mentoring team members</p>
                    <p className="text-xs text-gray-500 mt-2">1 week ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page !== 'dashboard' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {page === 'goals' && '🎯'}
                  {page === 'achievements' && '🏆'}
                  {page === 'chat' && '💬'}
                  {page === 'team' && '👥'}
                  {page === 'analytics' && '📊'}
                  {page === 'profile' && '👤'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </h2>
              <p className="text-gray-600 mb-4">
                {page === 'goals' && 'Track and manage your professional goals'}
                {page === 'achievements' && 'Celebrate your professional milestones'}
                {page === 'chat' && 'Get personalized career guidance from AI'}
                {page === 'team' && 'Manage your team and review progress'}
                {page === 'analytics' && 'View comprehensive growth insights'}
                {page === 'profile' && 'Manage your account and preferences'}
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Explore {page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;