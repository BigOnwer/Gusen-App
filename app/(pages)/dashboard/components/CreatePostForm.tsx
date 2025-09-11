// components/CreatePostForm.tsx (versão atualizada)
import { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Send, Image, Video, Loader2 } from 'lucide-react';
import { usePostService } from '@/lib/postService';
import { PostData, PostType } from '@/types/posts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CreatePostFormProps {
  userId: string; // ID do usuário logado
  onPostCreated?: () => void; // Callback para atualizar a timeline
  setTab: (tab: string) => void;
}

export function CreatePostForm({ userId, onPostCreated, setTab }: CreatePostFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState<PostType>('post');
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter()

  const { createPost } = usePostService();

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileType(file.type.startsWith('video/') ? 'video' : 'image');

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedFile) {
      alert('Por favor, selecione uma foto ou vídeo');
      return;
    }

    setIsLoading(true);

    try {
      const postData: PostData = {
        file: selectedFile,
        caption,
        postType,
        fileType: fileType as 'image' | 'video'
      };

      const result = await createPost(postData, userId);
      
      toast.success(`${postType === 'story' ? 'Story' : 'Post'} criado com sucesso!`)
      
      // Reset form
      resetForm();
      
      // Callback para atualizar timeline
      onPostCreated?.();

      setTab('home')
    } catch (error) {
      console.error('Erro ao criar post:', error);
      toast.error(`Erro ao criar ${postType === 'story' ? 'story' : 'post'}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: {
          label: 'Tentar Novamente',
          onClick: () => {router.refresh()}
        }
      })
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (): void => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setPostType('post');
    setFileType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clean up preview URL
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };

  const removeFile = (): void => {
    setSelectedFile(null);
    setPreview(null);
    setFileType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };

  const handleCaptionChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setCaption(event.target.value);
  };

  const handlePostTypeChange = (value: PostType): void => {
    setPostType(value);
  };

  const maxCaptionLength = 500;
  const isSubmitDisabled = !selectedFile || isLoading;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Criar Publicação
            </CardTitle>
            <p className="text-gray-600">
              Compartilhe seus momentos especiais
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Mídia
              </Label>
              
              {!selectedFile ? (
                <div 
                  onClick={handleUploadClick}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleUploadClick();
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Clique para selecionar
                  </p>
                  <p className="text-sm text-gray-500">
                    Foto ou vídeo (JPG, PNG, MP4, MOV) - Max: 10MB para imagens, 100MB para vídeos
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  {fileType === 'image' ? (
                    <img 
                      src={preview || ''} 
                      alt="Preview da mídia selecionada" 
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <video 
                      src={preview || ''} 
                      className="w-full h-64 object-cover"
                      controls
                      aria-label="Preview do vídeo selecionado"
                    />
                  )}
                  
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleUploadClick}
                      className="bg-white/90 hover:bg-white"
                      aria-label="Alterar mídia"
                      disabled={isLoading}
                    >
                      {fileType === 'image' ? 
                        <Image className="h-4 w-4" /> : 
                        <Video className="h-4 w-4" />
                      }
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeFile}
                      className="bg-red-500/90 hover:bg-red-500"
                      aria-label="Remover mídia"
                      disabled={isLoading}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Selecionar arquivo de mídia"
                disabled={isLoading}
              />
            </div>

            {/* Caption Section */}
            <div className="space-y-3">
              <Label htmlFor="caption" className="text-lg font-semibold">
                Legenda
              </Label>
              <Textarea
                id="caption"
                placeholder="Escreva uma legenda para sua publicação..."
                value={caption}
                onChange={handleCaptionChange}
                className="min-h-[100px] resize-none border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                maxLength={maxCaptionLength}
                disabled={isLoading}
              />
              <div className="text-right text-sm text-gray-500">
                {caption.length}/{maxCaptionLength}
              </div>
            </div>

            {/* Post Type Selection */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">
                Tipo de Publicação
              </Label>
              <RadioGroup value={postType} onValueChange={handlePostTypeChange} disabled={isLoading}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="post" id="post" />
                    <Label htmlFor="post" className="flex-1 cursor-pointer">
                      <div className="font-medium">Post</div>
                      <div className="text-sm text-gray-500">
                        Permanece no perfil
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="story" id="story" />
                    <Label htmlFor="story" className="flex-1 cursor-pointer">
                      <div className="font-medium">Story</div>
                      <div className="text-sm text-gray-500">
                        Desaparece em 24h
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {postType === 'story' ? 'Criando Story...' : 'Criando Post...'}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  {postType === 'story' ? 'Publicar Story' : 'Publicar Post'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}