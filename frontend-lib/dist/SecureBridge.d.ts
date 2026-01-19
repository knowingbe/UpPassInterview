export interface EncryptedPackage {
    encrypted_data: string;
    encrypted_key: string;
}
export declare class SecureBridge {
    private publicKey;
    private publicKeyPem;
    constructor(publicKeyPem: string);
    /**
     * Initializes the library by importing the public key.
     * This must be called before encryption.
     */
    init(): Promise<void>;
    /**
     * Encrypts a payload (e.g. National ID) using Hybrid Encryption.
     * 1. Generates ephemeral AES-GCM key.
     * 2. Encrypts data with AES key.
     * 3. Encrypts AES key with RSA Public Key.
     */
    encrypt(data: string): Promise<EncryptedPackage>;
    private importPublicKey;
    private str2ab;
    private arrayBufferToBase64;
}
