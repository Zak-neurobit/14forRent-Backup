import { supabase } from "@/integrations/supabase/client";

// Admin emails that should own listings without user_id
const ADMIN_EMAILS = ['zak.seid@gmail.com', 'jason@14forrent.com'];

/**
 * Updates all listings that don't have a user_id to be owned by an admin
 * This is a one-time migration utility
 */
export const updateListingsWithoutUserIds = async () => {
  try {
    console.log('Starting listings user_id update process...');
    
    // Step 1: Find listings without user_id
    const { data: listingsWithoutUserId, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, created_at')
      .is('user_id', null);
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return { success: false, error: listingsError.message };
    }
    
    if (!listingsWithoutUserId || listingsWithoutUserId.length === 0) {
      console.log('No listings found without user_id');
      return { success: true, message: 'No listings need updating', updated: 0 };
    }
    
    console.log(`Found ${listingsWithoutUserId.length} listings without user_id`);
    
    // Step 2: Get admin user IDs
    // Since we can't directly query auth.users, we'll need to use a different approach
    // For now, we'll use the current admin user's ID if they're signed in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return { success: false, error: 'Must be signed in as admin to perform this operation' };
    }
    
    // Check if current user is admin
    const isAdmin = ADMIN_EMAILS.includes(user.email || '');
    if (!isAdmin) {
      return { success: false, error: 'Must be signed in as admin to perform this operation' };
    }
    
    // Step 3: Update all listings without user_id to be owned by current admin
    const { data: updatedListings, error: updateError } = await supabase
      .from('listings')
      .update({ user_id: user.id })
      .is('user_id', null)
      .select('id, title');
    
    if (updateError) {
      console.error('Error updating listings:', updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log(`Successfully updated ${updatedListings?.length || 0} listings`);
    
    return {
      success: true,
      message: `Updated ${updatedListings?.length || 0} listings to be owned by admin`,
      updated: updatedListings?.length || 0,
      listings: updatedListings
    };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    };
  }
};

/**
 * Check listings user_id status
 */
export const checkListingsUserIdStatus = async () => {
  try {
    // Get total listings count
    const { count: totalListings, error: totalError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error getting total listings:', totalError);
      return { success: false, error: totalError.message };
    }
    
    // Get listings without user_id
    const { count: listingsWithoutUserId, error: nullError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null);
    
    if (nullError) {
      console.error('Error getting listings without user_id:', nullError);
      return { success: false, error: nullError.message };
    }
    
    // Get listings with user_id
    const listingsWithUserId = (totalListings || 0) - (listingsWithoutUserId || 0);
    
    return {
      success: true,
      total: totalListings || 0,
      withUserId: listingsWithUserId,
      withoutUserId: listingsWithoutUserId || 0
    };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    };
  }
};