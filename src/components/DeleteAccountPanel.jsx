import { useState } from "react";
import { Trash2 } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import DeleteAccountConfirmDialog from "./DeleteAccountConfirmDialog";
import useAccountDeletion from "../hooks/useAccountDeletion";

export default function DeleteAccountPanel() {
  const [open, setOpen] = useState(false);
  const { deleteAccount, deleting, deleteError, clearDeleteError } = useAccountDeletion();

  const handleConfirm = async (confirmation) => {
    const success = await deleteAccount(confirmation);
    if (success) window.location.assign("/");
  };

  return (
    <Card className="mt-8 border-rose-400/20 bg-rose-950/15 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-300">Danger zone</p>
          <h2 className="mt-2 text-xl font-black text-white">Delete account and all data</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Permanently removes your account, jackets, private images, recommendations, learning, trend feedback, visual intelligence, and analytics.
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={() => { clearDeleteError(); setOpen(true); }}
        >
          <Trash2 size={16} aria-hidden="true" /> Delete account
        </Button>
      </div>
      {open && (
        <DeleteAccountConfirmDialog
          open
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
          deleting={deleting}
          error={deleteError}
        />
      )}
    </Card>
  );
}
