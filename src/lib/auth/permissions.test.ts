import { describe, expect, it } from "vitest";
import { parsePermissions } from "@/lib/auth/permissions";

describe("parsePermissions", () => {
  it("returns defaults for null", () => {
    const p = parsePermissions(null);
    expect(p.manageRoles).toBe(false);
    expect(p.approveMembers).toBe(false);
  });

  it("returns defaults for malformed JSON", () => {
    const p = parsePermissions("{not-json");
    expect(p.manageSite).toBe(false);
    expect(p.editProfile).toBe(false);
  });

  it("merges valid partial JSON", () => {
    const p = parsePermissions(JSON.stringify({ approveMembers: true }));
    expect(p.approveMembers).toBe(true);
    expect(p.manageRoles).toBe(false);
  });
});
