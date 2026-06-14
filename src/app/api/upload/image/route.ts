import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { verifyJWT, COOKIE_NAME } from "@/lib/auth";

// Ported from the main site. Uploads to ImageKit and returns the public URL.
// Auth: any logged-in admin (valid JWT cookie) may upload.
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY ?? "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY ?? "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ?? "",
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyJWT(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "/iode";
    const fileName =
      (formData.get("fileName") as string) || file?.name || "upload";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Optional caller-supplied limits (used by the document slots: JPG/PNG/PDF,
    // 300 KB). Image uploads that omit `maxBytes` are unaffected.
    const maxBytes = Number(formData.get("maxBytes")) || 0;
    if (maxBytes > 0) {
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG or PDF allowed." },
          { status: 400 }
        );
      }
      if (file.size > maxBytes) {
        return NextResponse.json(
          { error: `File too large. Max ${Math.round(maxBytes / 1024)} KB.` },
          { status: 400 }
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await imagekit.upload({
      file: base64,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    return NextResponse.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    console.error("[upload/image]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
