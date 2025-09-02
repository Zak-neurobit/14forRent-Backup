
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

interface SidebarFiltersProps {
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
}

const SidebarFilters = ({ onFiltersChange, currentFilters }: SidebarFiltersProps) => {
  const [priceRange, setPriceRange] = useState<number[]>([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || 5000,
  ]);
  const [bedroomCount, setBedroomCount] = useState<number>(
    currentFilters.bedrooms || 0
  );
  const [bathroomCount, setBathroomCount] = useState<number>(
    currentFilters.bathrooms || 0
  );

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    onFiltersChange({
      ...currentFilters,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };

  const handleBedroomChange = (value: number[]) => {
    const bedroomValue = value[0];
    setBedroomCount(bedroomValue);
    onFiltersChange({ ...currentFilters, bedrooms: bedroomValue });
  };

  const handleBathroomChange = (value: number[]) => {
    const bathroomValue = value[0];
    setBathroomCount(bathroomValue);
    onFiltersChange({ ...currentFilters, bathrooms: bathroomValue });
  };

  const handleTypeChange = (value: string) => {
    // Convert "any" back to empty string for filtering logic
    const typeValue = value === "any" ? "" : value;
    onFiltersChange({ ...currentFilters, type: typeValue });
  };

  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setBedroomCount(0);
    setBathroomCount(0);
    onFiltersChange({});
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
      
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
        <div className="text-center text-sm font-medium text-gray-700 mb-2">
          ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceRange[0]}
            onChange={(e) =>
              handlePriceChange([Number(e.target.value), priceRange[1]])
            }
            className="w-20 sm:w-24 text-center text-sm"
          />
          <span className="text-gray-400">−</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceRange[1]}
            onChange={(e) =>
              handlePriceChange([priceRange[0], Number(e.target.value)])
            }
            className="w-20 sm:w-24 text-center text-sm"
          />
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
            value={[bedroomCount]}
            onValueChange={handleBedroomChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Any</span>
            <span>5+</span>
          </div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700">
          {bedroomCount === 0 ? 'Any' : bedroomCount} Bedrooms
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
            value={[bathroomCount]}
            onValueChange={handleBathroomChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Any</span>
            <span>5+</span>
          </div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700">
          {bathroomCount === 0 ? 'Any' : bathroomCount} Bathrooms
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Home className="w-4 h-4 mr-2 text-forrent-navy" />
          Property Type
        </label>
        <Select onValueChange={handleTypeChange} defaultValue={currentFilters.type || "any"}>
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

      {/* Clear Filters Button */}
      <Button
        variant="outline"
        className="w-full justify-start text-sm"
        onClick={clearFilters}
      >
        <X className="w-4 h-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );
};

export default SidebarFilters;
