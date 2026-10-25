import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const ExpiryBadge = ({ expiresAt }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - now;
  if (diffMs <= 0) return <span className="badge-red">Expired</span>;

  const d = Math.floor(diffMs / 86400000);
  const h = Math.floor((diffMs % 86400000) / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const label = d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${Math.max(1, m)}m left`;
  const urgent = diffMs < 3600000;

  return (
    <span className={urgent ? "badge-amber" : "badge-green"} title={`Expires ${new Date(expiresAt).toLocaleString()}`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
};

export default ExpiryBadge;
