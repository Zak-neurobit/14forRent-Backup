
import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/services/notificationService";

interface ScheduleTourDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

// Helper function to send tour notifications
const sendTourNotifications = async (
  propertyId: string,
  propertyTitle: string,
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  scheduledDate: string,
  scheduledTime: string,
  description: string
) => {
  try {
    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('listings')
      .select('title, location, owner_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property details:', propertyError);
      return;
    }

    // Always send notification to jason@14forrent.com first (guaranteed delivery)
    await supabase.functions.invoke('send-email', {
      body: {
        to: 'jason@14forrent.com',
        subject: `New Tour Request - ${propertyTitle}`,
        template: 'admin_tour_notification',
        type: 'admin_tour_notification',
        data: {
          property_title: propertyTitle,
          property_location: property.location,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          description: description
        }
      }
    });

    // Send admin notification to other admins
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, users!inner(email)')
      .eq('role', 'admin');

    if (adminUsers && !adminError) {
      for (const admin of adminUsers) {
        // Skip if it's jason@14forrent.com (already sent above)
        if (admin.users.email === 'jason@14forrent.com') {
          continue;
        }

        // Send email notification
        await supabase.functions.invoke('send-email', {
          body: {
            to: admin.users.email,
            subject: `New Tour Request - ${propertyTitle}`,
            template: 'admin_tour_notification',
            type: 'admin_tour_notification',
            data: {
              property_title: propertyTitle,
              property_location: property.location,
              guest_name: guestName,
              guest_email: guestEmail,
              guest_phone: guestPhone,
              scheduled_date: scheduledDate,
              scheduled_time: scheduledTime,
              description: description
            }
          }
        });

        // Create in-app notification for admin
        await createNotification({
          user_id: admin.user_id,
          type: 'admin',
          message: `New tour request for "${propertyTitle}" from ${guestName} on ${scheduledDate}`,
          listing_id: propertyId
        });
      }
    }

    // Send owner notification (anonymous - no guest details)
    if (property.owner_id) {
      const { data: owner, error: ownerError } = await supabase
        .from('users')
        .select('email')
        .eq('id', property.owner_id)
        .single();

      if (owner && !ownerError) {
        // Send email notification
        await supabase.functions.invoke('send-email', {
          body: {
            to: owner.email,
            subject: `Tour Scheduled - ${propertyTitle}`,
            template: 'owner_tour_notification', 
            type: 'owner_tour_notification',
            data: {
              property_title: propertyTitle,
              property_location: property.location,
              scheduled_date: scheduledDate,
              scheduled_time: scheduledTime
            }
          }
        });

        // Create in-app notification for property owner
        await createNotification({
          user_id: property.owner_id,
          type: 'owner',
          message: `A tour has been scheduled for your property "${propertyTitle}" on ${scheduledDate}`,
          listing_id: propertyId
        });
      }
    }

    console.log('Tour notifications sent successfully');
  } catch (error) {
    console.error('Error sending tour notifications:', error);
    // Don't throw error to prevent breaking the main flow
  }
};

const ScheduleTourDialog = ({ 
  isOpen, 
  onClose, 
  propertyId, 
  propertyTitle 
}: ScheduleTourDialogProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill user data when logged in
  useEffect(() => {
    if (user && isOpen) {
      const fetchUserProfile = async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, phone_number')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setGuestName(profile.display_name || user.email?.split('@')[0] || '');
            setGuestPhone(profile.phone_number || '');
          }
          setGuestEmail(user.email || '');
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to basic user data
          setGuestName(user.email?.split('@')[0] || '');
          setGuestEmail(user.email || '');
        }
      };
      
      fetchUserProfile();
    } else if (!user && isOpen) {
      // Clear fields for non-logged-in users
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
    }
  }, [user, isOpen]);

  // Generate 12-hour time slots
  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
    "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM"
  ];

  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !guestName || !guestEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('scheduled_showings')
        .insert({
          listing_id: propertyId,
          user_id: user?.id || null,
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: convertTo24Hour(selectedTime),
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          description: description,
          status: 'pending'
        });

      if (error) throw error;

      // Send notifications after successful booking
      await sendTourNotifications(
        propertyId, 
        propertyTitle, 
        guestName, 
        guestEmail, 
        guestPhone, 
        format(selectedDate, 'yyyy-MM-dd'), 
        convertTo24Hour(selectedTime),
        description
      );

      toast.success("Tour scheduled successfully!", {
        description: "You will receive a confirmation email shortly."
      });
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      if (!user) {
        setGuestName("");
        setGuestEmail("");
        setGuestPhone("");
      }
      setDescription("");
      onClose();
      
    } catch (error: any) {
      console.error("Error scheduling tour:", error);
      toast.error("Failed to schedule tour", {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-forrent-navy" />
            Schedule a Tour
          </DialogTitle>
          <DialogDescription>
            Book a viewing for "{propertyTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Select Date *
            </label>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time *
            </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Name *
              </label>
              <Input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Additional Notes (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any specific questions or requirements for the tour?"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-forrent-navy hover:bg-forrent-navy/90"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Tour"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTourDialog;
