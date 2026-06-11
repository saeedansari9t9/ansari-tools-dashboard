/**
 * dashboard_bridge.js — AI Tools Auto Login
 * ─────────────────────────────────────────────────────────────────────
 * Runs on: http://127.0.0.1:8000/*  and  http://localhost:8000/*
 *
 * Two methods supported:
 *   METHOD 1 (Cookie Injection): If tool has session_cookies configured →
 *             inject cookies directly → open tool (INSTANT, no login form)
 *   METHOD 2 (Email/Password):   Fallback — clear cookies, store credentials,
 *             open login URL, content script fills the form automatically
 */
console.log('[AI Tools Bridge] Loaded on:', window.location.pathname);

// Confirm to dashboard that extension is active
window.postMessage({ type: 'AI_TOOL_BRIDGE_READY' }, window.location.origin);
window.postMessage({ type: 'AI_TOOL_BRIDGE_READY' }, '*');

// Expose DOM attributes so React can check immediately on mount
document.documentElement.dataset.ansariExtensionInstalled = "true";

// Also listen for a ping request from the React page in case React loads later
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'PING_AI_TOOL_BRIDGE') {
        window.postMessage({ type: 'AI_TOOL_BRIDGE_READY' }, '*');
    }
});

// ─── Relay SESSION_CAPTURED from background → dashboard page ─────────────────
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SESSION_CAPTURED') {
        window.postMessage(
            { type: 'AI_TOOL_SESSION_CAPTURED', tool: msg.tool, count: msg.count },
            window.location.origin
        );
    }
});

// ─── Handle Access Redirect Page (Toolstakes-style cookie injector) ──────────
const TOOL_DASHBOARD_URLS = {
    chatgpt: 'https://chatgpt.com/',
    canva: 'https://www.canva.com/',
};

if (window.location.pathname.includes('/access/')) {
    (async () => {
        console.log('[AI Tools Bridge] Access redirect page detected — starting injection flow');
        
        // Wait for secure-session-data to appear in DOM since bridge runs at document_start
        let dataElement = null;
        let attempts = 0;
        
        while (!dataElement && attempts < 100) {
            dataElement = document.getElementById('secure-session-data');
            if (!dataElement) {
                await new Promise(resolve => setTimeout(resolve, 30));
                attempts++;
            }
        }

        if (!dataElement) {
            console.error('[AI Tools Bridge] secure-session-data element not found after polling');
            // Try fallback DOMContentLoaded if still not found
            if (document.readyState === 'loading') {
                await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
                dataElement = document.getElementById('secure-session-data');
            }
        }

        if (!dataElement) {
            console.error('[AI Tools Bridge] Failed to locate secure session elements.');
            return;
        }

        const tool = dataElement.getAttribute('data-tool');
        const rawCookies = dataElement.getAttribute('data-cookies');
        if (!rawCookies) {
            console.error('[AI Tools Bridge] data-cookies attribute is empty');
            return;
        }

        let cookies = [];
        try {
            cookies = JSON.parse(rawCookies);
        } catch (e) {
            console.error('[AI Tools Bridge] Failed to parse cookies JSON:', e);
            return;
        }

        if (cookies.length === 0) {
            console.warn('[AI Tools Bridge] No cookies found for:', tool);
            return;
        }

        const targetUrl = TOOL_DASHBOARD_URLS[tool] || 'https://chatgpt.com/';

        console.log(`[AI Tools Bridge] Injecting ${cookies.length} cookies for: ${tool}`);
        
        // Request background script to inject cookies
        chrome.runtime.sendMessage({
            type: 'INJECT_COOKIES_ONLY',
            cookies: cookies,
            tool: tool,
            clearUrl: targetUrl
        }, (res) => {
            const fetchAndLogLogs = (isSuccess) => {
                chrome.runtime.sendMessage({ type: 'GET_DEBUG_LOGS' }, (logRes) => {
                    const logs = logRes?.logs || [];
                    console.group(`[AI Tools Bridge] Extension Debug Logs (${isSuccess ? 'Success' : 'Failure'})`);
                    logs.forEach(l => console.log(l));
                    console.groupEnd();

                    // Put logs in the page DOM so the blade template can show them if needed
                    const logContainer = document.getElementById('debug-log-list');
                    if (logContainer) {
                        logContainer.innerHTML = '';
                        logs.forEach(l => {
                            const li = document.createElement('li');
                            li.textContent = l;
                            li.style.textAlign = 'left';
                            li.style.fontFamily = 'monospace';
                            li.style.fontSize = '0.75rem';
                            li.style.marginBottom = '4px';
                            li.style.whiteSpace = 'pre-wrap';
                            li.style.wordBreak = 'break-all';
                            li.style.color = l.includes('❌') ? '#f87171' : (l.includes('✅') ? '#34d399' : '#d1d5db');
                            logContainer.appendChild(li);
                        });
                    }
                });
            };

            if (res && res.ok) {
                console.log('[AI Tools Bridge] Cookies injected successfully! Redirecting...');
                fetchAndLogLogs(true);
                const statusText = document.getElementById('status-text');
                if (statusText) statusText.textContent = 'Session injected! Loading tool...';
                
                const urlParams = new URLSearchParams(window.location.search);
                const debugMode = urlParams.has('debug');

                if (debugMode) {
                    if (statusText) {
                        statusText.style.color = '#34d399';
                        statusText.textContent = 'Debug Mode: Cookies injected. Redirect paused.';
                    }
                    const debugSection = document.getElementById('debug-section');
                    if (debugSection) {
                        debugSection.style.display = 'block';
                    }
                } else {
                    // Redirect to the tool's main dashboard after a small delay
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 1200);
                }
            } else {
                console.error('[AI Tools Bridge] Cookie injection failed');
                fetchAndLogLogs(false);
                const statusText = document.getElementById('status-text');
                if (statusText) {
                    statusText.style.color = '#ef4444';
                    statusText.textContent = '❌ Failed to inject session. Try again.';
                }
                const debugSection = document.getElementById('debug-section');
                if (debugSection) {
                    debugSection.style.display = 'block';
                }
            }
        });
    })();
}

// ─── Handle "Setup Account" from dashboard ────────────────────────────────
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'AI_TOOL_SETUP_CAPTURE') {
        const tool = event.data.tool || 'chatgpt';
        chrome.runtime.sendMessage({ type: 'SETUP_CAPTURE', tool }, (res) => {
            console.log('[AI Tools Bridge] Capture started for:', tool, res);
        });
    }

    if (event.data && event.data.type === 'AI_TOOL_START_AUTO_SETUP') {
        const { tool, email, password, url } = event.data;
        console.log('[AI Tools Bridge] Starting automated setup for:', tool);
        
        // Clear cookies via background script first to prevent premature captures
        chrome.runtime.sendMessage({ type: 'CLEAR_TOOL_COOKIES' }, () => {
            // Store credentials in storage, and flag capture mode
            chrome.storage.local.set({
                pendingLogin: { tool, email, password, url, step: 'start', timestamp: Date.now() },
                captureSession: { tool, timestamp: Date.now() }
            }, () => {
                // Tell background to open the login tab
                chrome.runtime.sendMessage({ type: 'OPEN_TOOL_TAB', url }, () => {
                    console.log('[AI Tools Bridge] Setup tab opened.');
                });
            });
        });
    }

    if (event.data && event.data.type === 'AI_TOOL_GET_COOKIES') {
        const tool = event.data.tool || 'chatgpt';
        chrome.runtime.sendMessage({ type: 'GET_CHATGPT_COOKIES' }, (res) => {
            window.postMessage({
                type: 'AI_TOOL_GOT_COOKIES',
                tool: tool,
                ok: res?.ok || false,
                cookies: res?.cookies || []
            }, window.location.origin);
        });
    }

    if (event.data && event.data.type === 'AI_TOOL_GET_DEBUG_LOGS') {
        chrome.runtime.sendMessage({ type: 'GET_DEBUG_LOGS' }, (res) => {
            window.postMessage({
                type: 'AI_TOOL_GOT_DEBUG_LOGS',
                logs: res?.logs || []
            }, window.location.origin);
        });
    }
});

// ─── Session cookie domains per tool (for METHOD 2 cleanup only) ──────────
const TOOL_COOKIE_URLS = {
    chatgpt: [
        'https://chatgpt.com',
        'https://chat.openai.com',
        // DO NOT include auth.openai.com — breaks auth flow (HTTP 500)
    ],
    canva: [
        'https://www.canva.com',
        'https://canva.com',
    ],
};

// ─── Clear session cookies for a tool domain (METHOD 2 only) ─────────────
async function clearSessionCookies(tool) {
    const urls = TOOL_COOKIE_URLS[tool] || [];
    let total = 0;
    for (const url of urls) {
        try {
            const cookies = await chrome.cookies.getAll({ url });
            for (const c of cookies) {
                const scheme = c.secure ? 'https' : 'http';
                const domain = c.domain.replace(/^\./, '');
                await chrome.cookies.remove({ url: `${scheme}://${domain}${c.path}`, name: c.name });
                total++;
            }
        } catch (e) {
            console.warn(`[AI Tools Bridge] Cookie clear failed for ${url}:`, e.message);
        }
    }
    console.log(`[AI Tools Bridge] Cleared ${total} cookies for "${tool}"`);
}

// ─── Main: listen for Access button postMessage ───────────────────────────
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== 'AI_TOOL_ACCESS') return;

    const { tool, email, password, url, cookies } = event.data;
    if (!tool || !url) return;

    console.log(`[AI Tools Bridge] 🔑 Access: "${tool}"`);

    // ══════════════════════════════════════════════════════════════════
    //  METHOD 1: Cookie Injection (INSTANT — Toolstakes style)
    //  Used when admin has stored session_cookies in web.php
    // ══════════════════════════════════════════════════════════════════
    if (cookies && cookies.length > 0) {
        console.log(`[AI Tools Bridge] 🍪 Method: Cookie Injection (${cookies.length} cookies)`);

        chrome.runtime.sendMessage({
            type:     'INJECT_COOKIES_AND_OPEN',
            cookies:  cookies,
            url:      'https://chatgpt.com',   // land here after injection
            clearUrl: 'https://chatgpt.com',   // clear this domain first
        }, (response) => {
            console.log('[AI Tools Bridge] ✅ Cookie injection dispatched:', response);
        });

        // Confirm to blade page that extension handled it
        window.postMessage({ type: 'AI_TOOL_TAB_OPENING', tool }, window.location.origin);
        return;
    }

    // ══════════════════════════════════════════════════════════════════
    //  METHOD 2: Email/Password Login Flow (fallback)
    // ══════════════════════════════════════════════════════════════════
    if (!email) {
        console.warn('[AI Tools Bridge] No cookies and no email — cannot proceed.');
        return;
    }

    console.log(`[AI Tools Bridge] 📧 Method: Email/Password for ${email}`);

    // 1) Clear existing session via background script to bypass content script limits
    chrome.runtime.sendMessage({ type: 'CLEAR_TOOL_COOKIES' }, async () => {
        // 2) Store credentials (content script on login page will read these)
        await chrome.storage.local.set({
            pendingLogin: { tool, email, password, url, step: 'start', timestamp: Date.now() }
        });

        // 3) Tell background to open the login tab
        chrome.runtime.sendMessage({ type: 'OPEN_TOOL_TAB', url }, () => {
            console.log('[AI Tools Bridge] ✅ Login tab opening for:', tool);
        });

        // 4) Confirm to blade page
        window.postMessage({ type: 'AI_TOOL_TAB_OPENING', tool }, window.location.origin);
    });
});
