
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogAction, setDialogAction] = useState<string>('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users...");
      // Get all profile fields (email doesn't exist in profiles table)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching profiles:", error);
        toast.error("Failed to load users");
        setUsers([]);
        return;
      }
      
      console.log("Profiles:", profiles);
      
      // Get admin roles directly from admin_roles table
      const { data: adminRolesData, error: adminRolesError } = await supabase
        .from('admin_roles')
        .select('user_id');
      
      if (adminRolesError) {
        console.error("Error fetching admin roles:", adminRolesError);
        if (adminRolesError.message.includes("Access denied")) {
          toast.error("Access denied", { 
            description: "You don't have admin privileges to view this data." 
          });
        }
      }
      
      // Create a set of admin user IDs for quick lookup
      const adminUserIds = new Set((adminRolesData || []).map((role: {user_id: string}) => role.user_id));
      
      // Combine all data
      if (profiles) {
        const usersWithData = profiles.map((profile: any) => {
          return {
            id: profile.id,
            email: 'User', // Email not available in profiles table
            last_sign_in_at: profile.updated_at || profile.created_at,
            created_at: profile.created_at,
            is_active: profile.is_active !== false,
            role: adminUserIds.has(profile.id) ? 'admin' : 'user',
            isAdmin: adminUserIds.has(profile.id),
            display_name: profile.display_name || 'User',
            avatar_url: profile.avatar_url || null
          };
        });
        
        setUsers(usersWithData);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred loading users");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (user: User, action: string) => {
    setSelectedUser(user);
    setDialogAction(action);
    
    switch (action) {
      case 'delete':
        setDialogTitle('Delete User');
        setDialogDescription(`Are you sure you want to delete ${user.email}? This action cannot be undone.`);
        break;
      case 'activate':
        setDialogTitle('Activate User');
        setDialogDescription(`Are you sure you want to activate ${user.email}?`);
        break;
      case 'deactivate':
        setDialogTitle('Deactivate User');
        setDialogDescription(`Are you sure you want to deactivate ${user.email}?`);
        break;
      case 'makeAdmin':
        setDialogTitle('Make Admin');
        setDialogDescription(`Are you sure you want to grant admin privileges to ${user.email}?`);
        break;
      case 'removeAdmin':
        setDialogTitle('Remove Admin');
        setDialogDescription(`Are you sure you want to remove admin privileges from ${user.email}?`);
        break;
      default:
        break;
    }
    
    setDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!selectedUser) return;
    
    setProcessing(true);
    let success = false;
    
    try {
      if (dialogAction === 'delete') {
        // Delete user using rpc function
        const { error } = await supabase.rpc('admin_delete_user', {
          user_id: selectedUser.id
        });
          
        success = !error;
        if (error) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user");
        }
      } else if (dialogAction === 'activate') {
        // Update user is_active status
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .eq('id', selectedUser.id);
          
        success = !error;
        if (error) {
          console.error("Error activating user:", error);
          toast.error("Failed to activate user");
        }
      } else if (dialogAction === 'deactivate') {
        // Update user is_active status
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', selectedUser.id);
          
        success = !error;
        if (error) {
          console.error("Error deactivating user:", error);
          toast.error("Failed to deactivate user");
        }
      } else if (dialogAction === 'makeAdmin') {
        // Add admin role using add_admin_role function
        const { error } = await supabase.rpc('add_admin_role', {
          target_user_id: selectedUser.id
        });
          
        success = !error;
        if (error) {
          console.error("Error granting admin role:", error);
          toast.error("Failed to grant admin role");
        }
      } else if (dialogAction === 'removeAdmin') {
        // Remove admin role using remove_admin_role function
        const { error } = await supabase.rpc('remove_admin_role', {
          target_user_id: selectedUser.id
        });
          
        success = !error;
        if (error) {
          console.error("Error removing admin role:", error);
          toast.error("Failed to remove admin role");
        }
      }
      
      if (success) {
        toast.success(`User ${dialogAction === 'makeAdmin' ? 'made admin' : dialogAction === 'removeAdmin' ? 'removed from admin' : dialogAction + 'd'} successfully`);
        fetchUsers(); // Refresh the user list
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setProcessing(false);
      setDialogOpen(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
    toast.info("Refreshing user list...");
  };

  return {
    users,
    loading,
    dialogOpen,
    setDialogOpen,
    selectedUser,
    dialogAction,
    dialogTitle,
    dialogDescription,
    processing,
    handleActionClick,
    handleActionConfirm,
    fetchUsers,
    refreshUsers
  };
};
