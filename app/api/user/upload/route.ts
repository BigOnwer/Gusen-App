import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Arquivo ou usuário inválido" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(process.cwd(), "public", "uploads", filename);

    await writeFile(filepath, buffer);

    // Criar URL pública
    const fileUrl = `/uploads/${filename}`;

    // Atualizar usuário no banco
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: fileUrl },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error("Erro no upload:", err);
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
}
