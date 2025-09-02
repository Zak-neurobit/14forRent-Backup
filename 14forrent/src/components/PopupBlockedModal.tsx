
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

interface PopupBlockedModalProps {
  url: string;
  onClose: () => void;
}

const PopupBlockedModal: React.FC<PopupBlockedModalProps> = ({ url, onClose }) => {
  const openInNewTab = () => {
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Popup Blocked
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your browser blocked the popup window. Please allow popups for this site, or use the button below to open in a new tab.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>To allow popups:</strong> Look for the popup blocker icon in your browser's address bar and click "Always allow popups from this site"
            </p>
          </div>
          <Button onClick={openInNewTab} className="w-full bg-forrent-orange hover:bg-forrent-lightOrange">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupBlockedModal;
