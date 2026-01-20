import base64
import os
import hmac
import hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from config import SERVER_PRIVATE_KEY, SEARCH_INDEX_SECRET, STORAGE_CIPHER
from schemas import SubmissionPayload

def decrypt_ingress_payload(payload: SubmissionPayload) -> str:
    """
    Decrypts the hybrid-encrypted payload to recover the National ID.
    1. Decrypts AES Key using RSA Private Key.
    2. Decrypts Data using AES Key.
    """
    try:
        # 1. Decrypt AES Key
        enc_key_bytes = base64.b64decode(payload.encrypted_key)
        aes_key = SERVER_PRIVATE_KEY.decrypt(
            enc_key_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # 2. Decrypt Data
        enc_data_bytes = base64.b64decode(payload.encrypted_data)
        if len(enc_data_bytes) < 12:
            raise ValueError("Invalid ciphertext length")

        iv = enc_data_bytes[:12]
        ciphertext = enc_data_bytes[12:]
        
        aesgcm = AESGCM(aes_key)
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext, None)
        return decrypted_bytes.decode('utf-8')
    except Exception as e:
        # Log error in production
        raise ValueError(f"Decryption failed: {str(e)}")

def encrypt_for_storage(data: str) -> str:
    """
    Encrypts data for secure storage using Server DEK (Randomized Encryption).
    Returns Base64 encoded blob (Nonce + Ciphertext).
    """
    nonce = os.urandom(12)
    ciphertext = STORAGE_CIPHER.encrypt(nonce, data.encode('utf-8'), None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def compute_blind_index(data: str) -> str:
    """
    Computes HMAC-SHA256 deterministic hash for blind indexing.
    """
    h = hmac.new(SEARCH_INDEX_SECRET, data.encode('utf-8'), hashlib.sha256)
    return h.hexdigest()
