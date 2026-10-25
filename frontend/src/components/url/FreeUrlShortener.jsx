import { useState } from "react";
import toast from "react-hot-toast";
import QRCode from "react-qr-code";
import { Copy, ExternalLink, Loader2, ArrowRight, ClipboardPaste, Check, QrCode, Link2 } from "lucide-react";
import { createShortUrlFree } from "../../services/url.service";
import {
  getOrCreateDeviceId, incrementFreeUses, getRemainingFreeUses, markFreeUsesExhausted, FREE_LIMIT,
} from "../../utils/device";
import { useNavigate } from "react-router-dom";
import { getShortUrl, normalizeUrl } from "../../utils/urlFormat";
import { copyText, errorMessage } from "../../utils/format";

const FreeUrlShortener = () => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [remainingUses, setRemainingUses] = useState(getRemainingFreeUses);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const { url, error } = normalizeUrl(originalUrl);
    if (error) { toast.error(error); return; }
    if (remainingUses <= 0) { navigate("/register"); return; }

    setLoading(true);
    try {
      const res = await createShortUrlFree({ url, deviceId: getOrCreateDeviceId() });
      incrementFreeUses();
      setRemainingUses(getRemainingFreeUses());
      setShortUrl(getShortUrl(res.data.shortCode));
      setCopied(false);
      toast.success("Your short link is ready!");
    } catch (err) {
      if (err?.response?.data?.limitReached) {
        markFreeUsesExhausted();
        setRemainingUses(0);
      }
      toast.error(errorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (await copyText(shortUrl)) {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Couldn't copy — select the link and copy manually");
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setOriginalUrl(text.trim());
    } catch {
      toast.error("Couldn't read the clipboard — paste manually instead");
    }
  };

  const reset = () => { setOriginalUrl(""); setShortUrl(""); setShowQr(false); };

  return (
    <div className="w-full">
      {shortUrl ? (
        <div className="animate-slide-up space-y-3">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" /> Your shortened link
          </p>
          <div className="flex items-center gap-2 p-3 bg-accent-50/70 dark:bg-accent-900/30 border border-accent-100 dark:border-accent-800 rounded-xl">
            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-sm sm:text-base font-mono font-semibold text-accent-600 dark:text-accent-400 truncate hover:underline"
            >
              {shortUrl.replace(/^https?:\/\//, "")}
            </a>
            <a href={shortUrl} target="_blank" rel="noreferrer" className="btn-icon btn-ghost shrink-0" title="Open link" aria-label="Open link">
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={copy} className="btn-primary btn btn-sm shrink-0 min-w-[5.5rem]">
              {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
          </div>

          {showQr && (
            <div className="flex justify-center animate-fade-in">
              <div className="bg-white p-3 rounded-xl border border-accent-100">
                <QRCode value={shortUrl} size={140} fgColor="#0d1f7c" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowQr((v) => !v)} className="btn-secondary btn text-sm">
              <QrCode className="w-4 h-4" /> {showQr ? "Hide QR" : "Show QR"}
            </button>
            <button onClick={reset} className="btn-secondary btn text-sm">Shorten another</button>
          </div>

          <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
            Want click analytics, custom aliases & password protection?{" "}
            <button onClick={() => navigate("/register")} className="text-accent-600 hover:underline font-medium">Create a free account</button>
          </p>
        </div>
      ) : remainingUses <= 0 ? (
        <div className="animate-slide-up text-center py-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            You've used all {FREE_LIMIT} free shortens.
          </p>
          <button onClick={() => navigate("/register")} className="btn-primary btn w-full text-sm">
            Create a free account to continue
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-zinc-400">Unlimited links, analytics, QR codes and more.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="animate-fade-in space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400 pointer-events-none" />
              <input
                type="text"
                inputMode="url"
                autoComplete="off"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                className="input text-sm pl-9 pr-10 py-3"
                disabled={loading}
                aria-label="Long URL"
              />
              <button type="button" onClick={paste} title="Paste from clipboard" aria-label="Paste from clipboard" className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-icon btn-ghost !p-1.5">
                <ClipboardPaste className="w-4 h-4" />
              </button>
            </div>
            <button type="submit" disabled={loading || !originalUrl.trim()} className="btn-primary btn text-sm whitespace-nowrap shrink-0 px-6 py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Shorten <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {remainingUses} of {FREE_LIMIT} free uses remaining · No account needed
          </p>
        </form>
      )}
    </div>
  );
};

export default FreeUrlShortener;
