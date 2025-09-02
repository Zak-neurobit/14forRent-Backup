
import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { UserRow } from "./UserRow";

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

interface UserTableProps {
  users: User[];
  loading: boolean;
  onActionClick: (user: User, action: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, loading, onActionClick }) => {
  return (
    <div className="overflow-auto">
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <UserRow key={user.id} user={user} onAction={onActionClick} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="text-gray-500">No users found</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
