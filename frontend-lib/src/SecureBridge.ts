
export interface EncryptedPackage {
  encrypted_data: string; // Base64
  encrypted_key: string;  // Base64
}

export class SecureBridge {
  private publicKey: CryptoKey | null = null;
  private publicKeyPem: string;

  constructor(publicKeyPem: string) {
    this.publicKeyPem = publicKeyPem;
  }

  /**
   * Initializes the library by importing the public key.
   * This must be called before encryption.
   */
  async init(): Promise<void> {
    this.publicKey = await this.importPublicKey(this.publicKeyPem);
  }

  /**
   * Encrypts a payload (e.g. National ID) using Hybrid Encryption.
   * 1. Generates ephemeral AES-GCM key.
   * 2. Encrypts data with AES key.
   * 3. Encrypts AES key with RSA Public Key.
   */
  async encrypt(data: string): Promise<EncryptedPackage> {
    if (!this.publicKey) {
      await this.init();
    }

    // 1. Generate transient Symmetric Key (AES-GCM 256)
    const aesKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // extractable
      ["encrypt"]
    );

    // 2. Encrypt the payload with the Symmetric Key
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    // standard IV length 12 bytes
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); 

    const encryptedDataBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encodedData
    );

    // Combine IV + Ciphertext for storage/transmission
    // Common practice: Prepend IV to ciphertext
    const encryptedDataWithIv = new Uint8Array(iv.length + encryptedDataBuffer.byteLength);
    encryptedDataWithIv.set(iv);
    encryptedDataWithIv.set(new Uint8Array(encryptedDataBuffer), iv.length);

    // 3. Encrypt the Symmetric Key itself using the Server's Public Key
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
        // SHA-256 usually recommended
      },
      this.publicKey!,
      rawAesKey
    );

    // 4. Return packaged payload
    return {
      encrypted_data: this.arrayBufferToBase64(encryptedDataWithIv.buffer),
      encrypted_key: this.arrayBufferToBase64(encryptedKeyBuffer),
    };
  }

  // --- Helpers ---

  private async importPublicKey(pem: string): Promise<CryptoKey> {
    // strip PEM header/footer
    const binaryDerString = window.atob(
      pem
        .replace(/-----BEGIN PUBLIC KEY-----/, "")
        .replace(/-----END PUBLIC KEY-----/, "")
        .replace(/(\r\n|\n|\r)/gm, "")
    );
    const binaryDer = this.str2ab(binaryDerString);

    return await window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false, // extractable
      ["encrypt"]
    );
  }

  private str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
