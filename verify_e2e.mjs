
import { spawn } from 'child_process';
import http from 'http';
import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';

// Polyfills for Node.js environment to support the Browser Lib
global.window = {
    crypto: webcrypto,
    atob: (str) => Buffer.from(str, 'base64').toString('binary'),
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
};
global.TextEncoder = TextEncoder;

// Import the library (ESM import)
import { SecureBridge } from './frontend-lib/dist/SecureBridge.js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // may be plain text/html if error
                    }
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function main() {
    console.log("Starting Backend...");

    // Start backend in background using uvicorn
    // use 'npx uvicorn' or assuming 'uvicorn' is in path (it was installed via pip)
    // We use 'python -m uvicorn' to be safe with path
    const backend = spawn('py', ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });

    backend.stdout.on('data', (data) => process.stdout.write(`[Backend]: ${data}`));
    backend.stderr.on('data', (data) => process.stderr.write(`[Backend Err]: ${data}`));

    // Wait for server to start
    console.log("Waiting for backend to be ready...");
    let retries = 20;
    while (retries > 0) {
        try {
            await fetchJson('http://127.0.0.1:8000/');
            console.log("Backend is ready!");
            break;
        } catch (e) {
            await sleep(500);
            retries--;
        }
    }

    if (retries === 0) {
        console.error("Backend failed to start.");
        backend.kill();
        process.exit(1);
    }

    try {
        // 1. Get Public Key from Backend
        console.log("Fetching Public Key...");
        const pkRes = await fetchJson('http://127.0.0.1:8000/public-key');
        const publicKeyPem = pkRes.public_key;
        console.log("Public Key received.");

        // 2. Initialize SecureBridge
        const bridge = new SecureBridge(publicKeyPem);
        await bridge.init();
        console.log("SecureBridge initialized.");

        // 3. Encrypt Payload
        const sensitiveData = "ID-12345-6789";
        console.log(`Encrypting data: ${sensitiveData}`);
        const pkg = await bridge.encrypt(sensitiveData);
        console.log("Encryption complete:", pkg);

        // 4. Submit to Backend
        console.log("Submitting to backend...");
        const submitRes = await fetchJson('http://127.0.0.1:8000/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pkg)
        });
        console.log("Submit Result:", submitRes);

        // 5. Verify Search
        console.log("Searching for data...");
        const searchRes = await fetchJson('http://127.0.0.1:8000/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ national_id: sensitiveData })
        });

        console.log("Search Result:", searchRes);

        if (searchRes.matches && searchRes.matches.length > 0) {
            console.log("\x1b[32mSUCCESS: End-to-End flow verified!\x1b[0m");
        } else {
            console.error("\x1b[31mFAILURE: Search did not return the expected record.\x1b[0m");
            process.exit(1);
        }

    } catch (err) {
        console.error("Test Failed:", err);
    } finally {
        backend.kill();
    }
}

main();
