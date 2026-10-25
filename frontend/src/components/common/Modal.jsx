import { useEffect } from "react";

const Modal = ({ onClose, children, width = "max-w-md", labelledBy }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-[#070e2b]/50 backdrop-blur-[3px] animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`card shadow-2xl w-full ${width} animate-slide-up-sheet sm:animate-slide-up max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col rounded-t-3xl rounded-b-none sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-accent-200 dark:bg-accent-800" />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
