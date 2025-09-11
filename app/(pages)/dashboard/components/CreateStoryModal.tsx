import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Send, Image, Video } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
  userId?: string;
  apiBaseUrl?: string;
}

interface CreateStoryRequest {
  caption?: string;
  mediaType: string;
  mediaUrl: string;
  userId: string;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  userId,
  apiBaseUrl = '/api'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Simular upload de arquivo (na aplicação real, usar um serviço como AWS S3, Cloudinary, etc.)
  const simulateFileUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // Simular progresso de upload
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Retornar URL fictícia
          resolve(`https://example.com/stories/${Date.now()}-${file.name}`);
        }
      }, 200);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Apenas imagens e vídeos são permitidos');
        return;
      }

      // Validar tamanho (exemplo: máximo 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError('Arquivo muito grande. Máximo permitido: 50MB');
        return;
      }

      setError('');
      setSelectedFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = async (): Promise<void> => {
    if (!selectedFile || !userId) {
      setError('Selecione um arquivo e faça login');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError('');

      // 1. Upload do arquivo
      const mediaUrl = await simulateFileUpload(selectedFile);

      // 2. Criar story
      const storyData: CreateStoryRequest = {
        caption: caption.trim(),
        mediaType: selectedFile.type,
        mediaUrl,
        userId
      };

      const response = await fetch(`${apiBaseUrl}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storyData)
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('Story criado com sucesso!');
        onStoryCreated();
        handleClose();
      } else {
        throw new Error(result.error || 'Erro ao criar story');
      }

    } catch (error) {
      console.error('Erro ao criar story:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar story. Tente novamente.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = (): void => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setUploading(false);
    setUploadProgress(0);
    setError('');
    onClose();
  };

  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Criar Story</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={uploading}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* File Selection */}
          {!selectedFile && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Selecione uma foto ou vídeo para seu story
                    </p>
                    <p className="text-xs text-gray-500">
                      Máximo: 50MB • Formatos: JPG, PNG, MP4, MOV
                    </p>
                  </div>
                  <Button onClick={triggerFileInput} className="mx-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Escolher arquivo
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview and Form */}
          {selectedFile && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    className="w-full h-64 object-cover"
                    controls
                  />
                )}
                
                {/* Change file button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={triggerFileInput}
                  className="absolute top-2 right-2"
                  disabled={uploading}
                >
                  Trocar
                </Button>
              </div>

              {/* Caption Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Legenda (opcional)</label>
                <Textarea
                  placeholder="Escreva uma legenda para seu story..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 text-right">
                  {caption.length}/500 caracteres
                </p>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Publicando story...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={uploading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateStory}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    'Publicando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publicar Story
                    </>
                  )}
                </Button>
              </div>

              {/* Story Info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Lembrete:</strong> Seu story ficará visível por 24 horas e depois desaparecerá automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Hidden file input - segunda instância removida para evitar duplicação */}
        </div>
      </Card>
    </div>
  );
};

export default CreateStoryModal;