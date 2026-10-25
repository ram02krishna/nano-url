import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../common/Modal";

const DeleteModal = ({ url, onConfirm, onCancel }) => {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onCancel} width="max-w-sm" labelledBy="delete-title">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 id="delete-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Delete this link?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="font-mono text-zinc-700 dark:text-zinc-200 break-all">/{url.shortCode}</span> and all of its click
              analytics will be permanently removed. This can't be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={busy} className="btn-secondary btn btn-sm">Cancel</button>
          <button onClick={confirm} disabled={busy} className="btn-danger btn btn-sm">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
