/**
 * Lithuanian contractor compliance field validators.
 * Used by the contractor registration form (see RegistrationPage.jsx).
 */

/**
 * Validate a Lithuanian personal code (asmens kodas).
 * 11 digits, first digit encodes century/gender (1–6), last digit is a
 * checksum computed with two weight passes (the standard ISO 7064-like scheme).
 */
export function isValidPersonalCode(code) {
  const v = String(code || '').trim();
  if (!/^\d{11}$/.test(v)) return false;

  const digits = v.split('').map(Number);
  if (digits[0] < 1 || digits[0] > 6) return false; // century/gender marker

  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];

  const sumWith = (w) => digits.slice(0, 10).reduce((s, d, i) => s + d * w[i], 0);

  let rem = sumWith(weights1) % 11;
  if (rem === 10) {
    rem = sumWith(weights2) % 11;
    if (rem === 10) rem = 0;
  }
  return rem === digits[10];
}

/**
 * Validate an IBAN via the ISO 13616 mod-97 check (works for any country).
 * Accepts spaces and lower case. For Lithuanian accounts the IBAN is 20 chars
 * ("LT" + 18 digits), but foreign EU IBANs are accepted too.
 */
export function isValidIBAN(iban) {
  const v = String(iban || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(v)) return false;
  if (v.length < 15 || v.length > 34) return false;
  if (v.startsWith('LT') && v.length !== 20) return false;

  // Move the first 4 chars to the end, then replace letters with 10..35.
  const rearranged = v.slice(4) + v.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (const d of value) {
      remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder === 1;
}

/** Normalise an IBAN for storage: strip spaces, upper-case. */
export function normaliseIBAN(iban) {
  return String(iban || '').replace(/\s+/g, '').toUpperCase();
}
