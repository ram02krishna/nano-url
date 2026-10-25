import { Link, useParams } from "react-router-dom";
import { Clock, EyeOff, Gauge, SearchX } from "lucide-react";

const CONTENT = {
  expired: {
    icon: Clock,
    title: "This link has expired",
    text: "The owner set this link to stop working after a certain date. Ask them for a fresh one.",
  },
  disabled: {
    icon: EyeOff,
    title: "This link is turned off",
    text: "The owner has temporarily disabled this link. Please check back later or contact them.",
  },
  "limit-reached": {
    icon: Gauge,
    title: "This link has reached its limit",
    text: "It has been opened the maximum number of times its owner allowed.",
  },
  "not-found": {
    icon: SearchX,
    title: "Short link not found",
    text: "We couldn't find a link with that address. It may have been deleted or mistyped.",
  },
};

const LinkStatus = () => {
  const { reason } = useParams();
  const info = CONTENT[reason] ?? CONTENT["not-found"];
  const Icon = info.icon;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="text-center space-y-5 animate-slide-up max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center mx-auto">
          <Icon className="w-7 h-7 text-accent-600 dark:text-accent-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{info.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{info.text}</p>
        </div>
        <Link to="/" className="btn-primary btn text-sm">Shorten your own links</Link>
      </div>
    </div>
  );
};

export default LinkStatus;
