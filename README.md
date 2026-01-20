# UpPass Secure Bridge

This project demonstrates an End-to-End (E2E) encryption system for securely transmitting PII.

## Structure
- `/frontend-lib`: TypeScript library for client-side encryption.
- `/backend`: Python FastAPI service for decryption and verification.

## Prerequisites
- Node.js & npm
- Python 3.10+
- Docker (optional)

## Quick Start

### 1. Frontend Library
```bash
cd frontend-lib
npm install
npm run build
```

### 2. Backend Service
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 3. Interactive Demo
1. Build the library: `cd frontend-lib && npm install && npm run build`
2. Start the backend: `cd backend && py -m pip install -r requirements.txt && py main.py`
3. Run the demo: `cd demo && npm install && npm run dev`
4. Open the URL shown in the terminal (usually `http://localhost:5173`).

## Deployment

For this assignment, I recommend the following:
- **Frontend**: Deploy the `demo/` folder and `frontend-lib/` to **Netlify** or **Vercel**.
- **Backend**: Deploy the `backend/` folder to **Render**, **Railway**, or **Fly.io** using the provided `Dockerfile`.

Detailed instructions are in [DEPLOY.md](./DEPLOY.md).

## Part 3: System Design & Incident Response

### Scenario A: Key Rotation Strategy

**Problem**: Rotate Data Encryption Keys (DEK) annually with millions of existing records without downtime.

**Solution: Key Versioning & Lazy Migration**

1.  **Key Versioning**:
    *   Store multiple keys (e.g., in a Key Management Service or secure vault) identified by a `key_id` or `version`.
    *   The database schema should store the `key_version` alongside the `encrypted_data`.
    *   `Record = { id, key_version, encrypted_data, ... }`

2.  **Rotation Process**:
    *   **Phase 1 (Preparation)**: Generate a new DEK (Version N+1). Add it to the Key Store.
    *   **Phase 2 (Dual-Read / Write-New)**:
        *   Configure the application to **encrypt** all *new* data using Version N+1.
        *   Configure the application to be able to **decrypt** using *either* Version N (old) or Version N+1 (new), depending on the record's stored `key_version` metadata.
    *   **Phase 3 (Background Migration)**:
        *   Launch a background worker process (batch job).
        *   This job reads records encrypted with Version N, decrypts them with Version N, re-encrypts them with Version N+1, and updates the database.
        *   This ensures zero downtime as the main application can handle both keys.
    *   **Phase 4 (Cleanup)**:
        *   Once all records are migrated, remove Version N from the valid decryption keys list (or archive it).

**How the system knows which key to use**:
The `key_version` or `key_id` is stored as metadata with each ciphertext record (e.g., as a prefix to the ciphertext or a separate column).

### Scenario B: Data Leak Incident Response

**Problem**: "Decrypted National ID" was accidentally logged to Cloud Logging for 24 hours.

**Immediate Actions (Containment & Mitigation)**:

1.  **Stop the Bleeding**:
    *   Immediately deploy a hotfix to remove the logging statement.
    *   If a deployment takes time, use feature flags or log level configuration (e.g., switch to `ERROR` only) to suppress the output immediately.

2.  **Scrub Logs**:
    *   Contact the Cloud Logging provider support or use provided tools to purge/redact the sensitive logs from the specific time window.
    *   If immediate purging is not possible, restrict access to the logs to *only* the Incident Response team (revoke access for developers).
    *   Ensure logs are not being exported to other sinks (e.g., S3, BigQuery) and scrub them there if they are.

3.  **Rotate Keys**:
    *   The PII itself is compromised, not necessarily the encryption keys. However, if the session keys or private keys were logged, they must be revoked and rotated immediately.

4.  **Assess Impact**:
    *   Determine exactly how many records were exposed.
    *   Check access logs to the logging system to see *who* viewed the logs during that window.

**Prevention (Technical Controls)**:

1.  **Data Loss Prevention (DLP)**:
    *   Implement DLP filters in the logging pipeline (e.g., Fluentd, CloudWatch Logs Agent) to detect and redact patterns that look like National IDs or credit card numbers before they leave the server.

2.  **Code Reviews & Linters**:
    *   Add custom linter rules (e.g., ESLint, Pylint) to flag logging of variables named like `password`, `secret`, `pii`, or `national_id`.
    *   Mandatory code reviews focusing on logging statements.

3.  **Structured Logging with Redaction**:
    *   Use a structured logging library that supports "sensitive" fields which are automatically hashed or redacted.
    *   Example: `logger.info("User login", user_id=123, national_id=Redact(nid))`

4.  **Production Access Control**:
    *   Developers should not have unrestricted read access to raw production logs. They should use an observability platform where sensitive fields can be masked dynamically.
