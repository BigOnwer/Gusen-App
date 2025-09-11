// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/upload';
import { ApiResponse, UploadResponse } from '@/types/posts';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      }, { status: 400 });
    }

    // Upload do arquivo
    const mediaUrl = await uploadService.uploadFile(file);
    const mediaType = uploadService.getMediaType(file);

    return NextResponse.json({
      success: true,
      data: {
        url: mediaUrl,
        mediaType
      }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Método não permitido'
  }, { status: 405 });
}