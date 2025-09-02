export type ShowingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled';

export interface Showing {
  id: string;
  listing_id: string;
  user_id?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  guest_name?: string | null;
  scheduled_date: string;
  scheduled_time: string;
  description?: string | null;
  status: ShowingStatus;
  created_at: string;
  updated_at: string;
  listingTitle?: string;
  listingAddress?: string;
  userName?: string;
  userPhone?: string;
}
