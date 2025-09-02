
import { useState, useRef, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { MapPin, ChevronDown } from "lucide-react";

interface LocationSelectorProps {
  control: Control<any>;
}

// Sample US cities with states - in a real app, this would be from an API
const US_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Boston, MA", "El Paso, TX", "Detroit, MI", "Nashville, TN", "Portland, OR",
  "Memphis, TN", "Oklahoma City, OK", "Las Vegas, NV", "Louisville, KY", "Baltimore, MD",
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ",
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Miami, FL",
  "Raleigh, NC", "Omaha, NE", "Long Beach, CA", "Virginia Beach, VA", "Oakland, CA",
  "Minneapolis, MN", "Tulsa, OK", "Arlington, TX", "Tampa, FL", "New Orleans, LA"
];

const LocationSelector = ({ control }: LocationSelectorProps) => {
  const [inputValue, setInputValue] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = US_CITIES.filter(city =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions
      setFilteredCities(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredCities([]);
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

  const handleCitySelect = (city: string, onChange: (value: string) => void) => {
    setInputValue(city);
    onChange(city);
    setShowDropdown(false);
  };

  return (
    <FormField
      control={control}
      name="location"
      render={({ field }) => (
        <FormItem className="relative">
          <FormLabel>Location</FormLabel>
          <FormControl>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="e.g. Los Angeles, California"
                value={inputValue || field.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(value);
                  field.onChange(value);
                }}
                onFocus={() => {
                  if (filteredCities.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                className="pl-10 pr-10"
                required
              />
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              
              {showDropdown && filteredCities.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {filteredCities.map((city, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleCitySelect(city, field.onChange)}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      {city}
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

export default LocationSelector;
