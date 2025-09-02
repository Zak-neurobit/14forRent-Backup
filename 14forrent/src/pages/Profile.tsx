
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState({
    property_types: [] as string[],
    min_bedrooms: '',
    max_bedrooms: '',
    min_budget: '',
    max_budget: '',
    preferred_locations: [] as string[],
    required_amenities: [] as string[],
    move_in_timeframe: ''
  });

  const propertyTypes = ['Apartment', 'Villa', 'Condo', 'House'];
  const bedroomOptions = ['Studio', '1', '2', '3', '4', '5+'];
  const locations = ['Downtown', 'Suburbs', 'Waterfront', 'City Center', 'Residential Area'];
  const amenities = ['Pool', 'Gym', 'Parking', 'Pet-friendly', 'Furnished'];
  const timeframes = ['ASAP', '1 month', '1-3 months', '3+ months'];

  useEffect(() => {
    if (user) {
      loadRequirements();
    }
  }, [user]);

  const loadRequirements = async () => {
    try {
      // Direct query using any type to bypass TypeScript issues
      const { data, error } = await (supabase as any)
        .from('user_property_requirements')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading requirements:', error);
        return;
      }

      if (data) {
        setRequirements({
          property_types: Array.isArray(data.property_types) ? data.property_types : [],
          min_bedrooms: data.min_bedrooms?.toString() || '',
          max_bedrooms: data.max_bedrooms?.toString() || '',
          min_budget: data.min_budget?.toString() || '',
          max_budget: data.max_budget?.toString() || '',
          preferred_locations: Array.isArray(data.preferred_locations) ? data.preferred_locations : [],
          required_amenities: Array.isArray(data.required_amenities) ? data.required_amenities : [],
          move_in_timeframe: data.move_in_timeframe || ''
        });
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const dataToSave = {
        user_id: user.id,
        property_types: requirements.property_types,
        min_bedrooms: requirements.min_bedrooms ? parseInt(requirements.min_bedrooms) : null,
        max_bedrooms: requirements.max_bedrooms ? parseInt(requirements.max_bedrooms) : null,
        min_budget: requirements.min_budget ? parseFloat(requirements.min_budget) : null,
        max_budget: requirements.max_budget ? parseFloat(requirements.max_budget) : null,
        preferred_locations: requirements.preferred_locations,
        required_amenities: requirements.required_amenities,
        move_in_timeframe: requirements.move_in_timeframe,
        is_active: true
      };

      // Direct query using any type to bypass TypeScript issues
      const { error } = await (supabase as any)
        .from('user_property_requirements')
        .upsert(dataToSave, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      toast.success("Property preferences saved successfully!");
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: 'property_types' | 'preferred_locations' | 'required_amenities', value: string, checked: boolean) => {
    setRequirements(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
            
            {/* User Info Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Alert Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Get Notified When Properties Match Your Needs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Property Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {propertyTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={requirements.property_types.includes(type)}
                          onCheckedChange={(checked) => handleCheckboxChange('property_types', type, !!checked)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-bedrooms" className="text-sm font-medium text-gray-700">Min Bedrooms</Label>
                    <select
                      id="min-bedrooms"
                      value={requirements.min_bedrooms}
                      onChange={(e) => setRequirements(prev => ({ ...prev, min_bedrooms: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      {bedroomOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="max-bedrooms" className="text-sm font-medium text-gray-700">Max Bedrooms</Label>
                    <select
                      id="max-bedrooms"
                      value={requirements.max_bedrooms}
                      onChange={(e) => setRequirements(prev => ({ ...prev, max_bedrooms: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      {bedroomOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-budget" className="text-sm font-medium text-gray-700">Min Budget ($)</Label>
                    <Input
                      id="min-budget"
                      type="number"
                      placeholder="e.g. 1000"
                      value={requirements.min_budget}
                      onChange={(e) => setRequirements(prev => ({ ...prev, min_budget: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-budget" className="text-sm font-medium text-gray-700">Max Budget ($)</Label>
                    <Input
                      id="max-budget"
                      type="number"
                      placeholder="e.g. 5000"
                      value={requirements.max_budget}
                      onChange={(e) => setRequirements(prev => ({ ...prev, max_budget: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Preferred Locations */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Preferred Locations</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {locations.map(location => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location}`}
                          checked={requirements.preferred_locations.includes(location)}
                          onCheckedChange={(checked) => handleCheckboxChange('preferred_locations', location, !!checked)}
                        />
                        <Label htmlFor={`location-${location}`} className="text-sm">{location}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Amenities */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Key Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map(amenity => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={requirements.required_amenities.includes(amenity)}
                          onCheckedChange={(checked) => handleCheckboxChange('required_amenities', amenity, !!checked)}
                        />
                        <Label htmlFor={`amenity-${amenity}`} className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Move-in Timeline */}
                <div>
                  <Label htmlFor="move-in-timeframe" className="text-sm font-medium text-gray-700">Move-in Timeline</Label>
                  <select
                    id="move-in-timeframe"
                    value={requirements.move_in_timeframe}
                    onChange={(e) => setRequirements(prev => ({ ...prev, move_in_timeframe: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select timeframe</option>
                    {timeframes.map(timeframe => (
                      <option key={timeframe} value={timeframe}>{timeframe}</option>
                    ))}
                  </select>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
