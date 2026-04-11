"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithDeviceFlow = loginWithDeviceFlow;
const picocolors_1 = __importDefault(require("picocolors"));
const config_1 = require("../utils/config");
const API_BASE = 'https://build-in-live-mvp.vercel.app';
const openBrowser = async (url) => {
    const { default: open } = await Promise.resolve().then(() => __importStar(require('open')));
    await open(url);
};
async function loginWithDeviceFlow() {
    console.log(picocolors_1.default.gray('Requesting device authorization code...'));
    // 1. Get a real device code from our server
    const codeRes = await fetch(`${API_BASE}/api/auth/device/code`, { method: 'POST' });
    if (!codeRes.ok) {
        throw new Error('Failed to request device authorization code. Is the server reachable?');
    }
    const codeData = await codeRes.json();
    const { device_code, user_code, verification_uri_complete, interval } = codeData;
    console.log('\n' + picocolors_1.default.bold(picocolors_1.default.green('🔗 Please visit the following URL to authorize this device:')));
    console.log(picocolors_1.default.cyan(verification_uri_complete));
    console.log('\nAnd enter the code: ' + picocolors_1.default.bold(picocolors_1.default.bgYellow(picocolors_1.default.black(` ${user_code} `))) + '\n');
    console.log(picocolors_1.default.gray('(The code is pre-filled in the URL above — just hit Authorize!)'));
    // Open browser automatically
    try {
        await openBrowser(verification_uri_complete);
        console.log(picocolors_1.default.gray('(Your browser should have opened automatically)'));
    }
    catch (e) {
        // ignore if browser can't open
    }
    // 2. Poll server until approved or expired
    console.log(picocolors_1.default.cyan('⏳ Waiting for authorization...'));
    const token = await pollForToken(device_code, interval || 5);
    // 3. Save token locally
    await (0, config_1.writeConfig)({ accessToken: token });
    console.log(picocolors_1.default.green('\n✅ Successfully logged in!'));
    return token;
}
function pollForToken(deviceCode, intervalSeconds) {
    return new Promise((resolve, reject) => {
        const maxAttempts = Math.floor(900 / intervalSeconds); // 15 minutes
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            process.stdout.write(picocolors_1.default.gray('.'));
            if (attempts > maxAttempts) {
                clearInterval(interval);
                reject(new Error('Authorization timed out. Please run `build-in-live-cli init` again.'));
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/api/auth/device/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_code: deviceCode }),
                });
                if (res.status === 202)
                    return; // Still pending, keep polling
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'approved' && data.access_token) {
                        clearInterval(interval);
                        resolve(data.access_token);
                    }
                }
                else if (res.status === 410) {
                    clearInterval(interval);
                    reject(new Error('Code expired. Please run `build-in-live-cli init` again.'));
                }
            }
            catch (err) {
                // Network error — keep trying
            }
        }, intervalSeconds * 1000);
    });
}
