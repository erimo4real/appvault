import assert from "node:assert/strict";
import { decryptSecret, encryptSecret } from "./crypto.js";

const value = "super-secret-value";
const encrypted = encryptSecret(value);

assert.equal(typeof encrypted, "string");
assert.notEqual(encrypted, value);
assert.equal(decryptSecret(encrypted), value);
assert.equal(encryptSecret(""), null);
assert.equal(decryptSecret(null), null);

console.log("crypto tests passed");
