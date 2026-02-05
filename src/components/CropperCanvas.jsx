import { useEffect, useMemo, useRef, useState } from 'react';

const HANDLE_RADIUS = 10;

export default function CropperCanvas({ imageSrc, initialPoints, onConfirm }) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState(initialPoints || []);
  const [active, setActive] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    setPoints(initialPoints || []);
  }, [initialPoints]);

  const scale = useMemo(() => {
    if (!image) return { x: 1, y: 1, drawW: 0, drawH: 0 };
    const maxW = 900;
    const ratio = Math.min(1, maxW / image.width);
    return { x: ratio, y: ratio, drawW: image.width * ratio, drawH: image.height * ratio };
  }, [image]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = scale.drawW;
    canvas.height = scale.drawH;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, scale.drawW, scale.drawH);

    if (points.length === 4) {
      const drawn = points.map((p) => ({ x: p.x * scale.x, y: p.y * scale.y }));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      drawn.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.stroke();

      drawn.forEach((p) => {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(p.x, p.y, HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [image, points, scale]);

  const getCanvasPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const findHandle = (pos) =>
    points.findIndex((p) => {
      const dx = p.x * scale.x - pos.x;
      const dy = p.y * scale.y - pos.y;
      return Math.hypot(dx, dy) <= HANDLE_RADIUS + 4;
    });

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700"
        onMouseDown={(e) => {
          const idx = findHandle(getCanvasPoint(e));
          if (idx >= 0) setActive(idx);
        }}
        onMouseMove={(e) => {
          if (active === null) return;
          const pos = getCanvasPoint(e);
          setPoints((prev) =>
            prev.map((p, idx) =>
              idx !== active
                ? p
                : {
                    x: Math.max(0, Math.min((pos.x / scale.x), image.width)),
                    y: Math.max(0, Math.min((pos.y / scale.y), image.height)),
                  },
            ),
          );
        }}
        onMouseUp={() => setActive(null)}
        onMouseLeave={() => setActive(null)}
      />
      <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => onConfirm(points)}>
        Confirm Crop
      </button>
    </div>
  );
}
