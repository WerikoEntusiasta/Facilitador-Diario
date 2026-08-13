// Client-Side AES-256-GCM Vault Criptography Helper
// Encrypts sensitive vault fields (passwords, notes, PINs) using Web Crypto API.

async function getKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(text: string, masterPassword: string): Promise<string> {
  if (!text) return '';
  try {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(masterPassword, salt);

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(text)
    );

    const buffer = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.length);
    buffer.set(new Uint8Array(encryptedContent), salt.length + iv.length);

    return 'ENC:' + btoa(String.fromCharCode(...buffer));
  } catch (err) {
    console.warn('Erro ao criptografar:', err);
    return text;
  }
}

export async function decryptText(encryptedBase64: string, masterPassword: string): Promise<string> {
  if (!encryptedBase64 || !encryptedBase64.startsWith('ENC:')) return encryptedBase64;
  try {
    const rawStr = atob(encryptedBase64.substring(4));
    const bytes = new Uint8Array(rawStr.length);
    for (let i = 0; i < rawStr.length; i++) {
      bytes[i] = rawStr.charCodeAt(i);
    }

    const salt = bytes.subarray(0, 16);
    const iv = bytes.subarray(16, 28);
    const data = bytes.subarray(28);

    const key = await getKey(masterPassword, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    return '[Senha incorreta ou erro ao descriptografar]';
  }
}
