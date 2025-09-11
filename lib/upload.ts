// lib/upload.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadConfig {
  allowedTypes: string[];
  maxSizeImage: number; // em bytes
  maxSizeVideo: number; // em bytes
  uploadDir: string;
}

const defaultConfig: UploadConfig = {
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/mov',
    'video/avi'
  ],
  maxSizeImage: 10 * 1024 * 1024, // 10MB para imagens
  maxSizeVideo: 100 * 1024 * 1024, // 100MB para vídeos
  uploadDir: 'uploads'
};

export class UploadService {
  private config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async validateFile(file: File): Promise<void> {
    // Validar tipo de arquivo
    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
    }

    // Validar tamanho
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? this.config.maxSizeVideo : this.config.maxSizeImage;
    
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
    }
  }

  async uploadFile(file: File): Promise<string> {
    await this.validateFile(file);

    // Gerar nome único
    const extension = file.name.split('.').pop() || '';
    const fileName = `${uuidv4()}.${extension}`;
    
    // Criar diretório se não existir
    const uploadPath = join(process.cwd(), 'public', this.config.uploadDir);
    await mkdir(uploadPath, { recursive: true });

    // Salvar arquivo
    const filePath = join(uploadPath, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Retornar URL pública
    return `/${this.config.uploadDir}/${fileName}`;
  }

  getMediaType(file: File): 'IMAGE' | 'VIDEO' {
    return file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
  }
}

export const uploadService = new UploadService();