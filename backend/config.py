import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# --- Key Management (Simulated) ---
# In a real app, load these from environment variables or KMS.

# 1. Server Private/Public Keypair (RSA)
_private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

SERVER_PRIVATE_KEY = _private_key
SERVER_PUBLIC_KEY_PEM = _private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# 2. Search Index Key (HMAC Secret)
SEARCH_INDEX_SECRET = os.urandom(32)

# 3. Storage Key (Server DEK)
_storage_key_bytes = AESGCM.generate_key(bit_length=256)
STORAGE_CIPHER = AESGCM(_storage_key_bytes)
