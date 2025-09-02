
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import ScheduleTourDialog from "./ScheduleTourDialog";

interface ScheduleTourButtonProps {
  propertyId: string;
  propertyTitle: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
}

const ScheduleTourButton = ({
  propertyId,
  propertyTitle,
  variant = "default",
  size = "default",
  fullWidth = false,
}: ScheduleTourButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleScheduleTour = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleScheduleTour}
        className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}
      >
        <Calendar size={16} />
        Schedule Tour
      </Button>

      <ScheduleTourDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
      />
    </>
  );
};

export default ScheduleTourButton;
