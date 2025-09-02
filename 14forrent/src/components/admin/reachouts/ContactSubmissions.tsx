import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Phone, User, Home, Calendar, Eye, CheckCircle, Archive } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id: string | null;
  property_title: string | null;
  submitted_at: string;
  status: string;
  notes: string | null;
  responded_at: string | null;
  responded_by: string | null;
}

const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    try {
      console.log("Fetching contact submissions...");
      
      let query = supabase
        .from('contact_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Contact submissions fetched:", data);
      setSubmissions(data || []);
    } catch (error: any) {
      console.error("Error fetching contact submissions:", error);
      const errorMessage = error?.message || "Failed to load contact form submissions";
      toast.error(errorMessage, {
        description: error?.details || "Please check if you have admin access and the table exists."
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      const updateData: any = { status };
      
      if (status === 'responded') {
        updateData.responded_at = new Date().toISOString();
        updateData.responded_by = user?.id;
      }

      const { error } = await supabase
        .from('contact_submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) throw error;
      
      toast.success(`Status updated to ${status}`);
      fetchSubmissions();
      setDetailsOpen(false);
    } catch (error) {
      console.error("Error updating submission status:", error);
      toast.error("Failed to update status");
    }
  };

  const saveNotes = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ notes: adminNotes })
        .eq('id', submissionId);

      if (error) throw error;
      
      toast.success("Notes saved");
      fetchSubmissions();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const openDetails = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.notes || "");
    setDetailsOpen(true);
    
    // Mark as read if it's new
    if (submission.status === 'new') {
      updateSubmissionStatus(submission.id, 'read');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'read':
        return 'secondary';
      case 'responded':
        return 'outline';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            All ({submissions.length})
          </Badge>
          <Badge
            variant={statusFilter === 'new' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('new')}
          >
            New
          </Badge>
          <Badge
            variant={statusFilter === 'read' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('read')}
          >
            Read
          </Badge>
          <Badge
            variant={statusFilter === 'responded' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('responded')}
          >
            Responded
          </Badge>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contact form submissions</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{submission.name}</TableCell>
                  <TableCell>{submission.email}</TableCell>
                  <TableCell>{submission.phone}</TableCell>
                  <TableCell>
                    {submission.property_title ? (
                      <div className="flex items-center gap-1">
                        <Home size={14} />
                        <span className="text-sm">{submission.property_title}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">General inquiry</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetails(submission)}
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Form Submission Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && format(new Date(selectedSubmission.submitted_at), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={16} className="text-gray-400" />
                    <span>{selectedSubmission.name}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail size={16} className="text-gray-400" />
                    <a href={`mailto:${selectedSubmission.email}`} className="text-blue-600 hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`tel:${selectedSubmission.phone}`} className="text-blue-600 hover:underline">
                      {selectedSubmission.phone}
                    </a>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Property</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Home size={16} className="text-gray-400" />
                    <span>{selectedSubmission.property_title || "General inquiry"}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Message</label>
                <div className="mt-1 p-3 bg-gray-50 rounded">
                  {selectedSubmission.message}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="mt-1"
                  rows={3}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveNotes(selectedSubmission.id)}
                  className="mt-2"
                >
                  Save Notes
                </Button>
              </div>
              
              <div className="flex gap-2 justify-end pt-4 border-t">
                {selectedSubmission.status !== 'responded' && (
                  <Button
                    variant="default"
                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'responded')}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Mark as Responded
                  </Button>
                )}
                
                {selectedSubmission.status !== 'archived' && (
                  <Button
                    variant="outline"
                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'archived')}
                  >
                    <Archive size={16} className="mr-2" />
                    Archive
                  </Button>
                )}
              </div>
              
              {selectedSubmission.responded_at && (
                <div className="text-sm text-gray-500 text-center">
                  Responded on {format(new Date(selectedSubmission.responded_at), 'MMMM d, yyyy h:mm a')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactSubmissions;