import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  destructive = false,
  loading = false,
  confirmDisabled = false,
  children,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {children && <div className="mb-5">{children}</div>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={danger || destructive ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
