"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import {
  ArrowDownToLine,
  ChevronDown,
  Clapperboard,
  ImagePlus,
  LoaderCircle,
  Mic,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type GeneratedImage = {
  id: number;
  name: string;
  bg: string;
  emoji: string;
  label: string;
  url: string;
  creator: CreatorStyle | null;
};

type CreatorStyle = (typeof creatorStyles)[number];

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const localCompositions = [
  { id: 1, name: "Tropical Beach", bg: "linear-gradient(135deg, #00d2ff, #ffcc00)", emoji: "🏖️", label: "SUMMER VIBE" },
  { id: 2, name: "ICA Fridge", bg: "linear-gradient(135deg, #e0f2ff, #ffffff)", emoji: "🧊", label: "COLD & FRESH" },
  { id: 3, name: "Gym Energy", bg: "linear-gradient(135deg, #1a1a1a, #444444)", emoji: "💪", label: "POST-WORKOUT" },
  { id: 4, name: "Snow Sweden", bg: "linear-gradient(135deg, #ffffff, #aee9ff)", emoji: "❄️", label: "NORDIC ICE" },
  { id: 5, name: "Sunrise Kitchen", bg: "linear-gradient(135deg, #ff9a9e, #fecfef)", emoji: "☀️", label: "MORNING FRESH" },
  { id: 6, name: "Luxury Marble", bg: "linear-gradient(135deg, #f5f5f5, #d5d5d5)", emoji: "✨", label: "PREMIUM" },
  { id: 7, name: "Green Detox", bg: "linear-gradient(135deg, #a8ff78, #78ffd6)", emoji: "🌿", label: "100% NATURAL" },
  { id: 8, name: "Pink Aesthetic", bg: "linear-gradient(135deg, #ff6a88, #ff8e53)", emoji: "💖", label: "VIRAL GIRL" },
];
const creatorStyles = [
  { id: "product", name: "Product only", avatar: "🥤", tint: "#c8ff00" },
  { id: "fitness", name: "Fitness creator", avatar: "🏋️‍♀️", tint: "#e9ab8d" },
  { id: "nordic", name: "Nordic creator", avatar: "🧑‍🦰", tint: "#b5ddf2" },
  { id: "kitchen", name: "Kitchen creator", avatar: "👩‍🍳", tint: "#ffbd84" },
  { id: "lifestyle", name: "Lifestyle creator", avatar: "👩🏽", tint: "#f5a8bd" },
] as const;
const modelOptions = [
  "https://i.pravatar.cc/150?img=32",
  "https://i.pravatar.cc/150?img=26",
  "https://i.pravatar.cc/150?img=68",
];

export default function ProductStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [creatorId, setCreatorId] = useState("product");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [voiceScript, setVoiceScript] = useState("Fresh juice, made for your day.");
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isZipping, setIsZipping] = useState(false);
  const [zipError, setZipError] = useState("");
  const [script, setScript] = useState("This NORDIC JUICE is insane! 100 percent natural, no sugar, pure energy!");
  const [selectedModel, setSelectedModel] = useState("https://i.pravatar.cc/150?img=32");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [depth, setDepth] = useState(15);
  const [brandName, setBrandName] = useState("");
  const [brandFont, setBrandFont] = useState<"bold" | "luxury" | "minimal">("bold");
  const brandCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  useEffect(() => {
    const canvas = brandCanvasRef.current;
    if (!canvas || !productImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!brandName.trim()) return;
    const fontMap: Record<typeof brandFont, string> = {
      bold: "900 34px 'Arial Black', Arial, sans-serif",
      luxury: "italic 400 32px Georgia, 'Times New Roman', serif",
      minimal: "300 30px 'Helvetica Neue', Arial, sans-serif",
    };
    drawCurvedText(ctx, brandName.toUpperCase(), canvas.width / 2, canvas.height * 0.86, canvas.height * 0.7, fontMap[brandFont]);
  }, [brandName, brandFont, productImage]);

  async function loadImage(file?: File) {
    if (!file) return;
    setError("");
    setImages([]);

    if (!file.type.startsWith("image/")) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Please choose an image smaller than 8 MB.");
      return;
    }

    setFileName(file.name);
    setIsRemovingBg(true);
    try {
      const bgRemovalModuleUrl = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.mjs";
      const { removeBackground } = await (import(
        /* webpackIgnore: true */ bgRemovalModuleUrl
      ) as Promise<typeof import("@imgly/background-removal")>);
      const cutout = await removeBackground(file);
      setProductImage(await readAsDataUrl(cutout));
    } catch {
      setError("Background removal isn’t available right now, using your original photo.");
      setProductImage(await readAsDataUrl(file));
    } finally {
      setIsRemovingBg(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void loadImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    void loadImage(event.dataTransfer.files[0]);
  }

  function generate() {
    if (!productImage) return;
    setError("");
    setImages([]);
    try {
      const creator = creatorStyles.find((style) => style.id === creatorId) ?? creatorStyles[0];
      setImages(localCompositions.map((composition) => ({
        ...composition,
        creator: creator.id === "product" ? null : creator,
        url: createCompositionImage(productImage, composition, creator.id === "product" ? null : creator),
      })));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not create the local scene options.",
      );
    }
  }

  function previewVoice() {
    if (!("speechSynthesis" in window)) {
      setError("Voice preview is not supported by this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(voiceScript.trim() || "Fresh juice, made for your day.");
    const selectedVoice = voices.find((voice) => voice.voiceURI === selectedVoiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onstart = () => setIsVoiceSpeaking(true);
    utterance.onend = () => setIsVoiceSpeaking(false);
    utterance.onerror = () => setIsVoiceSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function stopVoice() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsVoiceSpeaking(false);
  }

  function previewModelVoice() {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "en-US";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function resetImage() {
    setProductImage(null);
    setFileName("");
    setImages([]);
    setError("");
  }

  async function downloadAllVideos() {
    if (!images.length) return;
    setIsZipping(true);
    setZipError("");
    try {
      const zip = new JSZip();
      for (const image of images) {
        const { blob, extension } = await recordKenBurns(image.url);
        const safeName = image.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        zip.file(`juice-scene-${image.id}-${safeName}.${extension}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "nordic-juice-tiktok-scenes.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setZipError(downloadError instanceof Error ? downloadError.message : "Could not export all videos.");
    } finally {
      setIsZipping(false);
    }
  }

  return (
    <main className="studio-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Juice TikTok Studio home">
          <span className="brand-mark"><Clapperboard size={17} strokeWidth={2.4} /></span>
          <span>juice<span className="brand-light"> tiktok studio</span></span>
        </a>
        <div className="topbar-right">
          <span className="free-pill"><span /> FREE FOREVER</span>
          <button className="avatar-button" type="button" aria-label="Studio menu">
            JS <ChevronDown size={13} />
          </button>
        </div>
      </header>

      <section className="workspace" id="top">
        <div className="heading-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> CREATIVE STUDIO <span className="eyebrow-index">/ 01</span></div>
            <h1>One photo.<br /><span>Eight fresh scenes.</span></h1>
            <p className="intro-copy">Upload once. See your product in eight free local styles.</p>
          </div>
          <div className="sequence-badge"><span className="sequence-dot" /> 8 FREE LOCAL STYLES</div>
        </div>

        <div className="studio-grid">
          <section className="control-panel" aria-label="Video generation settings">
            <div className="panel-head">
              <div><span className="panel-kicker">NEW PROJECT</span><h2>Choose your scenes</h2></div>
              <span className="step-count">01 — 05</span>
            </div>

            <div className="form-step">
              <StepLabel number="01" title="Product image" />
              {productImage ? (
                <div className="upload-filled">
                  <div className="upload-thumb"><img src={productImage} alt="Uploaded product, background removed" /></div>
                  <div className="upload-meta"><strong>{fileName || "Edited product image"}</strong><span>Background removed · ready for your scene</span></div>
                  <button className="remove-image" type="button" onClick={resetImage} aria-label="Remove product image"><X size={15} /></button>
                </div>
              ) : isRemovingBg ? (
                <div className="upload-filled upload-processing">
                  <div className="upload-thumb upload-thumb-loading"><LoaderCircle className="spin" size={20} /></div>
                  <div className="upload-meta"><strong>{fileName}</strong><span>Removing background…</span></div>
                </div>
              ) : (
                <button
                  className={`upload-drop ${isDragging ? "is-dragging" : ""}`}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <span className="upload-icon"><ImagePlus size={20} /></span>
                  <span className="upload-title">Drop your product shot here</span>
                  <span className="upload-subtitle">or browse files <span>· PNG, JPG, WebP up to 8 MB</span></span>
                </button>
              )}
              <input ref={inputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
            </div>

            <div className="form-step">
              <StepLabel number="02" title="Brand & 3D bottle" />
              <label className="field-wrap field-wrap-single">
                <input type="text" placeholder="Brand name" value={brandName} onChange={(event) => setBrandName(event.target.value)} maxLength={22} aria-label="Brand name" />
              </label>
              <div className="font-select-row">
                {((["bold", "luxury", "minimal"] as const)).map((font) => (
                  <button key={font} type="button" className={`font-chip ${brandFont === font ? "active" : ""}`} onClick={() => setBrandFont(font)}>{font}</button>
                ))}
              </div>
              <label className="depth-slider-wrap">
                <span>3D Depth <strong>{depth}°</strong></span>
                <input type="range" min={0} max={30} value={depth} onChange={(event) => setDepth(Number(event.target.value))} aria-label="3D bottle depth" />
              </label>
              <p className="local-note">Tilts your bottle in 3D and curves your brand name across the label.</p>
            </div>

            <div className="form-step">
              <StepLabel number="03" title="Create eight options" />
              <p className="local-note">Eight colorful scenes, made right here on your device.</p>
            </div>

            <div className="form-step">
              <StepLabel number="04" title="Creator style" />
              <label className="field-wrap field-wrap-single">
                <select value={creatorId} onChange={(event) => setCreatorId(event.target.value)} aria-label="Creator style">
                  {creatorStyles.map((style) => <option key={style.id} value={style.id}>{style.avatar} {style.name}</option>)}
                </select>
              </label>
              <p className="local-note">Creator styles are local illustrations, not AI-generated people.</p>
            </div>

            <div className="form-step">
              <StepLabel number="05" title="Voice preview" />
              <label className="field-wrap field-wrap-single">
                <select value={selectedVoiceURI} onChange={(event) => setSelectedVoiceURI(event.target.value)} aria-label="System voice">
                  <option value="">System default voice</option>
                  {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}
                </select>
              </label>
              <label className="field-wrap voice-script-wrap">
                <textarea value={voiceScript} onChange={(event) => setVoiceScript(event.target.value)} aria-label="Voiceover script" maxLength={180} rows={2} />
                <span className="field-count">{voiceScript.length}/180</span>
              </label>
              <div className="voice-actions">
                <button className="voice-button" type="button" onClick={previewVoice} disabled={isVoiceSpeaking}><Mic size={14} /> Preview voice</button>
                {isVoiceSpeaking && <button className="voice-stop-button" type="button" onClick={stopVoice}>Stop</button>}
              </div>
              <p className="local-note">Uses your browser’s built-in voice at no cost. Video exports are silent.</p>
            </div>

            {error && <div className="feedback error-feedback" role="alert">{error}</div>}

            <button className="generate-button" type="button" onClick={generate} disabled={!productImage}>
              <Sparkles size={17} fill="currentColor" />
              <span>Create 8 options</span>
              <span className="generate-arrow">↗</span>
            </button>
            <div className="privacy-note"><span className="privacy-dot" /> Your image never leaves this device.</div>
          </section>

          <section className="preview-panel" aria-label="Generated image preview">
            <div className="preview-topline">
              <div><span className="panel-kicker">LIVE PREVIEW</span><h2>{images.length ? "Your eight scenes" : "The shot list"}</h2></div>
              <div className="preview-tools"><span className="aspect-label">9:16</span><span className="preview-divider" /><span className="preview-state"><span className="state-dot" />{images.length ? "READY" : "WAITING"}</span></div>
            </div>
            {images.length === 0 && <div className="phone-stage">
              <div className="phone-notch" />
              {images.length === 0 && (
                <div className={`empty-preview ${productImage ? "has-product" : ""}`}>
                  {productImage ? (
                    <>
                      <div className="sample-glow" />
                      <img
                        className="sample-product"
                        src={productImage}
                        alt="Product preview before generation"
                        style={{
                          transform: `perspective(1000px) rotateY(-${depth}deg) rotateX(5deg)`,
                          filter: `drop-shadow(${Math.round(depth * 0.6)}px ${Math.round(depth * 1.4)}px ${Math.round(10 + depth)}px rgba(0,0,0,.45))`,
                        }}
                      />
                      <div className="sample-highlight" style={{ opacity: 0.22 + depth / 90 }} />
                      <canvas ref={brandCanvasRef} className="brand-canvas" width={320} height={200} aria-hidden="true" />
                      <div className="sample-label"><span>PREVIEW</span><strong>Your product, in focus.</strong><small>Your scene will appear here</small></div>
                    </>
                  ) : (
                    <div className="empty-content"><span className="empty-icon"><Upload size={20} /></span><span className="empty-kicker">YOUR CANVAS</span><strong>A little juice goes<br />a long way.</strong><small>Add a product shot<br />to start creating.</small></div>
                  )}
                  <div className="preview-watermark">JUICE STUDIO <span>·</span> 9:16</div>
                </div>
              )}
              <div className="phone-home" />
            </div>}
            {images.length > 0 && (
              <>
                <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#11130f" }}>Step 2: Voice + Model</h3>
                  <textarea
                    value={script}
                    onChange={(event) => setScript(event.target.value)}
                    style={{ width: "100%", height: 80, borderRadius: 8, border: "1px solid #ddd", padding: 8, fontFamily: "inherit", resize: "vertical", color: "#11130f" }}
                  />
                  <p style={{ margin: "14px 0 8px", fontSize: 13, fontWeight: 600, color: "#11130f" }}>Choose AI Model:</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {modelOptions.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="AI model option"
                        onClick={() => setSelectedModel(url)}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          objectFit: "cover",
                          cursor: "pointer",
                          border: selectedModel === url ? "3px solid #22c55e" : "3px solid transparent",
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={previewModelVoice}
                    style={{ marginTop: 16, padding: "10px 18px", borderRadius: 8, border: "none", background: "#11130f", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    🔊 Preview Voice + Model
                  </button>
                  {isSpeaking && (
                    <div style={{ marginTop: 16 }}>
                      <img
                        src={selectedModel}
                        alt="Speaking model preview"
                        className="model-pulse"
                        style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "4px solid #c8ff00" }}
                      />
                    </div>
                  )}
                </div>
                <div className="composition-grid">
                  {images.map((image, index) => <ResultTile key={image.id} image={image} index={index} selectedModel={selectedModel} onDelete={() => setImages((current) => current.filter((item) => item.id !== image.id))} />)}
                </div>
                <button className="download-all-button" type="button" onClick={() => void downloadAllVideos()} disabled={isZipping}>
                  {isZipping ? <LoaderCircle className="spin" size={16} /> : <ArrowDownToLine size={16} />}
                  <span>{isZipping ? "Packing 8 videos\u2026" : "Download All (ZIP)"}</span>
                </button>
                {zipError && <div className="feedback error-feedback" role="alert">{zipError}</div>}
              </>
            )}
            <div className="preview-footer"><span><span className="footer-spark">✳</span> MADE TO MOVE</span><span>8 LOCAL SCENES <i /> WEBM EXPORT</span></div>
          </section>
        </div>
        <footer className="page-footer"><span>JUICE TIKTOK STUDIO</span><span>FREE BY DESIGN <i /> BUILT FOR THE FEED</span></footer>
      </section>
    </main>
  );
}

function StepLabel({ number, title }: { number: string; title: string }) {
  return <div className="step-label"><span>{number}</span><strong>{title}</strong></div>;
}

function createCompositionImage(
  productImage: string,
  composition: Omit<GeneratedImage, "url" | "creator">,
  creator: CreatorStyle | null,
) {
  const colors = composition.bg.match(/#[\da-f]{6}/gi) || ["#c8ff00", "#202220"];
  const safeImage = productImage.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const safeEmoji = escapeXml(composition.emoji);
  const safeLabel = escapeXml(composition.label);
  const creatorOverlay = creator ? `<circle cx="235" cy="890" r="145" fill="${creator.tint}" opacity=".7"/><text x="235" y="950" text-anchor="middle" font-size="190">${escapeXml(creator.avatar)}</text><text x="235" y="1085" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#11130f">${escapeXml(creator.name.toUpperCase())}</text>` : "";
  const productX = creator ? 350 : 150;
  const productWidth = creator ? 600 : 780;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="scene" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><filter id="shadow" x="-50%" y="-30%" width="200%" height="180%"><feGaussianBlur stdDeviation="28"/></filter></defs><rect width="1080" height="1920" fill="url(#scene)"/><ellipse cx="540" cy="1470" rx="280" ry="62" fill="#10130e" opacity=".24" filter="url(#shadow)"/>${creatorOverlay}<image href="${safeImage}" x="${productX}" y="260" width="${productWidth}" height="1180" preserveAspectRatio="xMidYMid meet"/><text x="540" y="1570" text-anchor="middle" font-size="112">${safeEmoji}</text><text x="540" y="1700" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="8" fill="#11130f">${safeLabel}</text><text x="540" y="1780" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" letter-spacing="5" fill="#11130f" opacity=".66">${escapeXml(composition.name.toUpperCase())}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  font: string,
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(10,12,9,.55)";
  ctx.lineWidth = 3;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(centerX, centerY);
  ctx.rotate(-Math.PI / 2);
  const chars = text.split("");
  const angles = chars.map((char) => ctx.measureText(char).width / radius);
  const total = angles.reduce((sum, value) => sum + value, 0);
  ctx.rotate(-total / 2);
  chars.forEach((char, index) => {
    const half = angles[index] / 2;
    ctx.rotate(half);
    ctx.save();
    ctx.rotate(Math.PI / 2);
    ctx.strokeText(char, 0, -radius);
    ctx.fillText(char, 0, -radius);
    ctx.restore();
    ctx.rotate(half);
  });
  ctx.restore();
}

function ResultTile({ image, index, selectedModel, onDelete }: { image: GeneratedImage; index: number; selectedModel: string; onDelete: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [videoDownload, setVideoDownload] = useState<{ url: string; extension: string } | null>(null);

  useEffect(() => () => {
    if (videoDownload) URL.revokeObjectURL(videoDownload.url);
  }, [videoDownload]);

  async function downloadMp4() {
    setDownloading(true);
    setDownloadError("");
    try {
      const { blob, extension } = await recordKenBurns(image.url);
      setVideoDownload({ url: URL.createObjectURL(blob), extension });
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Video export failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article className={`result-tile result-tile-${index}`}>
      <img className="result-image" src={image.url} alt={`${image.name} product scene`} />
      <img
        className="tile-model-avatar"
        src={selectedModel}
        alt="Selected AI model"
        style={{ position: "absolute", top: 10, left: 10, width: 50, height: 50, borderRadius: "50%", border: "2px solid #fff", objectFit: "cover", zIndex: 2 }}
      />
      <div className="tile-shade" />
      <div className="tile-top"><span>0{index + 1} · {image.name.toUpperCase()}</span><span className="tile-source">LOCAL</span></div>
      <div className="tile-actions">
        <a className="tile-download" href={image.url} download={`juice-take-${index + 1}.${getImageExtension(image.url)}`} aria-label={`Download image ${index + 1}`} title="Download image"><ArrowDownToLine size={15} /></a>
        {videoDownload ? (
          <a className="tile-download" href={videoDownload.url} download={`juice-take-${index + 1}.${videoDownload.extension}`} aria-label={`Download 3 second video for image ${index + 1}`} title="Download Video (3s, 1080x1920, WebM)"><ArrowDownToLine size={15} /></a>
        ) : (
          <button className="tile-download" type="button" onClick={() => void downloadMp4()} disabled={downloading} aria-label={`Create 3 second video for image ${index + 1}`} title="Download Video (3s, 1080x1920, WebM)"><Clapperboard size={15} />{downloading && <LoaderCircle className="spin download-spin" size={12} />}</button>
        )}
        <button className="tile-download tile-delete" type="button" onClick={onDelete} aria-label={`Delete ${image.name} scene and video`} title="Delete scene and exported video"><Trash2 size={14} /></button>
      </div>
      {downloadError && <span className="tile-error" role="alert">{downloadError}</span>}
      <div className="tile-caption">0{index + 1}<span /> PRODUCT FILM</div>
    </article>
  );
}

function getImageExtension(imageUrl: string) {
  const mimeType = imageUrl.match(/^data:image\/([^;,]+)/)?.[1];
  if (mimeType === "svg+xml") return "svg";
  if (mimeType === "jpeg") return "jpg";
  return mimeType || "png";
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image."));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

function recordKenBurns(
  imageUrl: string,
  { width = 1080, height = 1920, durationMs = 3000 }: { width?: number; height?: number; durationMs?: number } = {},
): Promise<{ blob: Blob; extension: string }> {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined") {
      reject(new Error("Video recording is not supported in this browser."));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Canvas is not available in this browser."));
      return;
    }
    const drawingContext = context;
    const image = new Image();
    image.onload = () => {
      const stream = canvas.captureStream(30);
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        reject(new Error("This browser does not support WebM video recording."));
        return;
      }
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      const startedAt = performance.now();
      const frameTimer = window.setInterval(() => {
        const progress = Math.min((performance.now() - startedAt) / durationMs, 1);
        const scale = 1 + progress * 0.12;
        const imageRatio = image.width / image.height;
        const canvasRatio = canvas.width / canvas.height;
        const baseWidth = imageRatio > canvasRatio ? canvas.height * imageRatio : canvas.width;
        const baseHeight = imageRatio > canvasRatio ? canvas.height : canvas.width / imageRatio;
        const drawWidth = baseWidth * scale;
        const drawHeight = baseHeight * scale;
        drawingContext.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
        if (progress >= 1) {
          window.clearInterval(frameTimer);
          recorder.stop();
        }
      }, 1000 / 30);
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onerror = () => {
        window.clearInterval(frameTimer);
        stream.getTracks().forEach((track) => track.stop());
        reject(new Error("Video recording failed."));
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        window.clearInterval(frameTimer);
        stream.getTracks().forEach((track) => track.stop());
        resolve({ blob, extension: "webm" });
      };
      recorder.start();
    };
    image.onerror = () => reject(new Error("Could not load this image for video export."));
    image.src = imageUrl;
  });
}