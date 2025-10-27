import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const BulkCVUpload = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedJobRole, setSelectedJobRole] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const { data: jobRoles } = useQuery({
    queryKey: ['active-job-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_roles')
        .select('id, title, department')
        .eq('status', 'active')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} CVs allowed at once`);
      return;
    }

    const validFiles = files.filter(file => {
      const isPDF = file.type === 'application/pdf';
      const isValidSize = file.size <= MAX_FILE_SIZE;
      
      if (!isPDF) {
        toast.error(`${file.name}: Only PDF files are allowed`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: File size exceeds 10MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedJobRole) {
      toast.error('Please select a job role');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one CV');
      return;
    }

    setUploading(true);
    setUploadResults({ success: 0, failed: 0 });
    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);

        try {
          // Extract candidate name from filename
          const candidateName = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
          
          // Insert resume record
          const { data: resumeData, error: insertError } = await supabase
            .from('resumes')
            .insert({
              candidate_name: candidateName,
              email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`,
              position_applied: jobRoles?.find(j => j.id === selectedJobRole)?.title || 'Not specified',
              job_role_id: selectedJobRole,
              screening_status: 'pending',
              pipeline_stage: 'pending',
              source: 'real',
              parsed_data: { uploaded_by_admin: true, filename: file.name }
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Upload PDF file to storage
          const filePath = `resumes/${resumeData.id}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

          // Update resume with file URL
          await supabase
            .from('resumes')
            .update({ file_url: publicUrl })
            .eq('id', resumeData.id);

          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failedCount++;
        }
      }

      setUploadResults({ success: successCount, failed: failedCount });
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} CV(s)`);
        setTimeout(() => {
          navigate('/recruitment/enhanced-screening');
        }, 2000);
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to upload ${failedCount} CV(s)`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Bulk CV Upload</h3>
          <p className="text-sm text-muted-foreground">
            Upload up to {MAX_FILES} CVs at once. Only PDF format is supported.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Maximum {MAX_FILES} CVs per upload. Each file must be PDF and under 10MB.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Job Role</label>
            <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose job role for CVs" />
              </SelectTrigger>
              <SelectContent>
                {jobRoles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title} {role.department && `- ${role.department}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="cv-upload"
              disabled={uploading}
            />
            <label htmlFor="cv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload CVs</p>
              <p className="text-xs text-muted-foreground">
                PDF only, max {MAX_FILES} files, 10MB each
              </p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Selected Files ({selectedFiles.length}/{MAX_FILES})
                </p>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {uploadResults.success > 0 || uploadResults.failed > 0 ? (
            <div className="space-y-2">
              {uploadResults.success > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {uploadResults.success} CV(s) uploaded successfully
                  </span>
                </div>
              )}
              {uploadResults.failed > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {uploadResults.failed} CV(s) failed to upload
                  </span>
                </div>
              )}
            </div>
          ) : null}

          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || !selectedJobRole}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} CV(s)
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
