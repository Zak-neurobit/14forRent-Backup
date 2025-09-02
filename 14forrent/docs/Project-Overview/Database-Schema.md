
# Database Schema Documentation

## Schema Overview

The 14ForRent platform uses a PostgreSQL database (via Supabase) with the following key design principles:
- Row Level Security (RLS) for data isolation
- UUID primary keys for all tables
- Comprehensive audit trails with created_at/updated_at timestamps
- Vector search capabilities for AI-powered features
- Enum types for controlled vocabularies

## Core Tables

### 1. listings
**Purpose**: Central table for all property listings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique listing identifier |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) | Property owner |
| title | TEXT | NOT NULL | Property title/name |
| description | TEXT | NOT NULL | Detailed property description |
| location | TEXT | NOT NULL | Property location/address |
| address | TEXT | | Specific street address |
| price | NUMERIC | NOT NULL | Monthly rent price |
| bedrooms | INTEGER | NOT NULL | Number of bedrooms |
| bathrooms | NUMERIC | NOT NULL | Number of bathrooms (allows 0.5, 1.5, etc.) |
| sqft | INTEGER | | Square footage |
| type | TEXT | DEFAULT 'Property' | Property type (Apartment, House, etc.) |
| amenities | TEXT[] | DEFAULT '{}' | Array of amenity strings |
| images | TEXT[] | DEFAULT '{}' | Array of image URLs |
| youtube_url | TEXT | | YouTube video URL |
| video_id | TEXT | | Extracted YouTube video ID |
| is_short | BOOLEAN | DEFAULT false | Whether video is YouTube Short |
| status | TEXT | DEFAULT 'available' | Listing status (available, sold, pending) |
| featured | BOOLEAN | DEFAULT false | Whether listing is featured |
| embedding | VECTOR(1536) | | OpenAI embedding for semantic search |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key index on `id`
- Index on `user_id` for owner queries
- Index on `status` for filtering available properties
- Vector index on `embedding` for similarity search
- Composite index on `(featured, created_at)` for homepage queries

**RLS Policies**:
- Anyone can view listings (SELECT)
- Users can manage their own listings (ALL on user_id = auth.uid())
- Admins can manage all listings (ALL with is_admin())

### 2. profiles
**Purpose**: Extended user profile information beyond Supabase auth

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID from auth.users |
| display_name | TEXT | | Public display name |
| first_name | TEXT | | First name |
| last_name | TEXT | | Last name |
| phone_number | TEXT | | Contact phone number |
| avatar_url | TEXT | | Profile picture URL |
| username | TEXT | | Unique username |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Account creation |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last profile update |

**RLS Policies**:
- Users can view all profiles (public information)
- Users can only update their own profile
- Admins can view all profile details

### 3. scheduled_showings
**Purpose**: Property tour scheduling and management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Showing identifier |
| listing_id | UUID | NOT NULL, REFERENCES listings(id) | Property being shown |
| user_id | UUID | REFERENCES auth.users(id) | Registered user (optional) |
| guest_name | TEXT | | Name for non-registered users |
| guest_email | TEXT | | Email for non-registered users |
| guest_phone | TEXT | | Phone for non-registered users |
| scheduled_date | DATE | NOT NULL | Tour date |
| scheduled_time | TIME | NOT NULL | Tour time |
| status | TEXT | DEFAULT 'pending' | Status (pending, confirmed, cancelled, completed) |
| description | TEXT | | Additional notes or requirements |
| created_at | TIMESTAMPTZ | DEFAULT now() | Booking timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last status update |

**Business Rules**:
- Either user_id OR guest fields must be provided
- Past dates cannot be scheduled
- Property owners can view all showings for their properties

### 4. favorites
**Purpose**: User's saved/favorited properties

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Favorite record ID |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) | User who favorited |
| listing_id | UUID | NOT NULL, REFERENCES listings(id) | Favorited property |
| created_at | TIMESTAMPTZ | DEFAULT now() | When favorited |

**Constraints**:
- UNIQUE(user_id, listing_id) - prevents duplicate favorites

## User Management Tables

### 5. user_roles
**Purpose**: Role-based access control system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Role assignment ID |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) | User receiving role |
| role | app_role | DEFAULT 'user' | Role type (enum) |

**Enum Definition**:
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

**Constraints**:
- UNIQUE(user_id, role) - prevents duplicate role assignments

### 6. user_property_requirements
**Purpose**: User's property search preferences and requirements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Requirement set ID |
| user_id | UUID | REFERENCES auth.users(id) | User with requirements |
| min_bedrooms | INTEGER | | Minimum bedroom count |
| max_bedrooms | INTEGER | | Maximum bedroom count |
| min_budget | NUMERIC | | Minimum monthly rent |
| max_budget | NUMERIC | | Maximum monthly rent |
| preferred_locations | JSONB | DEFAULT '[]' | Array of preferred locations |
| required_amenities | JSONB | DEFAULT '[]' | Array of required amenities |
| property_types | JSONB | DEFAULT '[]' | Preferred property types |
| max_distance | INTEGER | | Maximum distance from preferred locations |
| move_in_timeframe | TEXT | | When user wants to move in |
| is_active | BOOLEAN | DEFAULT true | Whether requirements are active |
| created_at | TIMESTAMPTZ | DEFAULT now() | When requirements set |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

## Activity Tracking Tables

### 7. listing_views
**Purpose**: Track property view analytics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | View record ID |
| listing_id | UUID | NOT NULL, REFERENCES listings(id) | Viewed property |
| viewer_id | UUID | REFERENCES auth.users(id) | User who viewed (optional) |
| viewed_at | TIMESTAMPTZ | DEFAULT now() | View timestamp |

**Business Rules**:
- Anonymous views allowed (viewer_id can be NULL)
- Used for analytics and recommendation systems

### 8. notifications
**Purpose**: In-app notification system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Notification ID |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) | Recipient user |
| type | TEXT | NOT NULL | Notification type |
| message | TEXT | NOT NULL | Notification content |
| listing_id | UUID | REFERENCES listings(id) | Related property (optional) |
| read | BOOLEAN | DEFAULT false | Whether user has read it |
| created_at | TIMESTAMPTZ | DEFAULT now() | Notification timestamp |

## AI and Content Management

### 9. ai_settings
**Purpose**: Configuration for AI features and OpenAI integration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Settings ID |
| openai_api_key | TEXT | | Encrypted OpenAI API key |
| model | TEXT | DEFAULT 'gpt-4o-mini' | AI model to use |
| temperature | NUMERIC | DEFAULT 0.7 | AI response creativity |
| max_tokens | INTEGER | DEFAULT 1024 | Maximum response length |
| system_prompt | TEXT | | Custom system prompt |
| knowledge_base | TEXT | | Custom knowledge base content |
| response_refinement | BOOLEAN | DEFAULT false | Enable response refinement |
| embeddings_updated | BOOLEAN | DEFAULT false | Whether embeddings are current |
| created_at | TIMESTAMPTZ | DEFAULT now() | Settings creation |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last settings update |

### 10. kb_chunks
**Purpose**: Knowledge base chunks for AI context

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Chunk ID |
| content | TEXT | NOT NULL | Text content |
| embedding | VECTOR(1536) | | Text embedding for similarity search |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

### 11. blog_posts
**Purpose**: Blog content management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Post ID |
| title | TEXT | NOT NULL | Blog post title |
| slug | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| content | TEXT | NOT NULL | Post content (Markdown) |
| author_id | UUID | NOT NULL, REFERENCES auth.users(id) | Post author |
| image_url | TEXT | | Featured image |
| published | BOOLEAN | DEFAULT false | Publication status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

## Email and Communication

### 12. email_templates
**Purpose**: Email template management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Template ID |
| template_name | TEXT | NOT NULL | Template identifier |
| subject | TEXT | NOT NULL | Email subject line |
| content | TEXT | NOT NULL | Email body (HTML) |
| is_active | BOOLEAN | DEFAULT true | Template status |
| created_by | UUID | REFERENCES auth.users(id) | Template creator |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

### 13. email_notifications
**Purpose**: Email delivery tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Notification ID |
| user_id | UUID | REFERENCES auth.users(id) | Recipient |
| template_id | UUID | REFERENCES email_templates(id) | Template used |
| property_id | UUID | REFERENCES listings(id) | Related property |
| match_score | NUMERIC | | Property match score |
| delivery_status | TEXT | DEFAULT 'sent' | Delivery status |
| email_sent_at | TIMESTAMPTZ | DEFAULT now() | Send timestamp |
| opened_at | TIMESTAMPTZ | | Email open timestamp |
| clicked_at | TIMESTAMPTZ | | Link click timestamp |
| unsubscribed_at | TIMESTAMPTZ | | Unsubscribe timestamp |

### 14. smtp_settings
**Purpose**: Email server configuration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Settings ID |
| smtp_host | TEXT | NOT NULL | SMTP server hostname |
| smtp_port | INTEGER | NOT NULL | SMTP server port |
| smtp_username | TEXT | NOT NULL | SMTP authentication username |
| smtp_password | TEXT | NOT NULL | SMTP authentication password |
| encryption_type | TEXT | DEFAULT 'TLS' | Encryption method |
| from_email | TEXT | NOT NULL | Default sender email |
| from_name | TEXT | NOT NULL | Default sender name |
| is_active | BOOLEAN | DEFAULT true | Configuration status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Configuration created |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

## System Configuration

### 15. settings
**Purpose**: General application settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Setting ID |
| key | TEXT | NOT NULL, UNIQUE | Setting identifier |
| value | TEXT | NOT NULL | Setting value |
| created_at | TIMESTAMPTZ | DEFAULT now() | Setting created |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

### 16. watermark_settings
**Purpose**: Image watermarking configuration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Settings ID |
| logo_url | TEXT | NOT NULL | Watermark logo URL |
| opacity | NUMERIC | DEFAULT 0.5 | Watermark opacity (0-1) |
| watermark_size | INTEGER | DEFAULT 128 | Watermark size in pixels |
| watermark_margin | INTEGER | DEFAULT 24 | Margin from edges |
| enabled | BOOLEAN | DEFAULT true | Whether watermarking is active |
| created_at | TIMESTAMPTZ | DEFAULT now() | Configuration created |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

## Database Functions and Triggers

### Key Functions

**is_admin()** - Security definer function to check admin status
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**match_listings()** - Vector similarity search for AI-powered property search
```sql
CREATE OR REPLACE FUNCTION public.match_listings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INTEGER,
  match_offset INTEGER DEFAULT 0
)
RETURNS TABLE(...) AS $$
-- Returns similar properties based on embedding similarity
```

**admin_get_users()** - Admin function to retrieve user management data
**admin_update_user()** - Admin function to update user properties
**admin_delete_user()** - Admin function to delete users

### Triggers

**handle_new_user()** - Automatically creates profile when user registers
**update_updated_at_column()** - Updates timestamp on row changes
**handle_listing_image_upload()** - Triggers watermarking on image upload

## Indexes and Performance

### Primary Indexes
- All tables have UUID primary keys with automatic indexes
- Foreign key columns have automatic indexes

### Custom Indexes
```sql
-- Vector similarity search
CREATE INDEX listings_embedding_idx ON listings USING hnsw (embedding vector_cosine_ops);

-- Property search optimization
CREATE INDEX listings_search_idx ON listings (status, featured, created_at);

-- User activity tracking
CREATE INDEX listing_views_property_idx ON listing_views (listing_id, viewed_at);

-- Email tracking
CREATE INDEX email_notifications_user_idx ON email_notifications (user_id, email_sent_at);
```

## Security Implementation

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Property owners can view showings for their properties
- Admins have comprehensive access with proper verification
- Public data (listings, profiles) is appropriately accessible

### Data Encryption
- Sensitive fields (API keys, passwords) are encrypted at rest
- All connections use SSL/TLS encryption
- Supabase handles automatic encryption of auth data

This schema provides a comprehensive foundation for a rental property platform with proper security, scalability, and feature completeness.
