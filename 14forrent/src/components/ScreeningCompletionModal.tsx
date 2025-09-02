
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScreeningCompletionModalProps {
  serviceName: string;
  onTryAgain: () => void;
  onClose: () => void;
}

const ScreeningCompletionModal: React.FC<ScreeningCompletionModalProps> = ({
  serviceName,
  onTryAgain,
  onClose
}) => {
  const handleClose = () => {
    sessionStorage.setItem('screening-completed', 'true');
    sessionStorage.setItem('screening-service', serviceName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Thank You for Submitting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            Your screening application with {serviceName} has been submitted successfully. 
            You'll receive updates about your approval status directly from {serviceName}.
          </p>
          <Button 
            onClick={handleClose}
            className="w-full bg-forrent-orange hover:bg-forrent-lightOrange text-white"
          >
            Continue Browsing Properties
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreeningCompletionModal;
