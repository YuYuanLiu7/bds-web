'use client';

import { useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon, Quote, Table as TableIcon,
  IndentIncrease, IndentDecrease, Eraser
} from 'lucide-react';
import { uploadFile } from '@/lib/admin-upload';
import { useToast } from '@/components/Toast';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * 可重用富文本（WYSIWYG）編輯器：標題 H1–H4、清單、粗/斜/底線/刪除線、文字大小、
 * 文字色/底色、連結、插圖（上傳）、表格、引用、縮排。輸出 HTML 存回 onChange。
 * 採 contentEditable + document.execCommand（與 ArticleModal 相同的成熟做法）。
 * 顯示端請務必用 sanitizeHtml（src/lib/sanitize.ts）淨化後再 render，避免儲存型 XSS。
 */
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // 外部 value 變更（首次載入、切換不同課程）時灌入內容；
  // 編輯中（聚焦）不覆寫，避免游標跳動。
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emit = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const cmd = (command: string, val: string = '') => {
    ref.current?.focus();
    try { document.execCommand(command, false, val); } catch { /* 舊瀏覽器忽略 */ }
    emit();
  };

  const handleLink = () => {
    const url = prompt('輸入連結網址：', 'https://');
    if (url) cmd('createLink', url);
  };

  const handleTable = () => {
    let html = '<table style="border-collapse:collapse;width:100%" border="1"><tbody>';
    for (let r = 0; r < 2; r++) {
      html += '<tr>';
      for (let c = 0; c < 2; c++) html += '<td style="border:1px solid #cbd5e1;padding:6px;min-width:40px">&nbsp;</td>';
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    cmd('insertHTML', html);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'public'); // 內文插圖為公開內容
      cmd('insertImage', url);
    } catch (err) {
      toast.error('圖片上傳失敗：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-200 transition"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-slate-50">
        <select
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { cmd('formatBlock', e.target.value); e.target.selectedIndex = 0; }}
          className="h-8 px-2 rounded-md text-xs font-bold text-slate-600 bg-white border border-gray-200 cursor-pointer"
          title="段落樣式"
        >
          <option value="">樣式</option>
          <option value="P">內文</option>
          <option value="H1">標題 H1</option>
          <option value="H2">標題 H2</option>
          <option value="H3">標題 H3</option>
          <option value="H4">標題 H4</option>
        </select>
        <select
          onChange={(e) => { cmd('fontSize', e.target.value); e.target.selectedIndex = 0; }}
          className="h-8 px-2 rounded-md text-xs font-bold text-slate-600 bg-white border border-gray-200 cursor-pointer"
          title="文字大小"
        >
          <option value="">大小</option>
          <option value="1">小</option>
          <option value="3">中</option>
          <option value="5">大</option>
          <option value="7">特大</option>
        </select>
        <Btn onClick={() => cmd('bold')} title="粗體"><Bold className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('italic')} title="斜體"><Italic className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('underline')} title="底線"><Underline className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('strikeThrough')} title="刪除線"><Strikethrough className="w-4 h-4" /></Btn>
        <label className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 cursor-pointer relative" title="文字顏色">
          <span className="text-xs font-black text-slate-700">A</span>
          <input type="color" onChange={(e) => cmd('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <label className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 cursor-pointer relative" title="文字底色">
          <span className="text-xs font-black px-1 rounded" style={{ background: '#fde68a' }}>A</span>
          <input type="color" onChange={(e) => { cmd('hiliteColor', e.target.value); cmd('backColor', e.target.value); }} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <Btn onClick={() => cmd('insertUnorderedList')} title="項目清單"><List className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('insertOrderedList')} title="編號清單"><ListOrdered className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('formatBlock', 'BLOCKQUOTE')} title="引用"><Quote className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('outdent')} title="減少縮排"><IndentDecrease className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('indent')} title="增加縮排"><IndentIncrease className="w-4 h-4" /></Btn>
        <Btn onClick={handleLink} title="插入連結"><LinkIcon className="w-4 h-4" /></Btn>
        <Btn onClick={() => fileRef.current?.click()} title="插入圖片"><ImageIcon className="w-4 h-4" /></Btn>
        <Btn onClick={handleTable} title="插入表格"><TableIcon className="w-4 h-4" /></Btn>
        <Btn onClick={() => cmd('removeFormat')} title="清除格式"><Eraser className="w-4 h-4" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder || '請輸入內容…'}
        className="px-4 py-3 min-h-[160px] max-h-[420px] overflow-y-auto outline-none text-sm text-slate-800 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
      />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
    </div>
  );
}
