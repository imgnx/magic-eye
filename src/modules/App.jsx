import React, { useCallback, useRef, useState } from 'react';

const MIN_PATTERN_WIDTH = 40;
const MAX_PATTERN_WIDTH = 300;
const DEFAULT_PATTERN_WIDTH = 120;

const MIN_MAX_SHIFT = 4;
const MAX_MAX_SHIFT = 80;
const DEFAULT_MAX_SHIFT = 28;

const App = () => {
  const canvasRef = useRef(null);
  const [depthImage, setDepthImage] = useState(null);
  const [patternWidth, setPatternWidth] = useState(
    String(DEFAULT_PATTERN_WIDTH)
  );
  const [maxShift, setMaxShift] = useState(String(DEFAULT_MAX_SHIFT));
  const [invert, setInvert] = useState(false);
  const [depthFileName, setDepthFileName] = useState('magic-eye.png');
  const [hasRendered, setHasRendered] = useState(false);

  const handleDepthChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readAsDataUrl(file);
      const image = await loadImage(dataUrl);
      const autoPatternWidth = findDivisiblePatternWidth(
        image.naturalWidth || image.width,
        DEFAULT_PATTERN_WIDTH
      );

      setDepthImage(image);
      setDepthFileName(file.name ? `magic-eye-${file.name}` : 'magic-eye.png');
      setPatternWidth(String(autoPatternWidth));
      setHasRendered(false);
    } catch (error) {
      console.error('Failed to load depth map', error);
    }
  }, []);

  const handleRender = useCallback(() => {
    if (!depthImage || !canvasRef.current) return;

    const resolvedPatternWidth = clampInt(
      patternWidth,
      MIN_PATTERN_WIDTH,
      MAX_PATTERN_WIDTH,
      DEFAULT_PATTERN_WIDTH
    );
    const resolvedMaxShift = clampInt(
      maxShift,
      MIN_MAX_SHIFT,
      MAX_MAX_SHIFT,
      DEFAULT_MAX_SHIFT
    );

    renderAutostereogram(
      depthImage,
      canvasRef.current,
      resolvedPatternWidth,
      resolvedMaxShift,
      invert
    );

    setPatternWidth(String(resolvedPatternWidth));
    setMaxShift(String(resolvedMaxShift));
    setHasRendered(true);
  }, [depthImage, patternWidth, maxShift, invert]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = depthFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [depthFileName]);

  return (
    <div className="stack container mx-auto">
      <h1 className="text-5xl mb-3">
        Magic Eye (Autostereogram) Maker
      </h1>

      <div className="flex flex-row w-full justify-around">
        <label
          htmlFor="depthFile"
          className="text-center !shadow !shadow-[white] px-4 py-1.5 max-w-max"
        >
          Depth map
          <input
            id="depthFile"
            type="file"
            accept="image/*"
            onChange={handleDepthChange}
          />
        </label>

        <label
          htmlFor="patternWidth"
          className="text-center !shadow !shadow-[white] px-4 py-1.5 max-w-max"
        >
          Pattern width
          <input
            id="patternWidth"
            type="number"
            min={MIN_PATTERN_WIDTH}
            max={MAX_PATTERN_WIDTH}
            value={patternWidth}
            onChange={(event) => setPatternWidth(event.target.value)}
            disabled={!depthImage}
          />
        </label>

        <label
          htmlFor="maxShift"
          className="text-center !shadow !shadow-[white] px-4 py-1.5 max-w-max"
        >
          Max shift
          <input
            id="maxShift"
            type="number"
            min={MIN_MAX_SHIFT}
            max={MAX_MAX_SHIFT}
            value={maxShift}
            onChange={(event) => setMaxShift(event.target.value)}
            disabled={!depthImage}
          />
        </label>

        <label
          htmlFor="invert"
          className="text-center !shadow !shadow-[white] px-4 py-1.5 max-w-max"
        >
          Invert
          <input
            id="invert"
            type="checkbox"
            checked={invert}
            onChange={(event) => setInvert(event.target.checked)}
            disabled={!depthImage}
          />
        </label>

        <button
          type="button"
          className="btn btn-primary flex"
          onClick={handleRender}
          disabled={!depthImage}
        >
          Render
        </button>
        <button
          type="button"
          className="btn btn-primary flex"
          onClick={handleDownload}
          disabled={!hasRendered}
        >
          Download PNG
        </button>
      </div>

      <div className="hint">
        Use a grayscale depth map (black = far, white = near). Soft edges work
        best.
      </div>

      <canvas ref={canvasRef} className="max-w-full border border-gray-300" />
    </div>
  );
};

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function findDivisiblePatternWidth(imageWidth, fallback = DEFAULT_PATTERN_WIDTH) {
  const boundedFallback = clampInt(
    fallback,
    MIN_PATTERN_WIDTH,
    MAX_PATTERN_WIDTH,
    DEFAULT_PATTERN_WIDTH
  );
  if (!imageWidth) return boundedFallback;
  if (imageWidth % boundedFallback === 0) return boundedFallback;

  let best = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let candidate = MIN_PATTERN_WIDTH; candidate <= MAX_PATTERN_WIDTH; candidate++) {
    if (imageWidth % candidate === 0) {
      const delta = Math.abs(candidate - boundedFallback);
      if (delta < bestDelta) {
        best = candidate;
        bestDelta = delta;
      }
    }
  }

  return best ?? boundedFallback;
}

function renderAutostereogram(
  depthImage,
  canvas,
  patternWidth,
  maxShift,
  invert
) {
  const w = depthImage.naturalWidth || depthImage.width;
  const h = depthImage.naturalHeight || depthImage.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const depthCanvas = document.createElement('canvas');
  depthCanvas.width = w;
  depthCanvas.height = h;
  const dctx = depthCanvas.getContext('2d', { willReadFrequently: true });
  if (!dctx) return;
  dctx.drawImage(depthImage, 0, 0, w, h);
  const depthData = dctx.getImageData(0, 0, w, h).data;

  canvas.width = w;
  canvas.height = h;

  const outImage = ctx.createImageData(w, h);
  const outData = outImage.data;

  const tile = new Uint8ClampedArray(patternWidth * 3);
  cryptoFill(tile);

  for (let y = 0; y < h; y++) {
    const same = new Int32Array(w);
    for (let i = 0; i < w; i++) same[i] = i;

    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4;
      const r = depthData[di];
      const g = depthData[di + 1];
      const b = depthData[di + 2];
      let depth = (r + g + b) / (3 * 255);
      if (invert) depth = 1 - depth;

      const shift = Math.round(depth * maxShift);
      const left = x;
      const right = x + patternWidth - shift;

      if (right >= 0 && right < w) {
        let s = left;
        let t = right;

        while (same[s] !== s) s = same[s];
        while (same[t] !== t) t = same[t];

        if (s !== t) {
          if (s < t) {
            same[t] = s;
          } else {
            same[s] = t;
          }
        }
      }
    }

    const color = new Uint8ClampedArray(w * 3);

    for (let x = 0; x < w; x++) {
      let s = x;
      while (same[s] !== s) s = same[s];

      if (color[s * 3] === 0 && color[s * 3 + 1] === 0 && color[s * 3 + 2] === 0 && s === x) {
        const tileX = x % patternWidth;
        color[s * 3] = tile[tileX * 3];
        color[s * 3 + 1] = tile[tileX * 3 + 1];
        color[s * 3 + 2] = tile[tileX * 3 + 2];
      }

      color[x * 3] = color[s * 3];
      color[x * 3 + 1] = color[s * 3 + 1];
      color[x * 3 + 2] = color[s * 3 + 2];
    }

    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      outData[o] = color[x * 3];
      outData[o + 1] = color[x * 3 + 1];
      outData[o + 2] = color[x * 3 + 2];
      outData[o + 3] = 255;
    }
  }

  ctx.putImageData(outImage, 0, 0);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function cryptoFill(buf) {
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
    return;
  }
  for (let i = 0; i < buf.length; i++) buf[i] = (Math.random() * 256) | 0;
}

export default App;
