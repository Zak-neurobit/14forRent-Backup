
import { Control } from "react-hook-form";
import { DollarSign, Bed, Bath, Home, SquareCode } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddressAutocomplete from "./AddressAutocomplete";

interface PropertyDetailsFormProps {
  control: Control<any>;
}

const PropertyDetailsForm = ({ control }: PropertyDetailsFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-forrent-navy">Property Details</h2>
      
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Listing Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Spacious 2BR with Ocean View" 
                {...field} 
                required 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <AddressAutocomplete control={control} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <Home className="h-4 w-4 mr-2 text-forrent-navy" />
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Loft">Loft</SelectItem>
                  <SelectItem value="Property">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="sqft"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Square Footage</FormLabel>
              <FormControl>
                <div className="relative">
                  <SquareCode className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    type="number" 
                    className="pl-10" 
                    min="100"
                    placeholder="e.g., 1200"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Rent ($)</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    type="number" 
                    className="pl-10" 
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    required
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="securityDeposit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Security Deposit ($)</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    type="number" 
                    className="pl-10" 
                    min="0"
                    placeholder="e.g., 1500"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                <Bed className="w-4 h-4 mr-2 text-forrent-navy" />
                Bedrooms
              </FormLabel>
              <FormControl>
                <div className="px-1">
                  <Slider 
                    min={0} 
                    max={10} 
                    step={1}
                    value={[field.value]} 
                    onValueChange={(value) => field.onChange(value[0])}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>0</span>
                    <span>10+</span>
                  </div>
                </div>
              </FormControl>
              <div className="text-center text-sm font-medium text-gray-700">
                {field.value} Bedrooms
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                <Bath className="w-4 h-4 mr-2 text-forrent-navy" />
                Bathrooms
              </FormLabel>
              <FormControl>
                <div className="px-1">
                  <Slider 
                    min={0} 
                    max={5} 
                    step={0.5}
                    value={[field.value]} 
                    onValueChange={(value) => field.onChange(value[0])}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>0</span>
                    <span>5+</span>
                  </div>
                </div>
              </FormControl>
              <div className="text-center text-sm font-medium text-gray-700">
                {field.value} Bathrooms
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
