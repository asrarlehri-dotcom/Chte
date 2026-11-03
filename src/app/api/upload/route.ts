import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine correct public directory whether running from root or cms folder
    let publicDir = fs.existsSync(path.join(process.cwd(), "cms", "public"))
      ? path.join(process.cwd(), "cms", "public")
      : path.join(process.cwd(), "public");

    const uploadsDir = path.join(publicDir, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Also sync to root public if running from root so both locations have it
    const rootUploadsDir = path.join(process.cwd(), "public", "uploads");
    if (rootUploadsDir !== uploadsDir && fs.existsSync(path.join(process.cwd(), "public"))) {
      if (!fs.existsSync(rootUploadsDir)) {
        fs.mkdirSync(rootUploadsDir, { recursive: true });
      }
    }

    // Generate safe filename with timestamp
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, buffer);

    if (rootUploadsDir !== uploadsDir && fs.existsSync(rootUploadsDir)) {
      try {
        await fs.promises.writeFile(path.join(rootUploadsDir, filename), buffer);
      } catch (e) {
        // Non-critical mirror write
      }
    }

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      mimeType: file.type
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
