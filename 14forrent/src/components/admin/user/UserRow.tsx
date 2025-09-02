
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, UserCheck, Trash2, ShieldCheck } from "lucide-react";

interface UserRowProps {
  user: {
    id: string;
    email: string;
    last_sign_in_at: string;
    created_at: string;
    is_active: boolean;
    role: string;
    isAdmin: boolean;
    display_name?: string;
    avatar_url?: string;
  };
  onAction: (user: any, action: string) => void;
}

export const UserRow: React.FC<UserRowProps> = ({ user, onAction }) => {
  return (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="h-8 w-8 rounded-full" />
            ) : (
              <User size={16} className="text-gray-500" />
            )}
          </div>
          <div>
            <div className="font-medium">{user.display_name || user.email.split('@')[0]}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {user.isAdmin ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Admin</Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">User</Badge>
        )}
      </TableCell>
      <TableCell>
        {user.is_active ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>
        )}
      </TableCell>
      <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</TableCell>
      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {user.is_active ? (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onAction(user, 'deactivate')}
              className="text-amber-500 border-amber-300 hover:bg-amber-50"
              title="Deactivate User"
            >
              <User size={16} />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onAction(user, 'activate')}
              className="text-green-500 border-green-300 hover:bg-green-50"
              title="Activate User"
            >
              <UserCheck size={16} />
            </Button>
          )}
          
          {user.isAdmin ? (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onAction(user, 'removeAdmin')}
              className="text-blue-500 border-blue-300 hover:bg-blue-50"
              title="Remove Admin Role"
            >
              <ShieldCheck size={16} />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onAction(user, 'makeAdmin')}
              className="text-purple-500 border-purple-300 hover:bg-purple-50"
              title="Make Admin"
            >
              <ShieldCheck size={16} />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onAction(user, 'delete')}
            className="text-red-500 border-red-300 hover:bg-red-50"
            title="Delete User"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
