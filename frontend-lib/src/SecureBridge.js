"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureBridge = void 0;
var SecureBridge = /** @class */ (function () {
    function SecureBridge(publicKeyPem) {
        this.publicKey = null;
        this.publicKeyPem = publicKeyPem;
    }
    /**
     * Initializes the library by importing the public key.
     * This must be called before encryption.
     */
    SecureBridge.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.importPublicKey(this.publicKeyPem)];
                    case 1:
                        _a.publicKey = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Encrypts a payload (e.g. National ID) using Hybrid Encryption.
     * 1. Generates ephemeral AES-GCM key.
     * 2. Encrypts data with AES key.
     * 3. Encrypts AES key with RSA Public Key.
     */
    SecureBridge.prototype.encrypt = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var aesKey, encoder, encodedData, iv, encryptedDataBuffer, encryptedDataWithIv, rawAesKey, encryptedKeyBuffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.publicKey) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, window.crypto.subtle.generateKey({
                            name: "AES-GCM",
                            length: 256,
                        }, true, // extractable
                        ["encrypt"])];
                    case 3:
                        aesKey = _a.sent();
                        encoder = new TextEncoder();
                        encodedData = encoder.encode(data);
                        iv = window.crypto.getRandomValues(new Uint8Array(12));
                        return [4 /*yield*/, window.crypto.subtle.encrypt({
                                name: "AES-GCM",
                                iv: iv,
                            }, aesKey, encodedData)];
                    case 4:
                        encryptedDataBuffer = _a.sent();
                        encryptedDataWithIv = new Uint8Array(iv.length + encryptedDataBuffer.byteLength);
                        encryptedDataWithIv.set(iv);
                        encryptedDataWithIv.set(new Uint8Array(encryptedDataBuffer), iv.length);
                        return [4 /*yield*/, window.crypto.subtle.exportKey("raw", aesKey)];
                    case 5:
                        rawAesKey = _a.sent();
                        return [4 /*yield*/, window.crypto.subtle.encrypt({
                                name: "RSA-OAEP",
                                // SHA-256 usually recommended
                            }, this.publicKey, rawAesKey)];
                    case 6:
                        encryptedKeyBuffer = _a.sent();
                        // 4. Return packaged payload
                        return [2 /*return*/, {
                                encrypted_data: this.arrayBufferToBase64(encryptedDataWithIv.buffer),
                                encrypted_key: this.arrayBufferToBase64(encryptedKeyBuffer),
                            }];
                }
            });
        });
    };
    // --- Helpers ---
    SecureBridge.prototype.importPublicKey = function (pem) {
        return __awaiter(this, void 0, void 0, function () {
            var binaryDerString, binaryDer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        binaryDerString = window.atob(pem
                            .replace(/-----BEGIN PUBLIC KEY-----/, "")
                            .replace(/-----END PUBLIC KEY-----/, "")
                            .replace(/(\r\n|\n|\r)/gm, ""));
                        binaryDer = this.str2ab(binaryDerString);
                        return [4 /*yield*/, window.crypto.subtle.importKey("spki", binaryDer, {
                                name: "RSA-OAEP",
                                hash: "SHA-256",
                            }, false, // extractable
                            ["encrypt"])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SecureBridge.prototype.str2ab = function (str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    };
    SecureBridge.prototype.arrayBufferToBase64 = function (buffer) {
        var binary = "";
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };
    return SecureBridge;
}());
exports.SecureBridge = SecureBridge;
