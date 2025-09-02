
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserDialog } from "./user/UserDialog";
import { UserTable } from "./user/UserTable";
import { useUserManagement } from "@/hooks/useUserManagement";

export const UserManagement = () => {
  const {
    users,
    loading,
    dialogOpen,
    setDialogOpen,
    dialogTitle,
    dialogDescription,
    processing,
    handleActionClick,
    handleActionConfirm,
    refreshUsers
  } = useUserManagement();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">User Management</h2>
          <button 
            onClick={refreshUsers}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Refresh
          </button>
        </div>
        <UserTable 
          users={users}
          loading={loading}
          onActionClick={handleActionClick}
        />
        
        {/* Confirmation Dialog */}
        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogTitle}
          description={dialogDescription}
          onConfirm={handleActionConfirm}
          processing={processing}
        />
      </CardContent>
    </Card>
  );
};
