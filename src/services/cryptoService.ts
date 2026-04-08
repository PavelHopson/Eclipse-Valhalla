/**
 * Eclipse Valhalla — Crypto Service
 *
 * Provides password hashing and API key encryption
 * using the native Web Crypto API (SubtleCrypto).
 */

// ═══════════════════════════════════════════
// PASSWORD HASHING (SHA-256 + Salt)
// ═══════════════════════════════════════════

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  const data = new TextEncoder().encode(useSalt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt: useSalt };
}

export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// ═══════════════════════════════════════════
// API KEY ENCRYPTION (AES-GCM)
// ═══════════════════════════════════════════

const DEVICE_KEY_STORAGE = 'eclipse_device_key';

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  let rawKey = localStorage.getItem(DEVICE_KEY_STORAGE);

  if (!rawKey) {
    const keyData = crypto.getRandomValues(new Uint8Array(32));
    rawKey = Array.from(keyData).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(DEVICE_KEY_STORAGE, rawKey);
  }

  const keyBytes = new Uint8Array(rawKey.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptValue(plaintext: string): Promise<string> {
  try {
    const key = await getOrCreateDeviceKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch {
    // Fallback: base64 encode (better than plaintext)
    return 'b64:' + btoa(plaintext);
  }
}

export async function decryptValue(ciphertext: string): Promise<string> {
  try {
    // Handle base64 fallback
    if (ciphertext.startsWith('b64:')) {
      return atob(ciphertext.slice(4));
    }

    // Handle unencrypted legacy values (plain API keys)
    if (!ciphertext.includes('=') && !ciphertext.includes('/') && !ciphertext.includes('+')) {
      // Looks like a raw API key, not base64 — return as-is
      return ciphertext;
    }

    const key = await getOrCreateDeviceKey();
    const combined = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    // If decryption fails, treat as plaintext (legacy migration)
    return ciphertext;
  }
}
