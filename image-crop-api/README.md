# Image Crop API

A lightweight, localhost-hosted Node.js API built with **Express** and **Sharp** that fetches remote images and crops them to the largest possible area matching your target aspect ratio and edge anchor.

## Quick Setup (1-Click)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/seancarlos2118/PlexJav18.bundle && cd image-crop-api
   ```
2. Run the installer for your OS:
   - **Windows:** Double-click `install-windows.bat`
   - **macOS / Linux:** Run `./install-unix.sh`

Both scripts let you choose between **Docker** (builds locally with auto-restart) or **Native Node.js + PM2** (auto-starts on system boot).

---

## API Usage

**Endpoint:** `GET http://localhost:3133/crop`

### Query Parameters

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `url` | *(Required)* | Direct URL of the image to fetch and crop. |
| `ratiowidth` | `565` | Target aspect ratio width. |
| `ratioheight` | `800` | Target aspect ratio height. |
| `anchor` | `right` | Edge to anchor crop: `right`, `left`, `top`, or `bottom`. |
| `format` | `jpg` | Output format: `jpg`, `png`, `webp`, `avif`, `tiff`, `gif`. |
| `quality` | `80` | Output quality/compression (`1` to `100`). |
| `headers` | *Chrome 131* | Optional URL-encoded JSON string of custom HTTP headers. |
| `api_key` | *(None)* | Required only if `API_KEY` is set in `.env` (can also pass via `x-api-key` header). |

### Examples

**Default crop (565:800 ratio, anchored right, JPG quality 80):**
```text
http://localhost:3133/crop?url=https://example.com
```

**16:9 crop anchored to top, output as WebP at quality 90:**
```text
http://localhost:3133/crop?url=https://example.com
```

**Passing custom Referer header:**
```text
http://localhost:3133/crop?url=https://example.com
```

## Optional API Key Protection

Edit `.env` in the project folder and set a secret value:
```env
PORT=3133
API_KEY=your-secret-key
```
Restart the service (`docker compose up -d --build` or `pm2 restart image-crop-api`).
