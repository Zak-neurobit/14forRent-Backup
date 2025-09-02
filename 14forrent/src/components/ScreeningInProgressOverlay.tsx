
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';

interface ScreeningInProgressOverlayProps {
  serviceName: string;
  onCancel: () => void;
}

const ScreeningInProgressOverlay: React.FC<ScreeningInProgressOverlayProps> = ({
  serviceName,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-6 text-center">
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-forrent-orange" />
          </div>
          <h3 className="text-xl font-semibold text-forrent-darkGray mb-2">
            Screening in progress with {serviceName}
          </h3>
          <p className="text-gray-600 mb-6">
            Complete your application in the popup window, then return here!
          </p>
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel Screening
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreeningInProgressOverlay;
