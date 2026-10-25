const LEVELS = [
  { label: "Too short", color: "bg-red-500", text: "text-red-500" },
  { label: "Weak", color: "bg-red-500", text: "text-red-500" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-500" },
  { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", color: "bg-green-500", text: "text-green-600" },
];

export const scorePassword = (pw = "") => {
  if (pw.length < 5) return 0;
  let score = 1;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  else if (pw.length >= 12) score++;
  return Math.min(4, score);
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = scorePassword(password);
  const level = LEVELS[score];
  return (
    <div className="mt-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? level.color : "bg-accent-100 dark:bg-accent-900/50"}`} />
        ))}
      </div>
      <p className={`text-[11px] mt-1 font-medium ${level.text}`}>{level.label}</p>
    </div>
  );
};

export default PasswordStrength;
