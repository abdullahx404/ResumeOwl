import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrivacyNotice } from "./PrivacyNotice";

describe("PrivacyNotice", () => {
  it("communicates no-login and no-database behavior", () => {
    render(<PrivacyNotice />);

    expect(screen.getByText(/No login/i)).toBeInTheDocument();
    expect(screen.getByText(/no database/i)).toBeInTheDocument();
    expect(screen.getByText(/browser session/i)).toBeInTheDocument();
  });
});
