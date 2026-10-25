import { useRef } from "react";
import QRCode from "react-qr-code";
import { X, Download, Copy } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { getShortUrl } from "../../utils/urlFormat";
import { copyText, downloadBlob } from "../../utils/format";

const QRModal = ({ url, onClose }) => {
  const wrapRef = useRef(null);
  const shortUrl = getShortUrl(url.shortCode);

  const getSvgString = () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  };

  const downloadSvg = () => {
    const data = getSvgString();
    if (!data) return;
    downloadBlob(new Blob([data], { type: "image/svg+xml" }), `qr-${url.shortCode}.svg`);
  };

  const downloadPng = () => {
    const data = getSvgString();
    if (!data) return;
    const size = 1024;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      const pad = 64;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      canvas.toBlob((blob) => blob && downloadBlob(blob, `qr-${url.shortCode}.png`), "image/png");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const copy = async () => {
    (await copyText(shortUrl)) ? toast.success("Link copied!") : toast.error("Couldn't copy");
  };

  return (
    <Modal onClose={onClose} width="max-w-xs" labelledBy="qr-title">
      <div className="p-5 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h3 id="qr-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">QR code</h3>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div ref={wrapRef} className="bg-white p-4 rounded-2xl border border-accent-100 shadow-sm">
          <QRCode value={shortUrl} size={192} level="M" fgColor="#0d1f7c" bgColor="#ffffff" />
        </div>

        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 text-center break-all px-2">{shortUrl}</p>

        <div className="grid grid-cols-2 gap-2 w-full">
          <button onClick={downloadPng} className="btn-primary btn text-sm"><Download className="w-4 h-4" />PNG</button>
          <button onClick={downloadSvg} className="btn-secondary btn text-sm"><Download className="w-4 h-4" />SVG</button>
        </div>
        <button onClick={copy} className="btn-ghost btn btn-sm w-full"><Copy className="w-3.5 h-3.5" />Copy link</button>
      </div>
    </Modal>
  );
};

export default QRModal;
