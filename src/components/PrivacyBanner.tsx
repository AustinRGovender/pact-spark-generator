
import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 text-green-800">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <Lock className="h-4 w-4 text-green-600" />
          </div>
          <span className="text-sm font-medium">
            🔒 Your API specs never leave this browser tab - 100% client-side processing
          </span>
        </div>
      </div>
    </div>
  );
};
