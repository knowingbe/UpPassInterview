export class SecureBridge {
    constructor(publicKeyPem) {
        this.publicKeyPem = publicKeyPem;
        this.publicKey = null;
    }
    async init() {
        this.publicKey = await importPublicKey(this.publicKeyPem);
    }
    async encrypt(data) {
        if (!this.publicKey) {
            await this.init();
        }
        // Generate ephemeral AES-GCM key
        const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
        // Encrypt data with AES key
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);
        const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encodedData);
        // Combine IV + Ciphertext
        const encryptedDataWithIv = new Uint8Array(iv.length + ciphertext.byteLength);
        encryptedDataWithIv.set(iv);
        encryptedDataWithIv.set(new Uint8Array(ciphertext), iv.length);
        // Encrypt AES key with RSA Public Key
        const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, this.publicKey, rawAesKey);
        return {
            encrypted_data: arrayBufferToBase64(encryptedDataWithIv.buffer),
            encrypted_key: arrayBufferToBase64(encryptedKey),
        };
    }
}
// Check if window is defined (SSR safety check optional, but good for library)
const cryptoSubtle = window.crypto?.subtle;
async function importPublicKey(pem) {
    const binaryDerString = window.atob(pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\s)/g, ""));
    const binaryDer = str2ab(binaryDerString);
    return cryptoSubtle.importKey("spki", binaryDer, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
}
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
