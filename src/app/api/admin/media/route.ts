import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import fs from 'fs';
import path from 'path';

// Helper to check admin role
async function checkAdmin(session: Session | null) {
  if (!session?.user?.email) return false;
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single();
  return !error && data?.role === 'admin';
}

// 1. GET: List all uploaded media files
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bucketName = 'uploads';

    // Strategy A: Supabase Storage
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (!error && data && data.length > 0) {
        const files = data
          .filter(f => f.name !== '.emptyFolderPlaceholder') // skip empty folder placeholder
          .map(file => {
            const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(file.name);
            const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
            let type = 'document';
            if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fileExt)) type = 'image';
            else if (['mp4', 'mov', 'webm', 'ogg'].includes(fileExt)) type = 'video';

            const metadata = file.metadata as { size?: number } | null | undefined;
            const bytes = metadata?.size || 0;
            const sizeStr = bytes > 1024 * 1024
              ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
              : `${(bytes / 1024).toFixed(1)} KB`;

            return {
              id: file.id || file.name,
              name: file.name,
              size: sizeStr,
              type,
              dimensions: type === 'image' ? '雲端' : '—',
              date: file.created_at ? file.created_at.split('T')[0] : '—',
              url: urlData?.publicUrl
            };
          });

        return NextResponse.json({ files, source: 'supabase' });
      }
    } catch (err) {
      console.warn("Supabase Storage list warning, falling back to local files:", err);
    }

    // Strategy B: Local uploads fallback
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const localFiles = fs.readdirSync(uploadsDir);
      const files = localFiles
        .filter(name => !name.startsWith('.'))
        .map(name => {
          const filePath = path.join(uploadsDir, name);
          const stats = fs.statSync(filePath);
          const fileExt = name.split('.').pop()?.toLowerCase() || '';
          let type = 'document';
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fileExt)) type = 'image';
          else if (['mp4', 'mov', 'webm', 'ogg'].includes(fileExt)) type = 'video';

          const sizeStr = stats.size > 1024 * 1024
            ? `${(stats.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(stats.size / 1024).toFixed(1)} KB`;

          return {
            id: name,
            name: name,
            size: sizeStr,
            type,
            dimensions: type === 'image' ? '本機' : '—',
            date: stats.mtime.toISOString().split('T')[0],
            url: `/uploads/${name}`
          };
        });

      return NextResponse.json({ files, source: 'local' });
    }

    return NextResponse.json({ files: [], source: 'none' });

  } catch (error) {
    console.error("API GET media error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 2. DELETE: Remove a specific media file
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('name');
    if (!fileName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 });
    }

    const bucketName = 'uploads';

    // 1. Delete from Supabase Storage
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (!error) {
        console.log(`Successfully deleted ${fileName} from Supabase Storage`);
      }
    } catch (err) {
      console.warn("Supabase Storage delete failed or skipped:", err);
    }

    // 2. Delete from Local directory if exists
    const localPath = path.join(process.cwd(), 'public', 'uploads', fileName);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`Successfully deleted local file: ${localPath}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API DELETE media error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
