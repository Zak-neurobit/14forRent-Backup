
// Property listings interface and data
export interface PropertyListing {
  id: string;
  title: string;
  price: number | string;
  image: string; // Main image for card display
  images?: string[]; // Array of all property images
  description?: string;
  bedrooms?: number;
  beds?: number; // Alias for bedrooms in some contexts
  bathrooms?: number;
  baths?: number; // Alias for bathrooms in some contexts
  sqft?: number;
  address?: string;
  location?: string;
  amenities?: string[];
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  embedding?: string;
  type?: string; // Property type (e.g., "Apartment", "House", etc.)
  youtube_url?: string; // YouTube video URL (legacy)
  video_id?: string; // YouTube video ID (new)
  is_short?: boolean; // Whether the video is a YouTube Short
  status?: string; // Property status (e.g., "available", "sold", etc.)
  date_available?: string;
  laundry_type?: string;
  parking_type?: string;
  heating_type?: string;
  rental_type?: string;
  cat_friendly?: boolean;
  dog_friendly?: boolean;
  security_deposit?: number;
}

export const mockListings: PropertyListing[] = [
  {
    id: "1",
    title: "Modern Downtown Apartment",
    price: 1800,
    image: "/placeholder.svg",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    address: "123 Main St, City Center",
    featured: true,
    beds: 2,
    baths: 1
  },
  {
    id: "2",
    title: "Cozy Suburban House",
    price: 250000,
    image: "/placeholder.svg",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    address: "456 Elm St, Suburbia",
    featured: false,
    beds: 3,
    baths: 2
  },
  {
    id: "3",
    title: "Luxury Beachfront Villa",
    price: "P.O.A",
    image: "/placeholder.svg",
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3000,
    address: "789 Ocean Dr, Beach Town",
    featured: true,
    beds: 5,
    baths: 4
  },
  {
    id: "4",
    title: "Rustic Country Cottage",
    price: 120000,
    image: "/placeholder.svg",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600,
    address: "101 Pine Ln, Countryside",
    featured: false,
    beds: 1,
    baths: 1
  },
  {
    id: "5",
    title: "Spacious Family Home",
    price: 320000,
    image: "/placeholder.svg",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    address: "222 Oak Ave, Familyville",
    featured: false,
    beds: 4,
    baths: 3
  },
];

// Helper function to get listing by ID
export const getListingById = (id: string): PropertyListing | undefined => {
  return mockListings.find(listing => listing.id === id);
};

// Get featured listings
export const featuredListings: PropertyListing[] = mockListings.filter(
  listing => listing.featured === true
);

// Get new listings (for demonstration, using the same data but limiting to 4)
export const newListings: PropertyListing[] = [...mockListings]
  .sort((a, b) => {
    // Sort by most recent first (using IDs as a proxy since we don't have real timestamps)
    return parseInt(b.id) - parseInt(a.id);
  })
  .slice(0, 4);
