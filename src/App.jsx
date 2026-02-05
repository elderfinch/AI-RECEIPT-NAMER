import { Download, FileImage, FilePlus2, FileText, Moon, Sun } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useEffect, useMemo, useState } from 'react';
import CropperCanvas from './components/CropperCanvas';
import FilterControls from './components/FilterControls';
import ImageUploader from './components/ImageUploader';
import PageList from './components/PageList';
import { applyFilter, defaultPoints, detectDocumentCorners, loadImageElement, warpPerspectiveFromPoints } from './utils/imageProcessing';

const uid = () => crypto.randomUUID();

export default function App() {
  const [cvReady, setCvReady] = useState(!!window.cv);
  const [theme, setTheme] = useState(localStorage.getItem('scanify-theme') || 'system');
  const [loading, setLoading] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [cropPoints, setCropPoints] = useState([]);
  const [pages, setPages] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const done = () => setCvReady(true);
    window.addEventListener('opencv-ready', done);
    if (window.cv?.Mat) setCvReady(true);
    return () => window.removeEventListener('opencv-ready', done);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
    root.classList.toggle('dark', isDark);
    localStorage.setItem('scanify-theme', theme);
  }, [theme]);

  const activePage = useMemo(() => pages.find((p) => p.id === activeId) || null, [pages, activeId]);

  const handleImagePicked = async (src) => {
    setRawImage(src);
    if (!cvReady) {
      const image = await loadImageElement(src);
      setCropPoints(defaultPoints(image.width, image.height));
      return;
    }

    setLoading(true);
    try {
      const image = await loadImageElement(src);
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const mat = window.cv.imread(canvas);
      const detected = detectDocumentCorners(window.cv, mat);
      mat.delete();
      setCropPoints(detected || defaultPoints(image.width, image.height));
    } finally {
      setLoading(false);
    }
  };

  const confirmCrop = async (points) => {
    if (!rawImage || points.length !== 4 || !cvReady) return;
    setLoading(true);
    try {
      const warped = await warpPerspectiveFromPoints(window.cv, rawImage, points);
      const id = uid();
      const page = { id, base: warped, filter: 'original', preview: warped };
      setPages((prev) => [...prev, page]);
      setActiveId(id);
      setRawImage(null);
      setCropPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const applyPageFilter = async (filter) => {
    if (!activePage || !cvReady) return;
    setLoading(true);
    try {
      const preview = await applyFilter(window.cv, activePage.base, filter);
      setPages((prev) => prev.map((p) => (p.id === activePage.id ? { ...p, filter, preview } : p)));
    } finally {
      setLoading(false);
    }
  };

  const deletePage = (id) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (id === activeId) {
      const remaining = pages.filter((p) => p.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  const downloadJpg = () => {
    if (!activePage) return;
    const link = document.createElement('a');
    link.href = activePage.preview;
    link.download = `scanify-page-${pages.findIndex((p) => p.id === activePage.id) + 1}.jpg`;
    link.click();
  };

  const downloadPdf = async () => {
    if (pages.length === 0) return;
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;

      for (let i = 0; i < pages.length; i += 1) {
        const img = await loadImageElement(pages[i].preview);
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(pages[i].preview, 'JPEG', x, y, w, h, undefined, 'FAST');
      }

      pdf.save('scanify-export.pdf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Scanify</h1>
          <p className="text-sm text-slate-500">Upload, crop with 4-point perspective, filter, and export.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="system">System Theme</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <span className="rounded-lg border p-2 dark:border-slate-700">{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span>
        </div>
      </header>

      {!cvReady && <div className="mb-3 rounded-lg border border-amber-400 bg-amber-50 p-2 text-sm text-amber-800">Loading OpenCV.js… some features are disabled until ready.</div>}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {!rawImage && <ImageUploader onImagePicked={handleImagePicked} />}

          {rawImage && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Adjust corners then confirm crop</h2>
              <CropperCanvas imageSrc={rawImage} initialPoints={cropPoints} onConfirm={confirmCrop} />
            </div>
          )}

          {activePage && (
            <>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Filters</h2>
                <FilterControls value={activePage.filter} onChange={applyPageFilter} />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
                <img src={activePage.preview} alt="Selected page" className="max-h-[60vh] w-full object-contain" />
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white" onClick={() => setRawImage(null)}>
              <FilePlus2 size={16} /> Add Page
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={downloadJpg} disabled={!activePage}>
              <FileImage size={16} /> Download JPG
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={downloadPdf} disabled={pages.length === 0}>
              <FileText size={16} /> Download PDF
            </button>
          </div>
        </section>

        <PageList pages={pages} activeId={activeId} onSelect={setActiveId} onDelete={deletePage} />
      </div>

      {loading && (
        <div className="fixed inset-0 grid place-items-center bg-black/40">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 dark:bg-slate-900">
            <Download className="animate-bounce" size={18} /> Processing…
          </div>
        </div>
      )}
    </main>
  );
}
