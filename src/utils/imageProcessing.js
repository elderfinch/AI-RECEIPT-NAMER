const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const orderPoints = (points) => {
  const sumSorted = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const diffSorted = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));
  return [sumSorted[0], diffSorted[0], sumSorted[3], diffSorted[3]];
};

export const defaultPoints = (width, height) => {
  const m = Math.round(Math.min(width, height) * 0.08);
  return [
    { x: m, y: m },
    { x: width - m, y: m },
    { x: width - m, y: height - m },
    { x: m, y: height - m },
  ];
};

export const detectDocumentCorners = (cv, mat) => {
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
  cv.Canny(blur, edges, 75, 200);
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  let best = null;
  let maxArea = 0;

  for (let i = 0; i < contours.size(); i += 1) {
    const contour = contours.get(i);
    const peri = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.02 * peri, true);
    const area = cv.contourArea(approx);
    if (approx.rows === 4 && area > maxArea) {
      maxArea = area;
      const pts = [];
      for (let p = 0; p < 4; p += 1) {
        pts.push({ x: approx.intPtr(p, 0)[0], y: approx.intPtr(p, 0)[1] });
      }
      best = orderPoints(pts);
    }
    approx.delete();
    contour.delete();
  }

  gray.delete();
  blur.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();

  return best;
};

export const warpPerspectiveFromPoints = async (cv, dataUrl, points) => {
  const image = await loadImageElement(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const src = cv.imread(canvas);
  const [tl, tr, br, bl] = orderPoints(points);

  const width = Math.max(distance(tr, tl), distance(br, bl));
  const height = Math.max(distance(bl, tl), distance(br, tr));

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x,
    tl.y,
    tr.x,
    tr.y,
    br.x,
    br.y,
    bl.x,
    bl.y,
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    width - 1,
    0,
    width - 1,
    height - 1,
    0,
    height - 1,
  ]);

  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(Math.round(width), Math.round(height)), cv.INTER_LINEAR, cv.BORDER_CONSTANT);

  const out = document.createElement('canvas');
  cv.imshow(out, dst);

  const jpg = out.toDataURL('image/jpeg', 0.96);

  src.delete();
  srcTri.delete();
  dstTri.delete();
  M.delete();
  dst.delete();

  return jpg;
};

export const applyFilter = async (cv, dataUrl, filter) => {
  if (filter === 'original') return dataUrl;

  const img = await loadImageElement(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);

  if (filter === 'magic') {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, (d[i] - 100) * 1.35 + 120);
      d[i + 1] = Math.min(255, (d[i + 1] - 100) * 1.35 + 120);
      d[i + 2] = Math.min(255, (d[i + 2] - 100) * 1.35 + 120);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  let outputCanvas = document.createElement('canvas');

  if (filter === 'grayscale') {
    const out = new cv.Mat();
    cv.cvtColor(gray, out, cv.COLOR_GRAY2RGBA);
    cv.imshow(outputCanvas, out);
    out.delete();
  }

  if (filter === 'scan') {
    const out = new cv.Mat();
    cv.adaptiveThreshold(gray, out, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15);
    cv.imshow(outputCanvas, out);
    out.delete();
  }

  src.delete();
  gray.delete();

  return outputCanvas.toDataURL('image/jpeg', 0.95);
};
