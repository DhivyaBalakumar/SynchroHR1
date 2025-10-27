import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobDescriptionUploadProps {
  jobRoleId?: string;
  onUploadComplete?: () => void;
}

export const JobDescriptionUpload = ({ jobRoleId, onUploadComplete }: JobDescriptionUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.';
    }

    // Check file extension as backup
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return 'Invalid file extension. Only .pdf, .doc, and .docx files are allowed.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit.';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Invalid File',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create unique file path
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${timestamp}_${sanitizedFileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('job-descriptions')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('job_descriptions')
        .insert({
          job_role_id: jobRoleId || null,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Job description uploaded successfully',
      });

      setSelectedFile(null);
      if (onUploadComplete) onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Job Description</h3>
          <p className="text-sm text-muted-foreground">
            Upload job description documents. Only PDF, DOC, and DOCX files are accepted (max 5MB).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="jd-upload" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="h-8 w-8" />
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              <Input
                id="jd-upload"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
              />
            </Label>
          </div>

          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Job Description
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};