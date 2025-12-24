import { useState } from "react";
import { UploadedFile, ConversionOptions, ProcessedResult } from "@shared/schema";
import { useUploadFiles, useProcessFiles } from "@/hooks/use-converter";
import { Dropzone } from "@/components/Dropzone";
import { FileCard } from "@/components/FileCard";
import { Sidebar } from "@/components/Sidebar";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RotateCcw, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<ProcessedResult[] | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  
  const [options, setOptions] = useState<ConversionOptions>({
    format: "jpeg",
    quality: 80,
    watermarkOpacity: 0.5,
    keepMetadata: false,
    // targetSizeKB is undefined by default
  });

  const uploadMutation = useUploadFiles();
  const processMutation = useProcessFiles();
  const { toast } = useToast();

  const handleDrop = async (files: File[]) => {
    try {
      const uploaded = await uploadMutation.mutateAsync(files);
      setUploadedFiles(prev => [...prev, ...uploaded]);
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) return;

    try {
      const response = await processMutation.mutateAsync({
        fileIds: uploadedFiles.map(f => f.id),
        options,
      });
      
      setResults(response.results);
      setZipUrl(response.zipUrl);
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setResults(null);
    setZipUrl(null);
  };

  const showResults = results !== null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar - Settings Panel */}
      {!showResults && (
        <motion.aside 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-80 lg:w-96 flex-shrink-0 z-20 h-[50vh] md:h-screen sticky top-0 md:relative"
        >
          <Sidebar 
            options={options}
            setOptions={setOptions}
            onProcess={handleProcess}
            isProcessing={processMutation.isPending}
            fileCount={uploadedFiles.length}
          />
        </motion.aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
        
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <ImageIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold text-black dark:text-black">
                Image Convert / Compress
              </h1>
            </div>
            
            {showResults && (
              <Button variant="ghost" onClick={() => setResults(null)} className="hover:bg-white/5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Upload Area */}
                <section>
                  <Dropzone onDrop={handleDrop} isUploading={uploadMutation.isPending} />
                </section>

                {/* File Grid */}
                {uploadedFiles.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Queue ({uploadedFiles.length})</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => setUploadedFiles([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {uploadedFiles.map((file) => (
                          <FileCard 
                            key={file.id} 
                            file={file} 
                            onRemove={handleRemoveFile} 
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Results Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
                  <div>
                    <h2 className="text-2xl font-bold font-display">Conversion Complete!</h2>
                    <p className="text-muted-foreground mt-1">
                      Successfully processed {results?.length} files.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Start Over
                    </Button>
                    {zipUrl && (
                      <Button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = zipUrl;
                          link.download = 'converted_files.zip';
                          link.click();
                        }}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download All (ZIP)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results?.map((result, idx) => (
                    <ResultCard key={result.id} result={result} index={idx} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
