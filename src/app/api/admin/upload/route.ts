import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // 2. Validate admin role from Database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // 3. Parse file from FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `bds-img-${Date.now()}.${fileExt}`;

    // 4. Strategy A: Try uploading to Supabase Storage first
    try {
      const bucketName = 'uploads';

      // Upload file buffer
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          console.log("Successfully saved image to Supabase Storage:", urlData.publicUrl);
          return NextResponse.json({ url: urlData.publicUrl });
        }
      } else {
        console.warn("Supabase storage upload warning (falling back to server folder):", error?.message);
      }
    } catch (supabaseErr) {
      console.warn("Supabase Storage error, switching to local filesystem fallback:", supabaseErr);
    }

    // 5. Strategy B: Local filesystem fallback (Failsafe for local dev)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/${fileName}`;
    console.log("Successfully saved image locally:", localUrl);
    return NextResponse.json({ url: localUrl });

  } catch (error: any) {
    console.error("API POST upload error:", error);
    return NextResponse.json({ error: "File upload failed: " + error.message }, { status: 500 });
  }
}
