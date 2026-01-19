from pydantic import BaseModel

class SubmissionPayload(BaseModel):
    encrypted_data: str # Base64 (IV + Ciphertext)
    encrypted_key: str  # Base64 (RSA Encrypted AES Key)

class SearchQuery(BaseModel):
    national_id: str
