import { Camera, Upload } from 'lucide-react';
import { useRef } from 'react';

export default function ImageUploader({ onImagePicked }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => onImagePicked(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p className="mb-4 text-sm text-slate-500">Drop image here, upload, or take a photo.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Upload Image
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white" onClick={() => cameraRef.current?.click()}>
          <Camera size={16} /> Take Photo
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
