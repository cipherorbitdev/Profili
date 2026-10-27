import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isGoogleOnlyAccount,
  providersFromUser,
  signupShouldResendConfirmation,
} from "./account-providers.ts";
import { authFormSchema } from "./schemas.ts";

test("google-only accounts cannot add email signup", () => {
  assert.equal(isGoogleOnlyAccount(["google"]), true);
  assert.equal(isGoogleOnlyAccount(["google", "email"]), false);
  assert.equal(isGoogleOnlyAccount(["email"]), false);
});

test("providersFromUser prefers app_metadata", () => {
  assert.deepEqual(
    providersFromUser({ app_metadata: { providers: ["google"] }, identities: [{ provider: "email" }] }),
    ["google"],
  );
});

test("authFormSchema validates signup name and email", () => {
  const parsed = authFormSchema(true).safeParse({
    name: "",
    email: "not-an-email",
    password: "short",
  });
  assert.equal(parsed.success, false);
  const ok = authFormSchema(true).safeParse({
    name: "Ada",
    email: "Ada@Example.com",
    password: "longenough",
  });
  assert.equal(ok.success, true);
  if (ok.success) assert.equal(ok.data.email, "ada@example.com");
});

test("second signup with empty identities should resend confirmation", () => {
  assert.equal(
    signupShouldResendConfirmation({ user: { identities: [], app_metadata: {} } }),
    "resend",
  );
  assert.equal(
    signupShouldResendConfirmation({
      user: null,
      errorMessage: "User already registered",
    }),
    "resend",
  );
  assert.equal(
    signupShouldResendConfirmation({
      user: { identities: [{ provider: "email" }] },
    }),
    "proceed",
  );
  assert.equal(
    signupShouldResendConfirmation({
      user: { app_metadata: { providers: ["google"] } },
    }),
    "google_only",
  );
});
