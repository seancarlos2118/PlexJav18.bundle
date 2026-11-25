require('dotenv').config();
const express = require('express');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3133;
const API_KEY = process.env.API_KEY || '';

// Latest Chrome default headers
const DEFAULT_CHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site'
};

// Optional API Key Middleware
app.use((req, res, next) => {
  if (!API_KEY) return next();
  const providedKey = req.headers['x-api-key'] || req.query.api_key || req.query.apikey;
  if (providedKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key.' });
  }
  next();
});

app.get('/crop', async (req, res) => {
  try {
    const {
      url,
      ratiowidth = '566',
      ratioheight = '800',
      anchor = 'right',
      format = 'jpg',
      quality = '80',
      headers: customHeadersParam
    } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing required "url" query parameter.' });
    }

    const rW = parseFloat(ratiowidth);
    const rH = parseFloat(ratioheight);
    const qual = Math.min(100, Math.max(1, parseInt(quality, 10) || 80));

    if (isNaN(rW) || isNaN(rH) || rW <= 0 || rH <= 0) {
      return res.status(400).json({ error: 'Invalid ratiowidth or ratioheight.' });
    }

    // Merge default Chrome headers with optional custom JSON headers
    let fetchHeaders = { ...DEFAULT_CHROME_HEADERS };
    if (customHeadersParam) {
      try {
        const parsed = JSON.parse(customHeadersParam);
        fetchHeaders = { ...fetchHeaders, ...parsed };
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in "headers" parameter.' });
      }
    }

    // Fetch image
    const response = await fetch(url, { headers: fetchHeaders });
    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch remote image: HTTP ${response.status}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Initialize Sharp (animated: true supports multi-frame GIF/WebP)
    const image = sharp(inputBuffer, { animated: true });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(422).json({ error: 'Unable to read image dimensions.' });
    }

    const imgW = metadata.width;
    // For animated images, Sharp reports total stacked height across pages unless pageHeight is present
    const imgH = metadata.pageHeight || metadata.height;

    // Calculate largest possible crop box matching target aspect ratio
    const targetRatio = rW / rH;
    const currentRatio = imgW / imgH;

    let cropW, cropH;
    if (currentRatio > targetRatio) {
      // Image is wider than target: full height, crop width
      cropH = imgH;
      cropW = Math.round(imgH * targetRatio);
    } else {
      // Image is taller than target (or equal): full width, crop height
      cropW = imgW;
      cropH = Math.round(imgW / targetRatio);
    }

    // Clamp to source bounds
    cropW = Math.min(cropW, imgW);
    cropH = Math.min(cropH, imgH);

    // Anchor logic
    const normalizedAnchor = anchor.toLowerCase().trim();
    let left = 0;
    let top = 0;

    switch (normalizedAnchor) {
      case 'left':
        left = 0;
        top = Math.floor((imgH - cropH) / 2);
        break;
      case 'top':
        left = Math.floor((imgW - cropW) / 2);
        top = 0;
        break;
      case 'bottom':
        left = Math.floor((imgW - cropW) / 2);
        top = imgH - cropH;
        break;
      case 'right':
      default:
        left = imgW - cropW;
        top = Math.floor((imgH - cropH) / 2);
        break;
    }

    let pipeline = image.extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: cropW,
      height: cropH
    });

    // Output format & quality/compression controls
    const fmt = format.toLowerCase().trim();
    let contentType = 'image/jpeg';

    switch (fmt) {
      case 'png':
        // Map 1-100 quality to PNG compressionLevel 9-0
        const compressionLevel = Math.round(9 - ((qual / 100) * 9));
        pipeline = pipeline.png({ compressionLevel, quality: qual });
        contentType = 'image/png';
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: qual });
        contentType = 'image/webp';
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: qual });
        contentType = 'image/avif';
        break;
      case 'tiff':
      case 'tif':
        pipeline = pipeline.tiff({ quality: qual });
        contentType = 'image/tiff';
        break;
      case 'gif':
        pipeline = pipeline.gif();
        contentType = 'image/gif';
        break;
      case 'jpg':
      case 'jpeg':
      default:
        pipeline = pipeline.jpeg({ quality: qual, mozjpeg: true });
        contentType = 'image/jpeg';
        break;
    }

    const outputBuffer = await pipeline.toBuffer();

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(outputBuffer);

  } catch (err) {
    console.error('Crop error:', err);
    res.status(500).json({ error: 'Internal image processing error.', details: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Image Crop API', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Image Crop API running on http://localhost:${PORT}`);
});
