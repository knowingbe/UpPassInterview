import os
import base64
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Load .env file for local development
load_dotenv()

# --- Key Management (Environment Variables) ---

# 1. Server Private/Public Keypair (RSA)
# We expect the Private Key PEM as an environment variable (often base64 or escaped)
_private_key_pem = os.getenv("SERVER_PRIVATE_KEY_PEM")

if _private_key_pem:
    # Handle both raw PEM and Base64 encoded PEM (common in some platforms)
    try:
        key_bytes = _private_key_pem.encode()
        if not key_bytes.startswith(b"-----"):
            key_bytes = base64.b64decode(_private_key_pem)
        
        SERVER_PRIVATE_KEY = serialization.load_pem_private_key(
            key_bytes,
            password=None
        )
    except Exception as e:
        print(f"Error loading SERVER_PRIVATE_KEY_PEM: {e}")
        raise e
else:
    # Fallback for local dev ONLY if not provided
    print("WARNING: SERVER_PRIVATE_KEY_PEM not found, generating temporary key...")
    SERVER_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)

SERVER_PUBLIC_KEY_PEM = SERVER_PRIVATE_KEY.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# 2. Search Index Key (HMAC Secret)
_search_index_secret = os.getenv("SEARCH_INDEX_SECRET", "default_secret_for_dev_only_123")
SEARCH_INDEX_SECRET = _search_index_secret.encode()

# 3. Storage Key (Server DEK) - 32 bytes for AES-256
_storage_key_b64 = os.getenv("STORAGE_KEY_B64")
if _storage_key_b64:
    _storage_key_bytes = base64.b64decode(_storage_key_b64)
else:
    print("WARNING: STORAGE_KEY_B64 not found, generating temporary key...")
    _storage_key_bytes = AESGCM.generate_key(bit_length=256)

STORAGE_CIPHER = AESGCM(_storage_key_bytes)
