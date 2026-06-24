import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecommendationFeedback from "../../src/components/RecommendationFeedback";

describe("RecommendationFeedback", () => {
  it("is keyboard accessible and reports the selected rating", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecommendationFeedback value={null} onChange={onChange} />);
    const fire = screen.getByRole("radio", { name: /Fire/i });
    fire.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("fire");
  });

  it("does not allow changes while disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RecommendationFeedback value="good" onChange={onChange} disabled />);
    await user.click(screen.getByRole("radio", { name: /Not It/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
