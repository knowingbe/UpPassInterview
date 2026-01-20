# Deployment Guide

This project consists of a Frontend Demo and a Python Backend. Here is how to deploy them.

## 1. Backend Deployment (Render.com / Railway.app)

The backend is a FastAPI application. It is recommended to deploy it to a platform that supports Docker or persistent Python processes.

### Deploying to Render
1.  Connect your GitHub/GitLab repository to **Render**.
2.  Click **New > Web Service**.
3.  Choose the repository.
4.  Render will detect the `Dockerfile` in the `backend/` directory.
5.  Set the **Build Context** to `backend`.
6.  Click **Deploy**.
7.  Copy the generated URL (e.g., `https://uppass-backend.onrender.com`).

---

## 2. Frontend Deployment (Netlify / Vercel)

The frontend demo can be deployed as a static site.

### Deploying to Netlify
1.  Connect your repository to Netlify.
2.  Set the **Base directory** to: (Leave empty/Root)
3.  Set the **Build command** to:
    `cd frontend-lib && npm install && npm run build && cd ../demo && npm install && npm run build`
4.  Set the **Publish directory** to: `demo/dist`
5.  Go to **Site configuration > Environment variables** and add:
    *   `VITE_BACKEND_URL`: Your deployed backend URL.

### Error: Decryption failed
If you encounter this, ensure all your Render workers share the same `SERVER_PRIVATE_KEY_PEM`. 

### Environment Variables
For the Backend, set these in the Render Dashboard (**Environment** tab):
- `SERVER_PRIVATE_KEY_PEM`: Paste the entire content of your private key (including BEGIN/END lines).
- `SEARCH_INDEX_SECRET`: A long random string for HMAC.
- `STORAGE_KEY_B64`: A 32-byte Base64 encoded key for AES-256 storage encryption.

### How to generate these keys?
We provide a utility script in the backend folder. Run:
```bash
cd backend
py generate_keys.py
```
Copy the output and paste it into your Render/Vercel environment variables.

---

## 3. Alternative: All-in-one on Vercel

Vercel supports both Frontend and Python Serverless Functions.
1.  Create a `api/` directory in the root.
2.  Move your FastAPI logic into `api/index.py`.
3.  Vercel will automatically detect and deploy it as a serverless function.
4.  Deploy your demo as a static folder in the same project.
