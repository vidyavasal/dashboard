/**
 * ONE-TIME: initialise the credential vault.
 *
 * Pick the admin passphrase your team will MEMORIZE (never stored anywhere).
 * This prints the two env values to add to .env.local (and Vercel, both
 * environments):
 *   - PROFILE_CRED_PEPPER          server-side secret mixed into the key
 *   - PROFILE_PASSPHRASE_VERIFIER  lets the app confirm an entered passphrase
 *
 * Usage:
 *   npm run cred:setup -- "the memorized passphrase"
 *
 * If PROFILE_CRED_PEPPER is already set in your env, it is reused (so existing
 * stored credentials stay decryptable). Otherwise a fresh one is generated.
 */
import { randomBytes } from "crypto";
import { makeVerifier } from "../src/lib/crypto";

const passphrase = process.argv[2] ?? process.env.CRED_PASSPHRASE;

if (!passphrase || passphrase.length < 8) {
  console.error(
    'Provide a passphrase (min 8 chars):\n  npm run cred:setup -- "your passphrase"'
  );
  process.exit(1);
}

let pepper = process.env.PROFILE_CRED_PEPPER;
let generated = false;
if (!pepper || pepper.length < 16) {
  pepper = randomBytes(32).toString("base64url");
  process.env.PROFILE_CRED_PEPPER = pepper;
  generated = true;
}

const verifier = makeVerifier(passphrase);

console.log("\nAdd these to .env.local (and Vercel — both environments):\n");
if (generated) {
  console.log(`PROFILE_CRED_PEPPER="${pepper}"`);
} else {
  console.log("# PROFILE_CRED_PEPPER already set — keep your existing value.");
}
console.log(`PROFILE_PASSPHRASE_VERIFIER="${verifier}"`);
console.log(
  "\n⚠️  Memorize the passphrase. If lost, stored portal passwords are unrecoverable.\n" +
    (generated
      ? "⚠️  Changing PROFILE_CRED_PEPPER later makes existing stored passwords unrecoverable.\n"
      : "")
);
