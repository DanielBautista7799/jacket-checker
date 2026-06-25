import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Link } from "react-router-dom";

import Button from "../../src/components/ui/Button";

describe("Button", () => {
  test("supports one slotted link child", () => {
    render(
      <MemoryRouter>
        <Button asChild>
          <Link to="/auth">Request another reset email</Link>
        </Button>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", {
      name: "Request another reset email",
    });

    expect(link).toHaveAttribute("href", "/auth");
    expect(link).toHaveClass("storm-primary-action");
  });

  test("disables a native button while loading", () => {
    render(<Button loading loadingLabel="Saving">Save</Button>);

    const button = screen.getByRole("button", { name: /saving save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
