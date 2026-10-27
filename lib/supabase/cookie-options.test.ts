import assert from "node:assert/strict";
import { test } from "node:test";
import { supabaseCookieSecureFromRequest } from "./cookie-options.ts";

test("localhost never gets Secure cookies even if the request looks like https", () => {
  assert.equal(
    supabaseCookieSecureFromRequest({
      nextUrl: { protocol: "https:" },
      headers: { get: (name) => (name === "host" ? "localhost:3000" : null) },
    }),
    false,
  );
});

test("production https hosts get Secure cookies", () => {
  assert.equal(
    supabaseCookieSecureFromRequest({
      nextUrl: { protocol: "https:" },
      headers: {
        get: (name) => {
          if (name === "host") return "profili.fyi";
          if (name === "x-forwarded-proto") return "https";
          return null;
        },
      },
    }),
    true,
  );
});
