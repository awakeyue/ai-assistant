import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { nanoid } from "nanoid";

const BUCKET_NAME = "chat-image";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for chat images
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface UploadResult {
  url: string;
  path: string;
  filename: string;
  mediaType: string;
}

/**
 * POST /api/upload/chat-image - Upload chat images to Supabase Storage
 * Supports single or multiple file uploads
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate all files first
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.name}. Allowed: JPEG, PNG, GIF, WebP`,
          },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 },
        );
      }
    }

    const supabase = await createClient();
    const results: UploadResult[] = [];

    // Upload all files
    for (const file of files) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${nanoid()}.${fileExt}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}` },
          { status: 500 },
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      results.push({
        url: urlData.publicUrl,
        path: data.path,
        filename: file.name,
        mediaType: file.type,
      });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 },
    );
  }
}
