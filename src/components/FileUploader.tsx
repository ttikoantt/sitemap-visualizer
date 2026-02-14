import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { parseFile } from '../utils/file-parser';
import { useSitemapStore } from '../store/sitemap-store';

export function FileUploader() {
  const processURLs = useSitemapStore((s) => s.processURLs);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const urls = await parseFile(file);
      await processURLs(urls, file.name);
    } catch (e) {
      alert(`ファイルの読み込みに失敗しました: ${(e as Error).message}`);
    }
  }, [processURLs]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${isDragging ? '#4A90D9' : '#ccc'}`,
        borderRadius: 12,
        padding: '40px 20px',
        textAlign: 'center',
        background: isDragging ? '#f0f7ff' : '#fafafa',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: 36, marginBottom: 12 }}>
        {isDragging ? '\u{1F4CB}' : '\u{1F4C1}'}
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#333', margin: '0 0 8px' }}>
        CSV / Excel ファイルをドラッグ＆ドロップ
      </p>
      <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
        またはクリックしてファイルを選択（.csv, .xlsx, .xls 対応）
      </p>
    </div>
  );
}
