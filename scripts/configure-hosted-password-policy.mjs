#!/usr/bin/env node

const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF?.trim() || "achnzeuvmqymguiqepji";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim() || "";
const VERIFY_ONLY = process.argv.includes("--verify-only");
const EXPECTED = {
  password_min_length: 6,
  password_required_characters: "lower_upper_letters_digits_symbols",
};

function fail(message) {
  console.error(`Password policy configuration failed: ${message}`);
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  fail(
    "Set SUPABASE_ACCESS_TOKEN to a Supabase personal access token before running this command.",
  );
}

if (!/^[a-z0-9]{20}$/.test(PROJECT_REF)) {
  fail("SUPABASE_PROJECT_REF is invalid.");
}

const endpoint = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const headers = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

async function readResponse(response, action) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Keep the error generic so response bodies cannot accidentally expose secrets.
  }

  if (!response.ok) {
    const detail = payload?.message || payload?.error || response.statusText;
    fail(`${action} returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return payload || {};
}

async function getPolicy() {
  const response = await fetch(endpoint, { headers });
  const config = await readResponse(response, "Reading Auth configuration");
  return {
    password_min_length: Number(config.password_min_length),
    password_required_characters: String(
      config.password_required_characters || "",
    ),
  };
}

function verifyPolicy(policy) {
  const valid =
    policy.password_min_length === EXPECTED.password_min_length &&
    policy.password_required_characters ===
      EXPECTED.password_required_characters;

  console.log(`Supabase project: ${PROJECT_REF}`);
  console.log(`Minimum password length: ${policy.password_min_length}`);
  console.log(
    `Required characters: ${policy.password_required_characters || "not configured"}`,
  );

  if (!valid) {
    fail(
      "The hosted Auth policy does not match JacketCheck's required six-character uppercase/lowercase/number/symbol policy.",
    );
  }
}

if (!VERIFY_ONLY) {
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify(EXPECTED),
  });
  await readResponse(response, "Updating Auth configuration");
  console.log("Hosted Supabase Auth password policy updated.");
}

const current = await getPolicy();
verifyPolicy(current);
console.log("Hosted Supabase Auth password policy verified.");
