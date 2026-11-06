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
    const mimeType = file.type || "image/png";

    let publicUrl: string | null = null;

    // Try disk write first (for local development or persistent storage)
    try {
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
        } catch {
          // Non-critical mirror write
        }
      }

      publicUrl = `/uploads/${filename}`;
    } catch (diskErr) {
      // In serverless environments like Vercel (read-only filesystem),
      // seamlessly fallback to base64 Data URL so upload NEVER fails
      console.warn("Serverless / read-only filesystem detected, falling back to base64 data URL:", diskErr);
      const base64 = buffer.toString("base64");
      publicUrl = `data:${mimeType};base64,${base64}`;
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      mimeType: mimeType
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message || "File upload failed" }, { status: 500 });
  }
}
