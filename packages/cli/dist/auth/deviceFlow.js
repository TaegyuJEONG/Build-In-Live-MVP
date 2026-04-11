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
// Dynamically import `open` as it is an ESM module
const openBrowser = async (url) => {
    const { default: open } = await Promise.resolve().then(() => __importStar(require('open')));
    await open(url);
};
async function loginWithDeviceFlow() {
    console.log(picocolors_1.default.gray('Requesting device authorization code...'));
    // In a real implementation:
    // const res = await fetch(`${API_BASE}/oauth/device/code`, { method: 'POST' });
    // const data = await res.json();
    // We'll mock the response:
    const mockCodeResponse = {
        device_code: 'mock_device_code_12345',
        user_code: 'FD34-9A8B',
        verification_uri: 'https://buildinlive.com/activate',
        expires_in: 900,
        interval: 3 // We use 3 seconds for faster demonstration
    };
    console.log('\n' + picocolors_1.default.bold(picocolors_1.default.green('🔗 Please visit the following URL to authorize this device:')));
    console.log(picocolors_1.default.cyan(mockCodeResponse.verification_uri));
    console.log('\nAnd enter the code: ' + picocolors_1.default.bold(picocolors_1.default.bgYellow(picocolors_1.default.black(` ${mockCodeResponse.user_code} `))) + '\n');
    // Attempt to open the browser automatically
    try {
        await openBrowser(mockCodeResponse.verification_uri);
        console.log(picocolors_1.default.gray('(Your browser should have opened automatically)'));
    }
    catch (e) {
        // ignore
    }
    // Poll until authorized.
    console.log(picocolors_1.default.cyan('⏳ Waiting for authorization...'));
    // Mock polling logic that succeeds after a few seconds to simulate user action
    const token = await mockPolling(mockCodeResponse.interval);
    // Save token locally
    await (0, config_1.writeConfig)({ accessToken: token });
    console.log(picocolors_1.default.green('\n✅ Successfully logged in!'));
    return token;
}
// Mock function replacing the actual setInterval/fetch loop
function mockPolling(intervalSeconds) {
    return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            process.stdout.write(picocolors_1.default.gray('.')); // Print dots to show it's polling
            // Simulate user approving after 2 polling attempts
            if (attempts >= 2) {
                clearInterval(interval);
                resolve('mock_access_token_abc123');
            }
        }, intervalSeconds * 1000);
    });
}
