# Scanify

Scanify is a locally runnable React + Vite single-page document scanner app.

## Features

- Upload image, camera capture (`capture=environment`), and drag/drop input.
- 4-point manual perspective crop (drag each corner).
- OpenCV.js-powered perspective warp + document filters:
  - Original
  - Grayscale
  - Scan/Binary (adaptive threshold)
  - Magic Color
- Multi-page management with thumbnail filmstrip and delete support.
- Export current page as JPG.
- Export all pages as A4 portrait PDF using `jspdf`.
- System/light/dark mode support.

## OpenCV.js setup (important)

OpenCV.js is loaded from CDN in `index.html` and initialized with `Module.onRuntimeInitialized`:

```html
<script>
  window.Module = {
    onRuntimeInitialized() {
      window.dispatchEvent(new Event('opencv-ready'));
    },
  };
</script>
<script async src="https://docs.opencv.org/4.10.0/opencv.js"></script>
```

The React app listens for the `opencv-ready` event before enabling processing operations.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
.
├── index.html
├── package.json
├── src
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── components
│   │   ├── CropperCanvas.jsx
│   │   ├── FilterControls.jsx
│   │   ├── ImageUploader.jsx
│   │   └── PageList.jsx
│   └── utils
│       └── imageProcessing.js
└── tailwind.config.js
```
