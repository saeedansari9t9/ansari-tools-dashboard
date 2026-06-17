/**
 * chatgpt_capture.js — Session Cookie Capture
 * ─────────────────────────────────────────────────────────────────────
 * Runs on chatgpt.com when "Setup Account" button is clicked.
 * After user logs in manually, this captures session cookies
 * and saves them to Laravel backend — enabling instant cookie injection.
 */

const BACKEND_URL = 'http://127.0.0.1:8000';

// Check if we're in capture mode
chrome.storage.local.get('captureSession', (data) => {
    if (!data.captureSession) return;
    if (data.captureSession.tool !== 'chatgpt') return;

    console.log('[AI Tools Capture] 🎯 Capture mode active — waiting for login...');

    // Function to check if logged in via cookies in background
    function checkLoginState() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'CHECK_LOGGED_IN' }, (res) => {
                resolve(!!res?.loggedIn);
            });
        });
    }

    // Poll until user is logged in
    let attempts = 0;
    const pollInterval = setInterval(async () => {
        attempts++;
        
        const loggedIn = await checkLoginState();

        if (loggedIn) {
            clearInterval(pollInterval);
            console.log('[AI Tools Capture] ✅ User logged in — waiting 6 seconds for session and redirections to settle...');
            setTimeout(() => {
                console.log('[AI Tools Capture] 🎯 Capturing cookies now...');
                captureAndSave();
            }, 6000);
        } else if (attempts > 120) { // 2 minutes timeout
            clearInterval(pollInterval);
            console.warn('[AI Tools Capture] Timeout — no login detected.');
        }
    }, 1500);
});

async function captureAndSave() {
    try {
        // Read chatgpt.com cookies via background
        const cookies = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { type: 'GET_CHATGPT_COOKIES' },
                (response) => resolve(response?.cookies || [])
            );
        });

        if (cookies.length === 0) {
            console.warn('[AI Tools Capture] No cookies found!');
            return;
        }

        console.log(`[AI Tools Capture] Got ${cookies.length} cookies — saving to backend...`);

        // Format cookies for backend, preserving sameSite, hostOnly, and expirationDate
        const formatted = cookies.map(c => ({
            name:           c.name,
            value:          c.value,
            domain:         c.domain,
            path:           c.path,
            secure:         c.secure,
            httpOnly:       c.httpOnly,
            hostOnly:       c.hostOnly,
            sameSite:       c.sameSite,
            expirationDate: c.expirationDate,
            url:            'https://chatgpt.com',
        }));

        // Save to Laravel backend via background script to bypass CORS/PNA
        chrome.runtime.sendMessage({
            type: 'SAVE_SESSION_TO_BACKEND',
            tool: 'chatgpt',
            cookies: formatted,
            url: `${BACKEND_URL}/api/save-session`
        }, (res) => {
            if (res && res.ok && res.result && res.result.ok) {
                console.log(`[AI Tools Capture] ✅ Saved ${res.result.saved} cookies to backend!`);
                // Clear capture mode
                chrome.storage.local.remove('captureSession');
                // Notify background to show success
                chrome.runtime.sendMessage({ type: 'CAPTURE_COMPLETE', tool: 'chatgpt', count: res.result.saved });
            } else {
                console.error('[AI Tools Capture] Save failed:', res?.error || res?.result?.error || 'Unknown error');
            }
        });
    } catch (e) {
        console.error('[AI Tools Capture] Error:', e.message);
    }
}
