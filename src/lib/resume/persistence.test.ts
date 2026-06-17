import { afterEach, describe, expect, it } from "vitest";
import { sampleResume } from "@/lib/resume/sample";
import {
  applyProfileToResume,
  clearStoredResume,
  getInitialResume,
  getStoredProfile,
  getStoredResume,
  saveStoredProfile,
  saveStoredResume,
} from "./persistence";

describe("resume persistence", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("applies the stored onboarding profile to the initial sample resume", () => {
    saveStoredProfile({
      fullName: "Abdullah Khan",
      title: "Software Engineer",
      onboarded: true,
    });

    const resume = getInitialResume();

    expect(resume.personal.fullName).toBe("Abdullah Khan");
    expect(resume.personal.title).toBe("Software Engineer");
  });

  it("removes old sample contact details when applying a stored profile", () => {
    const resume = applyProfileToResume(
      {
        ...sampleResume,
        personal: {
          ...sampleResume.personal,
          email: "amina@example.com",
          phone: "+92 300 0000000",
          github: "https://github.com/amina",
          linkedin: "https://linkedin.com/in/amina",
          portfolio: "https://amina.dev",
          location: "Lahore, Pakistan",
        },
      },
      {
        fullName: "Abdullah Zia",
        title: "Software Engineer",
      },
    );

    expect(resume.personal.fullName).toBe("Abdullah Zia");
    expect(resume.personal.email).toBe("");
    expect(resume.personal.github).toBe("");
    expect(resume.personal.linkedin).toBe("");
  });

  it("stores and reads the browser-local resume draft", () => {
    const resume = applyProfileToResume(sampleResume, {
      fullName: "Resume User",
      title: "Frontend Engineer",
    });

    saveStoredResume(resume);

    expect(getStoredResume()?.personal.fullName).toBe("Resume User");
    expect(getStoredProfile()).toBeNull();

    clearStoredResume();
    expect(getStoredResume()).toBeNull();
  });
});
