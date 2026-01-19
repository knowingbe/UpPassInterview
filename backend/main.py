import os
import base64
import hmac
import hashlib
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

app = FastAPI(title="UpPass Verify Service")

# --- In-Memory Database ---
# Simulating a DB table:
# columns: id (auto-inc), encrypted_data (Column A), search_index (Column B)
fake_db = []

# --- Key Management (Simulated) ---
# In production, these would be loaded from KMS or secure environment variables.
# 1. Server Private Key (RSA) for unwrapping the Symmetric Key
# 2. Search Index Key (HMAC Secret) for Blind Indexing

# Generate keys on startup for demo purposes
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
public_key = private_key.public_key()

# Convert public key to PEM for distribution (e.g. to frontend)
pem_public = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

SEARCH_INDEX_SECRET = os.urandom(32) # HMAC Key

class SubmissionPayload(BaseModel):
    encrypted_data: str # Base64 of (IV + Ciphertext)
    encrypted_key: str  # Base64 of (RSA Encrypted AES Key)

class SearchQuery(BaseModel):
    national_id: str

@app.get("/")
def read_root():
    return {"message": "UpPass Secure Bridge Backend Running"}

@app.get("/public-key")
def get_public_key():
    """Return the Public Key for the frontend to use."""
    return {"public_key": pem_public.decode('utf-8')}


# Static Server Key for Storage (Simulated)
# In production, load this from KMS/Env
STORAGE_KEY = AESGCM.generate_key(bit_length=256) 
storage_cipher = AESGCM(STORAGE_KEY)

@app.post("/submit")
def submit_data(payload: SubmissionPayload):
    try:
        # 1. Decode Base64 inputs
        enc_data_bytes = base64.b64decode(payload.encrypted_data)
        enc_key_bytes = base64.b64decode(payload.encrypted_key)

        # 2. Decrypt the Symmetric Key using Private Key
        aes_key = private_key.decrypt(
            enc_key_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # 3. Decrypt the Data using the Symmetric Key
        if len(enc_data_bytes) < 12:
            raise ValueError("Invalid ciphertext length")
        
        iv = enc_data_bytes[:12]
        ciphertext = enc_data_bytes[12:] # helper already handles tag check if it's there? 
        # Wait, if I split manually, I must ensure AESGCM.decrypt gets (ciphertext+tag).
        # Web Crypto GCM: Ciphertext includes Tag at end.
        
        # Correct usage with cryptography AESGCM:
        # aesgcm.decrypt(nonce, data, associated_data) where data is ciphertext + tag.
        
        aesgcm = AESGCM(aes_key)
        decrypted_data_bytes = aesgcm.decrypt(iv, ciphertext, None)
        national_id = decrypted_data_bytes.decode('utf-8')

        # 4. Store Securely
        # Column A: Randomized Encryption (Storage)
        # Generate new random nonce
        storage_nonce = os.urandom(12)
        storage_ciphertext = storage_cipher.encrypt(storage_nonce, decrypted_data_bytes, None)
        # Store as base64 or bytes
        storage_blob = base64.b64encode(storage_nonce + storage_ciphertext).decode('utf-8')

        # Column B: Blind Index (Deterministic)
        h = hmac.new(SEARCH_INDEX_SECRET, national_id.encode('utf-8'), hashlib.sha256)
        blind_index = h.hexdigest()

        # Store in DB
        fake_db.append({
            "id": len(fake_db) + 1,
            "storage_blob": storage_blob, # Column A
            "blind_index": blind_index    # Column B
        })

        return {"status": "success", "record_id": len(fake_db)}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/search")
def search_national_id(query: SearchQuery):
    # 1. Compute Blind Index
    h = hmac.new(SEARCH_INDEX_SECRET, query.national_id.encode('utf-8'), hashlib.sha256)
    search_hash = h.hexdigest()

    # 2. Lookup
    results = [r for r in fake_db if r["blind_index"] == search_hash]
    
    if not results:
        raise HTTPException(status_code=404, detail="Not found")

    return {"count": len(results), "matches": [r["id"] for r in results]}

# Fix Server DEK for storage (simulated persistence)
# In valid app, this is loaded from env
STORAGE_KEY = b'\x00' * 32 

