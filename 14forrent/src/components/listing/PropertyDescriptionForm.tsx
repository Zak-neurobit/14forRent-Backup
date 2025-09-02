
import { forwardRef } from "react";
import { Control } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PropertyDescriptionFormProps {
  control: Control<any>;
  generateAIDescription: () => Promise<void>;
  generatingDescription: boolean;
}

const PropertyDescriptionForm = forwardRef<HTMLTextAreaElement, PropertyDescriptionFormProps>(({ 
  control, 
  generateAIDescription,
  generatingDescription 
}, ref) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-forrent-navy">Property Description</h2>
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Describe Your Property</FormLabel>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={generateAIDescription}
                disabled={generatingDescription}
                className="flex items-center gap-2 text-blue-500 border-blue-500 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4" />
                {generatingDescription ? 'Generating...' : 'Auto-Generate Description'}
              </Button>
            </div>
            <FormControl>
              <Textarea 
                placeholder="Describe your property in detail... (Tip: Line breaks and formatting will be preserved)" 
                className="min-h-[150px] whitespace-pre-wrap" 
                {...field}
                required 
                ref={ref}
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </FormControl>
            <FormDescription>
              Include details about the property, neighborhood, and special features.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

// Add display name for React DevTools
PropertyDescriptionForm.displayName = "PropertyDescriptionForm";

export default PropertyDescriptionForm;
