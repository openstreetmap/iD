// We can use keys that are 128 bits (16 bytes), 192 bits (24 bytes) or 256 bits (32 bytes).
// To generate a random key:  window.crypto.getRandomValues(new Uint8Array(16));

// This default signing key is built into iD and can be used to mask/unmask sensitive values.
const DEFAULT_128 = [250, 157, 60, 79, 142, 134, 229, 129, 138, 126, 210, 129, 29, 71, 160, 208];

const ALGO = { name: 'AES-CTR', counter: new Uint8Array(16), length: 128 };
ALGO.counter[0xf] = 1; // for backwards compatibility with the aes library that was previously used

function importKey(raw: ArrayLike<number>) {
    return crypto.subtle.importKey(
        'raw',
        Uint8Array.from(raw),
        'AES-CTR',
        false,
        ['encrypt', 'decrypt'],
    );
}

function hexFromBytes(bytes: Uint8Array): string {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(hex.length >>> 1);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return out;
}

export async function utilAesEncrypt(
    text: string,
    key?: ArrayLike<number>,
): Promise<string> {
    const cryptoKey = await importKey(key ?? DEFAULT_128);
    const encrypted = await crypto.subtle.encrypt(
        ALGO,
        cryptoKey,
        new TextEncoder().encode(text),
    );
    return hexFromBytes(new Uint8Array(encrypted));
}

export async function utilAesDecrypt(
    encryptedHex: string,
    key?: ArrayLike<number>,
): Promise<string> {
    const cryptoKey = await importKey(key ?? DEFAULT_128);
    const decrypted = await crypto.subtle.decrypt(
        ALGO,
        cryptoKey,
        hexToBytes(encryptedHex),
    );
    return new TextDecoder().decode(decrypted);
}
