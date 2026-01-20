import base64
import os
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

def generate_production_keys():
    print("--- 1. SERVER_PRIVATE_KEY_PEM (RSA 2048) ---")
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ).decode()
    print(private_pem)

    print("\n--- 2. SEARCH_INDEX_SECRET (HMAC SHA256) ---")
    hmac_secret = base64.b64encode(os.urandom(32)).decode()
    print(hmac_secret)

    print("\n--- 3. STORAGE_KEY_B64 (AES-256 Key) ---")
    storage_key = base64.b64encode(os.urandom(32)).decode()
    print(storage_key)

    print("\n" + "="*50)
    print("COPY CÁC GIÁ TRỊ TRÊN VÀO TAB ENVIRONMENT CỦA RENDER")
    print("="*50)

if __name__ == "__main__":
    generate_production_keys()
