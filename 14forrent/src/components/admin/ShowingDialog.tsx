
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Showing, ShowingStatus } from "@/types/showing";

interface ShowingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  showing: Showing;
  onShowingUpdated: (showing: Showing, wasRescheduled: boolean) => void;
}

export const ShowingDialog = ({
  isOpen,
  onClose,
  showing,
  onShowingUpdated,
}: ShowingDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [status, setStatus] = useState<ShowingStatus>("pending");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available time slots
  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
    "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM"
  ];

  // Initialize form with showing data
  useEffect(() => {
    if (showing && isOpen) {
      const showingDate = new Date(showing.scheduled_date);
      setSelectedDate(showingDate);
      setSelectedTime(showing.scheduled_time);
      setStatus(showing.status);
      setDescription(showing.description || "");
    }
  }, [showing, isOpen]);

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

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !status) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if the date/time has changed to determine if rescheduled
      const originalDate = showing.scheduled_date;
      const originalTime = showing.scheduled_time;
      const newDate = format(selectedDate, "yyyy-MM-dd");
      const newTime = convertTo24Hour(selectedTime);
      const isDateTimeChanged = originalDate !== newDate || originalTime !== newTime;
      
      // Auto-set status to rescheduled if date/time changed and status wasn't explicitly changed
      const updatedStatus: ShowingStatus = isDateTimeChanged && status === showing.status ? 'rescheduled' : status;
      
      // Update the showing record
      const { error } = await supabase
        .from('scheduled_showings')
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          description: description,
          status: updatedStatus
        })
        .eq('id', showing.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      toast.success("Showing updated successfully");
      
      // Update the showing details and pass to parent
      const updatedShowing: Showing = {
        ...showing,
        scheduled_date: newDate,
        scheduled_time: newTime,
        description: description,
        status: updatedStatus
      };
      
      onShowingUpdated(updatedShowing, isDateTimeChanged);
      onClose();
    } catch (error: any) {
      console.error("Error updating showing:", error);
      toast.error("Failed to update showing", {
        description: error?.message || "Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      return `${format(date, "PPP")} at ${timeString}`;
    } catch (error) {
      return `${dateString} at ${timeString}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Showing</DialogTitle>
          <DialogDescription>
            Update or reschedule this property tour.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Property and User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Property</Label>
              <p className="text-sm text-gray-700 mt-1">{showing.listingTitle}</p>
            </div>
            <div>
              <Label>Scheduled For</Label>
              <p className="text-sm text-gray-700 mt-1">{formatDateTime(showing.scheduled_date, showing.scheduled_time)}</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="tour-date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="tour-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid gap-2">
            <Label htmlFor="tour-time">Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select a time" />
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

          {/* Status Selection */}
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={status} 
              onValueChange={(value) => setStatus(value as ShowingStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Any notes about this showing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
