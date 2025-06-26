
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TestModeToggleProps {
  isProviderMode: boolean;
  onToggle: (isProviderMode: boolean) => void;
}

export const TestModeToggle: React.FC<TestModeToggleProps> = ({
  isProviderMode,
  onToggle,
}) => {
  return (
    <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-4">
      <Label htmlFor="test-mode" className="text-slate-700 font-medium">
        Consumer Mode
      </Label>
      <Switch
        id="test-mode"
        checked={isProviderMode}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="test-mode" className="text-slate-700 font-medium">
        Provider Mode
      </Label>
    </div>
  );
};
