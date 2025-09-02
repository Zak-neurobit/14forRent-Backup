import { useState, useRef, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

interface AddressAutocompleteProps {
  control: Control<any>;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

const AddressAutocomplete = ({ control }: AddressAutocompleteProps) => {
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
          console.warn("Google Places API key not found. Please add VITE_GOOGLE_PLACES_API_KEY to your environment variables.");
          return;
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"]
        });

        await loader.load();
        
        autocompleteService.current = new google.maps.places.AutocompleteService();
        
        // Create a div element for PlacesService (required)
        const div = document.createElement('div');
        placesService.current = new google.maps.places.PlacesService(div);
      } catch (error) {
        console.error("Error loading Google Maps API:", error);
      }
    };

    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    if (inputValue.length > 2 && autocompleteService.current) {
      setIsLoading(true);
      
      const request = {
        input: inputValue,
        componentRestrictions: { country: "us" },
        types: ["address"],
        // Bias results towards California
        location: new google.maps.LatLng(36.7783, -119.4179), // California center
        radius: 500000, // 500km radius to cover most of California
      };

      autocompleteService.current.getPlacePredictions(request, (results, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Filter for California addresses
          const californiaResults = results.filter(result => 
            result.description.toLowerCase().includes("ca,") ||
            result.description.toLowerCase().includes("california")
          );
          
          setPredictions(californiaResults.slice(0, 5)); // Limit to 5 suggestions
          setShowDropdown(californiaResults.length > 0);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      });
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddressSelect = (prediction: PlacePrediction, onChange: (value: string) => void) => {
    setInputValue(prediction.description);
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
  };

  return (
    <FormField
      control={control}
      name="address"
      render={({ field }) => (
        <FormItem className="relative">
          <FormLabel>Address</FormLabel>
          <FormControl>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="Start typing your California address..."
                value={inputValue || field.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(value);
                  field.onChange(value);
                }}
                onFocus={() => {
                  if (predictions.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                className="pl-10"
                required
              />
              
              {showDropdown && predictions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {isLoading && (
                    <div className="px-4 py-2 text-gray-500 text-center">
                      Loading suggestions...
                    </div>
                  )}
                  {!isLoading && predictions.map((prediction, index) => (
                    <div
                      key={prediction.place_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-start"
                      onClick={() => handleAddressSelect(prediction, field.onChange)}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{prediction.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AddressAutocomplete;