import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../../src/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("runs confirm and cancel actions", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Delete jacket?" description="This cannot be undone." danger />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
