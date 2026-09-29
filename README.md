# Juice TikTok Studio

A free, local product-scene generator built with Next.js 14, TypeScript, Tailwind CSS, and browser APIs.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload a product image to create eight local scene options. Images are composed in the browser and never sent to a generation API; no token or account is needed.

## Features

- Drag-and-drop product uploads with 8 MB validation.
- Eight built-in scenes, composed locally from the uploaded image, a gradient, and a scene label.
- Five creator-style illustrations that can be composed beside the product without a model download or API call.
- Browser-native voice preview with selectable installed system voices and an editable script.
- Animated 9:16 previews, SVG downloads, and five-second canvas recordings. Browsers without MP4 MediaRecorder support receive WebM exports.
- Per-scene deletion removes its image from the session and revokes its temporary video URL.

## Local processing

Scene generation, preview, voice preview, and image export run locally in the browser. Creator styles are illustrated avatars, not generated human photography. System speech is preview-only; canvas video exports are silent because browser speech synthesis does not expose an audio stream to `MediaRecorder`. Video containers depend on browser support.
