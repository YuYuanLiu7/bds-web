import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// 1. GET: List all uploaded media files
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

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

    // Strategy B: Local uploads fallback（僅本機/有檔案系統的平台可用；
    // Cloudflare Workers 等無檔案系統環境會拋錯，這裡整段以 try/catch 保護，失敗即回空清單）
    try {
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
    } catch (fsErr) {
      console.warn('本機檔案備援不可用（可能為無檔案系統平台），略過：', fsErr);
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
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get('name');
    if (!rawName) {
      return NextResponse.json({ error: "Missing file name" }, { status: 400 });
    }

    // 防路徑穿越：只取檔名本身，拒絕任何含路徑分隔符或 ".." 的輸入，
    // 避免傳入 ../../ 之類越界刪除到 uploads 以外的檔案。
    const fileName = path.basename(rawName);
    if (fileName !== rawName || fileName.includes('..')) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
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

    // 2. Delete from Local directory if exists（無檔案系統平台會拋錯，以 try/catch 保護）
    try {
      const localPath = path.join(process.cwd(), 'public', 'uploads', fileName);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`Successfully deleted local file: ${localPath}`);
      }
    } catch (fsErr) {
      console.warn('本機刪檔略過（可能為無檔案系統平台）：', fsErr);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API DELETE media error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
