import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  canApproveMembers,
  canDeleteMembers,
  isAdminEmail,
  isOwnerEmail,
  isUndeletableStaffAccount,
} from "@/lib/auth/staff";

describe("staff gates", () => {
  const originalAdmin = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@test.com";
  });

  afterEach(() => {
    process.env.ADMIN_EMAIL = originalAdmin;
  });

  it("identifies admin email", () => {
    expect(isAdminEmail("admin@test.com")).toBe(true);
    expect(isAdminEmail("other@test.com")).toBe(false);
  });

  it("only admin can delete members", () => {
    expect(canDeleteMembers("admin@test.com")).toBe(true);
    expect(canDeleteMembers("owner@test.com")).toBe(false);
  });

  it("admin email is undeletable", () => {
    expect(isUndeletableStaffAccount("admin@test.com")).toBe(true);
  });

  it("owner role can approve", () => {
    expect(canApproveMembers("member@test.com", "owner")).toBe(true);
    expect(canApproveMembers("member@test.com", "member")).toBe(false);
  });

  it("admin email can approve without role", () => {
    expect(canApproveMembers("admin@test.com", "member")).toBe(true);
  });

  it("owner email check matches admin inbox", () => {
    expect(isOwnerEmail("admin@test.com")).toBe(true);
    expect(isOwnerEmail("other@test.com")).toBe(false);
  });
});
