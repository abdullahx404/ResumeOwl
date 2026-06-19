import { describe, expect, it } from "vitest";
import { resumeContactItems } from "./contact";

describe("resumeContactItems", () => {
  it("shows profile labels while keeping clickable profile URLs", () => {
    const items = resumeContactItems({
      fullName: "Abdullah Zia",
      email: "abdullah@example.com",
      phone: "03139686967",
      github: "abdullahx404",
      linkedin: "abdullahzia-linked",
      portfolio: "abdullah.dev",
    });

    expect(items.map((item) => item.label)).toEqual([
      "abdullah@example.com",
      "03139686967",
      "GitHub",
      "LinkedIn",
      "Portfolio",
    ]);
    expect(items.find((item) => item.key === "github")?.href).toBe("https://github.com/abdullahx404");
    expect(items.find((item) => item.key === "linkedin")?.href).toBe(
      "https://linkedin.com/in/abdullahzia-linked",
    );
    expect(items.find((item) => item.key === "portfolio")?.href).toBe("https://abdullah.dev");
  });
});
