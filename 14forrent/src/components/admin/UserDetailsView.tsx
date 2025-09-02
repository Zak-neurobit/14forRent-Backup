
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Calendar, Shield, Activity } from "lucide-react";

interface User {
  id: string;
  email: string;
  last_sign_in_at: string;
  created_at: string;
  is_active: boolean;
  role: string;
  isAdmin: boolean;
  display_name?: string;
  avatar_url?: string;
}

interface UserDetailsViewProps {
  users: User[];
  onBack: () => void;
  totalUsers: number;
}

export const UserDetailsView: React.FC<UserDetailsViewProps> = ({ users, onBack, totalUsers }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">User Details ({totalUsers} total users)</h2>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.display_name || user.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user.display_name || user.email.split('@')[0]}</p>
                  <p className="text-sm text-gray-500 font-normal">{user.email}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Last Sign In</p>
                    <p className="text-sm text-gray-600">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.isAdmin && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
