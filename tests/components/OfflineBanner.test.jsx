import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import OfflineBanner from "../../src/components/OfflineBanner";
import { NetworkStatusContext } from "../../src/context/NetworkStatusContext";

describe("OfflineBanner", () => {
  it("announces offline state", () => {
    render(
      <NetworkStatusContext.Provider value={{ online: false, offline: true }}>
        <OfflineBanner />
      </NetworkStatusContext.Provider>
    );
    expect(screen.getByRole("status")).toHaveTextContent(/offline/i);
  });
});
