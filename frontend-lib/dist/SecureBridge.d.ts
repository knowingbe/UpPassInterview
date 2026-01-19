export interface EncryptedPackage {
    encrypted_data: string;
    encrypted_key: string;
}
export declare class SecureBridge {
    private readonly publicKeyPem;
    private publicKey;
    constructor(publicKeyPem: string);
    init(): Promise<void>;
    encrypt(data: string): Promise<EncryptedPackage>;
}
