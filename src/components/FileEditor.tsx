
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

interface FileEditorProps {
  test: GeneratedTest;
  onSave: (updatedTest: GeneratedTest) => void;
  onCancel: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  test,
  onSave,
  onCancel,
}) => {
  const [editedContent, setEditedContent] = useState(test.content);
  const { toast } = useToast();

  const handleSave = () => {
    const updatedTest = { ...test, content: editedContent };
    onSave(updatedTest);
    toast({
      title: "File Saved",
      description: `${test.filename} has been updated successfully`,
    });
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Editing: {test.filename}
            </h3>
            <p className="text-sm text-slate-600">
              {test.method} {test.endpoint} • {test.tag}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-[500px] font-mono text-sm"
          placeholder="Edit your test content here..."
        />
      </div>
    </div>
  );
};
