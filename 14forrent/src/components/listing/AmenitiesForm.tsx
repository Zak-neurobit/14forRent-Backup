
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";

interface AmenitiesFormProps {
  control: Control<any>;
}

const heatingTypes = [
  "Central heating",
  "Electric heating", 
  "Gas heating",
  "Radiator heating",
  "Heating available",
  "None"
];

const rentalTypes = [
  "Apartment",
  "House", 
  "Townhouse"
];

const parkingTypes = [
  "Garage parking",
  "Street parking",
  "Off-street parking", 
  "Parking available",
  "None"
];

const laundryTypes = [
  "In-unit laundry",
  "Laundry in building",
  "Laundry available",
  "None"
];

const additionalAmenities = [
  "Dishwasher",
  "Balcony",
  "Central AIR",
  "Gym",
  "Pool",
  "Rooftop",
  "Air Conditioning",
  "Rooftop Deck",
  "Elevator",
  "Furnished",
  "Metro Access",
  "Security System"
];

const AmenitiesForm = ({ control }: AmenitiesFormProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-forrent-navy mb-4">Advanced Details</h2>
        <p className="text-gray-500 text-sm mb-6">Optional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Available */}
        <FormField
          control={control}
          name="dateAvailable"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600 flex items-center gap-2">
                <Calendar size={16} />
                Date available
              </FormLabel>
              <FormControl>
                <input 
                  {...field}
                  type="date"
                  className="w-full p-4 border border-gray-300 rounded-lg text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Laundry Type */}
        <FormField
          control={control}
          name="laundryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600">Laundry type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg text-gray-600">
                    <SelectValue placeholder="Laundry type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {laundryTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '_')}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parking Type */}
        <FormField
          control={control}
          name="parkingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600">Parking type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg text-gray-600">
                    <SelectValue placeholder="Parking type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {parkingTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '_')}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Heating Type */}
        <FormField
          control={control}
          name="heatingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600">Heating type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg text-gray-600">
                    <SelectValue placeholder="Heating type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {heatingTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '_')}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rental Type */}
        <FormField
          control={control}
          name="rentalType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-600">Rental type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg text-gray-600">
                    <SelectValue placeholder="Rental type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rentalTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Pet Friendly Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <FormField
          control={control}
          name="catFriendly"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base text-gray-900">Cat friendly</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="dogFriendly"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base text-gray-900">Dog friendly</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Additional Amenities Checkboxes */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {additionalAmenities.map((amenity) => (
            <FormField
              key={amenity}
              control={control}
              name="additionalAmenities"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(amenity.toLowerCase())}
                        onCheckedChange={(checked) => {
                          const amenityLower = amenity.toLowerCase();
                          return checked
                            ? field.onChange([...(field.value || []), amenityLower])
                            : field.onChange(field.value?.filter(
                                (value: string) => value !== amenityLower
                              ));
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer text-sm">
                      {amenity}
                    </FormLabel>
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AmenitiesForm;
