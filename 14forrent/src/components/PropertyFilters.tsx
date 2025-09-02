
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, DollarSign, Home, Bath, BedDouble, X } from "lucide-react";

export interface FilterState {
  priceRange: number[];
  bedrooms: number;
  bathrooms: number;
  amenities: { [key: string]: boolean };
  location: string;
}

interface PropertyFiltersProps {
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
}

const PropertyFilters = ({ onFiltersChange, currentFilters }: PropertyFiltersProps) => {
  const [priceRange, setPriceRange] = useState([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || 5000,
  ]);
  const [bedroomRange, setBedroomRange] = useState([
    currentFilters.minBedrooms || 0,
    currentFilters.maxBedrooms || 5,
  ]);
  const [bathroomRange, setBathroomRange] = useState([
    currentFilters.minBathrooms || 0,
    currentFilters.maxBathrooms || 5,
  ]);

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    onFiltersChange({
      ...currentFilters,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };

  const handleBedroomChange = (value: number[]) => {
    setBedroomRange(value);
    onFiltersChange({
      ...currentFilters,
      minBedrooms: value[0],
      maxBedrooms: value[1],
    });
  };

  const handleBathroomChange = (value: number[]) => {
    setBathroomRange(value);
    onFiltersChange({
      ...currentFilters,
      minBathrooms: value[0],
      maxBathrooms: value[1],
    });
  };

  const handleTypeChange = (type: string) => {
    // Convert "any" back to empty string for filtering logic
    const typeValue = type === "any" ? "" : type;
    onFiltersChange({ ...currentFilters, type: typeValue });
  };

  const handleClearFilters = () => {
    setPriceRange([0, 5000]);
    setBedroomRange([0, 5]);
    setBathroomRange([0, 5]);
    onFiltersChange({});
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Properties</h3>
      
      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-forrent-navy" />
          Location
        </label>
        <Input
          type="text"
          placeholder="e.g. Los Angeles, California"
          value={currentFilters.location || ""}
          onChange={(e) => onFiltersChange({ ...currentFilters, location: e.target.value })}
          className="w-full"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <DollarSign className="w-4 h-4 mr-2 text-forrent-navy" />
          Price Range
        </label>
        <div className="px-1">
          <Slider
            min={0}
            max={5000}
            step={100}
            value={priceRange}
            onValueChange={handlePriceChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>$0</span>
            <span>$5000</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Min"
              value={priceRange[0]}
              onChange={(e) =>
                handlePriceChange([Number(e.target.value), priceRange[1]])
              }
              className="text-center text-sm"
            />
            <div className="text-xs text-gray-500 text-center mt-1">Min</div>
          </div>
          <div className="text-gray-400">−</div>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Max"
              value={priceRange[1]}
              onChange={(e) =>
                handlePriceChange([priceRange[0], Number(e.target.value)])
              }
              className="text-center text-sm"
            />
            <div className="text-xs text-gray-500 text-center mt-1">Max</div>
          </div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700">
          ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <BedDouble className="w-4 h-4 mr-2 text-forrent-navy" />
          Bedrooms
        </label>
        <div className="px-1">
          <Slider
            min={0}
            max={5}
            step={1}
            value={bedroomRange}
            onValueChange={handleBedroomChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Any</span>
            <span>5+</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Min"
              value={bedroomRange[0]}
              onChange={(e) =>
                handleBedroomChange([Number(e.target.value), bedroomRange[1]])
              }
              className="text-center text-sm"
            />
            <div className="text-xs text-gray-500 text-center mt-1">Min</div>
          </div>
          <div className="text-gray-400">−</div>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Max"
              value={bedroomRange[1]}
              onChange={(e) =>
                handleBedroomChange([bedroomRange[0], Number(e.target.value)])
              }
              className="text-center text-sm"
            />
            <div className="text-xs text-gray-500 text-center mt-1">Max</div>
          </div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700">
          {bedroomRange[0] === bedroomRange[1] 
            ? `${bedroomRange[0] === 0 ? 'Any' : bedroomRange[0]} Bedrooms`
            : `${bedroomRange[0] === 0 ? 'Any' : bedroomRange[0]} - ${bedroomRange[1]}${bedroomRange[1] === 5 ? '+' : ''} Bedrooms`
          }
        </div>
      </div>

      {/* Bathrooms */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Bath className="w-4 h-4 mr-2 text-forrent-navy" />
          Bathrooms
        </label>
        <div className="px-1">
          <Slider
            min={0}
            max={5}
            step={0.5}
            value={bathroomRange}
            onValueChange={handleBathroomChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Any</span>
            <span>5+</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              type="number"
              step="0.5"
              placeholder="Min"
              value={bathroomRange[0]}
              onChange={(e) =>
                handleBathroomChange([Number(e.target.value), bathroomRange[1]])
              }
              className="text-center text-sm"
            />
            <div className="text-xs text-gray-500 text-center mt-1">Min</div>
          </div>
          <div className="text-gray-400">−</div>
          <div className="flex-1">
            <Input
              type="number"
              step="0.5"
              placeholder="Max"
              value={bathroomRange[1]}
              onChange={(e) =>
                handleBathroomChange([bathroomRange[0], Number(e.target.value)])
              }
              className="text-center text-sm"
            />
            <div className="text-xs text-gray-500 text-center mt-1">Max</div>
          </div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700">
          {bathroomRange[0] === bathroomRange[1] 
            ? `${bathroomRange[0] === 0 ? 'Any' : bathroomRange[0]} Bathrooms`
            : `${bathroomRange[0] === 0 ? 'Any' : bathroomRange[0]} - ${bathroomRange[1]}${bathroomRange[1] === 5 ? '+' : ''} Bathrooms`
          }
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Home className="w-4 h-4 mr-2 text-forrent-navy" />
          Property Type
        </label>
        <Select
          onValueChange={handleTypeChange}
          defaultValue={currentFilters.type || "any"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="House">House</SelectItem>
            <SelectItem value="Condo">Condo</SelectItem>
            <SelectItem value="Townhouse">Townhouse</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
            <SelectItem value="Loft">Loft</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={handleClearFilters}
      >
        <X className="w-4 h-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );
};

export default PropertyFilters;
