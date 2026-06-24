import { useState } from "react";
import ConfirmDialog from "./ui/ConfirmDialog";
import Input from "./ui/Input";
import Alert from "./ui/Alert";

export const DELETE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

export default function DeleteAccountConfirmDialog({ open, onClose, onConfirm, deleting, error }) {
  const [confirmation, setConfirmation] = useState("");
  const matches = confirmation.trim() === DELETE_CONFIRMATION_PHRASE;

  return (
    <ConfirmDialog
      open={open}
      onClose={deleting ? undefined : onClose}
      title="Permanently delete account?"
      description="This removes your jackets, private images, recommendation history, feedback, embeddings, trend feedback, analytics, profile, and sign-in account. This cannot be undone."
      confirmLabel={deleting ? "Deleting…" : "Delete account permanently"}
      confirmDisabled={!matches || deleting}
      onConfirm={() => matches && onConfirm(confirmation)}
      destructive
      loading={deleting}
    >
      <div className="space-y-3">
        <label htmlFor="delete-account-confirmation" className="block text-sm font-semibold text-slate-200">
          Type <span className="font-black text-rose-300">{DELETE_CONFIRMATION_PHRASE}</span> to continue
        </label>
        <Input
          id="delete-account-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </ConfirmDialog>
  );
}
