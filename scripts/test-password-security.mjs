import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8");

const checks = [];

function check(name, condition) {
  checks.push({
    name,
    condition: Boolean(condition),
  });
}

const authPanel = read(
  "src/components/AuthPanel.jsx",
);

const accountSecurity = read(
  "src/components/AccountSecurityPanel.jsx",
);

const resetPage = read(
  "src/pages/ResetPasswordPage.jsx",
);

const clientApi = read(
  "src/utils/passwordSecurityApi.js",
);

const clientPolicy = read(
  "src/utils/passwordPolicy.js",
);

const serverPolicy = read(
  "supabase/functions/_shared/security/passwordPolicy.ts",
);

const edgeFunction = read(
  "supabase/functions/manage-password/index.ts",
);

const config = read(
  "supabase/config.toml",
);

const managementScript = read(
  "scripts/configure-hosted-password-policy.mjs",
);

check(
  "signup uses the server password endpoint",
  authPanel.includes(
    "signUpWithServerPasswordPolicy",
  ) &&
    !authPanel.includes(
      "supabase.auth.signUp",
    ),
);

check(
  "signed-in password changes use the server password endpoint",
  accountSecurity.includes(
    "changePasswordWithServerPolicy",
  ) &&
    !accountSecurity.includes(
      "auth.updateUser({ password",
    ),
);

check(
  "recovery password changes use the server password endpoint",
  resetPage.includes(
    "resetPasswordWithServerPolicy",
  ) &&
    !resetPage.includes(
      "auth.updateUser({ password",
    ),
);

check(
  "client endpoint invokes manage-password",
  /functions\.invoke\(\s*"manage-password"/.test(
    clientApi,
  ),
);

check(
  "server validates passwords before every mutation",
  /validatePassword\(\s*payload\.password\s*,?\s*\)/.test(
    edgeFunction,
  ) &&
    /validatePassword\(\s*payload\.newPassword\s*,?\s*\)/.test(
      edgeFunction,
    ),
);

check(
  "server requires current-password verification for signed-in changes",
  /current_password\s*:\s*currentPassword/.test(
    edgeFunction,
  ) &&
    edgeFunction.includes(
      "current_password_incorrect",
    ),
);

check(
  "server requires a recovery-authenticated JWT for reset",
  edgeFunction.includes(
    "requireRecoveryAuthentication",
  ) &&
    /entry\s*===\s*"recovery"/.test(
      edgeFunction,
    ),
);

check(
  "server delegates the final mutation to Supabase Auth",
  edgeFunction.includes(
    "/auth/v1/user",
  ) &&
    /Authorization\s*:\s*authorization/.test(
      edgeFunction,
    ),
);

check(
  "the public function has explicit application-layer authorization",
  config.includes(
    "[functions.manage-password]",
  ) &&
    /\[functions\.manage-password\][\s\S]*?verify_jwt\s*=\s*false/.test(
      config,
    ) &&
    /requireAuthenticatedUser\(\s*request\s*,?\s*\)/.test(
      edgeFunction,
    ),
);

check(
  "client and server use the same minimum and symbol set",
  clientPolicy.includes(
    "PASSWORD_MIN_LENGTH = 6",
  ) &&
    serverPolicy.includes(
      "PASSWORD_MIN_LENGTH = 6",
    ) &&
    clientPolicy.includes(
      "PASSWORD_ALLOWED_SYMBOLS",
    ) &&
    serverPolicy.includes(
      "PASSWORD_ALLOWED_SYMBOLS",
    ),
);

check(
  "hosted Auth configuration script enforces the same policy",
  managementScript.includes(
    "password_min_length: 6",
  ) &&
    managementScript.includes(
      'password_required_characters: "lower_upper_letters_digits_symbols"',
    ),
);

check(
  "password values are not logged",
  !/console\.(?:log|warn|error)\([^\n]*(?:currentPassword|newPassword)/i.test(
    edgeFunction,
  ),
);

let failed = 0;

for (const result of checks) {
  if (result.condition) {
    console.log(`✓ ${result.name}`);
  } else {
    failed += 1;
    console.error(`✗ ${result.name}`);
  }
}

console.log(
  `\n${checks.length - failed}/${checks.length} password security checks passed.`,
);

if (failed > 0) {
  process.exit(1);
}