/**
 * chatgpt_login.js — AI Tools Auto Login (with Premium Secure Loader Overlay)
 * ─────────────────────────────────────────────────────────────────────
 * Premium loading overlay blocks the automation steps from the user.
 * Runs at document_start to guarantee no flash of credentials or login form.
 */

console.log('[AI Tools ChatGPT] Script loaded on:', window.location.href);

const CREDENTIAL_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Loader Overlay Functions ───────────────────────────────────────────────
function injectLoader(brandColor = '#10b981', brandIcon = '🤖', toolName = 'ChatGPT Plus') {
    if (document.getElementById('ai-secure-loader')) return;

    // Inject Style
    const styleEl = document.createElement('style');
    styleEl.id = 'ai-secure-loader-style';
    styleEl.textContent = `
        #ai-secure-loader {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: #080d1a;
            display: flex; align-items: center; justify-content: center;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #e2e8f0;
            opacity: 1;
            transition: opacity 0.5s ease;
        }
        #ai-secure-loader .loader-card {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 40px;
            width: 380px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            display: flex; flex-direction: column; align-items: center;
            animation: loaderFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        #ai-secure-loader .loader-brand-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: loaderBounce 2s ease-in-out infinite;
        }
        #ai-secure-loader .loader-title {
            font-size: 20px; font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
        }
        #ai-secure-loader .loader-subtitle {
            font-size: 13px; color: #94a3b8;
            margin-bottom: 28px;
        }
        #ai-secure-loader .loader-spinner-container {
            position: relative;
            width: 60px; height: 60px;
            margin-bottom: 28px;
            display: flex; align-items: center; justify-content: center;
        }
        #ai-secure-loader .loader-spinner {
            box-sizing: border-box;
            width: 100%; height: 100%;
            border: 3px solid rgba(255, 255, 255, 0.03);
            border-radius: 50%;
            border-top-color: ${brandColor};
            animation: loaderSpin 1s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
        }
        #ai-secure-loader .loader-success-checkmark {
            display: none;
            font-size: 54px;
            color: #10b981;
            line-height: 1;
        }
        #ai-secure-loader .loader-status {
            font-size: 12px; color: #64748b;
            font-weight: 500;
            min-height: 18px;
        }
        @keyframes loaderSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes loaderBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes loaderFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        #ai-secure-loader.fade-out {
            opacity: 0 !important;
            pointer-events: none;
        }
    `;
    
    // Append to documentElement because body might not exist yet at document_start
    document.documentElement.appendChild(styleEl);

    const loaderEl = document.createElement('div');
    loaderEl.id = 'ai-secure-loader';
    loaderEl.innerHTML = `
        <div class="loader-card">
            <div class="loader-brand-icon">${brandIcon}</div>
            <div class="loader-title">Secure Gateway</div>
            <div class="loader-subtitle">Connecting to ${toolName} securely...</div>
            <div class="loader-spinner-container">
                <div class="loader-spinner" id="ai-loader-spinner"></div>
                <div class="loader-success-checkmark" id="ai-loader-check">✓</div>
            </div>
            <div class="loader-status" id="ai-loader-status">Initializing secure session...</div>
        </div>
    `;
    document.documentElement.appendChild(loaderEl);
}

function updateLoaderStatus(statusText) {
    const statusEl = document.getElementById('ai-loader-status');
    if (statusEl) {
        statusEl.textContent = statusText;
    }
}

function showLoaderSuccess(callback) {
    const spinner = document.getElementById('ai-loader-spinner');
    const check = document.getElementById('ai-loader-check');
    const statusEl = document.getElementById('ai-loader-status');
    const loader = document.getElementById('ai-secure-loader');

    if (spinner) spinner.style.display = 'none';
    if (check) check.style.display = 'block';
    if (statusEl) statusEl.textContent = 'Access Granted! Session secured.';

    setTimeout(() => {
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.remove();
                const styleEl = document.getElementById('ai-secure-loader-style');
                if (styleEl) styleEl.remove();
                if (callback) callback();
            }, 500);
        } else if (callback) {
            callback();
        }
    }, 1500);
}

function dismissLoader() {
    const loader = document.getElementById('ai-secure-loader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.remove();
            const styleEl = document.getElementById('ai-secure-loader-style');
            if (styleEl) styleEl.remove();
        }, 500);
    }
}

// ─── Captcha / Cloudflare Safeguard ──────────────────────────────────────────
function checkForCaptchas() {
    const captchaSelectors = [
        'iframe[src*="challenges.cloudflare.com"]',
        '#challenge-form',
        '#challenge-stage',
        '.g-recaptcha',
        'iframe[title*="reCAPTCHA" i]',
        'iframe[src*="recaptcha"]'
    ];
    for (const sel of captchaSelectors) {
        if (document.querySelector(sel)) {
            console.log('[AI Tools ChatGPT] Captcha/Challenge detected! Hiding overlay.');
            const loader = document.getElementById('ai-secure-loader');
            if (loader && loader.style.display !== 'none') {
                loader.style.display = 'none'; // hide it so user can solve it
            }
            return true;
        }
    }
    return false;
}

// ─── Utility: set native input value + fire events ────────────────────────
function setNativeValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// ─── Utility: wait for element to appear in DOM ───────────────────────────
function waitForElement(selector, callback, timeoutMs = 12000) {
    const existing = document.querySelector(selector);
    if (existing && existing.offsetHeight > 0) { callback(existing); return; }

    const obs = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el && el.offsetHeight > 0) { obs.disconnect(); callback(el); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), timeoutMs);
}

// ─── Utility: find visible button by text ────────────────────────────────
function findVisibleButton(patterns) {
    const els = document.querySelectorAll('button, [role="button"], a, [role="menuitem"]');
    for (const el of els) {
        if (el.offsetHeight === 0 && !el.offsetParent) continue;
        const txt = (el.textContent || el.innerText || el.getAttribute('aria-label') || '').toLowerCase().trim();
        if (patterns.some(p => txt.includes(p))) return el;
    }
    return null;
}

// ─── Check if ChatGPT chat interface is active ───────────────────────────
async function isLoggedIn() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'CHECK_LOGGED_IN' }, (res) => {
            resolve(!!res?.loggedIn);
        });
    });
}

// ─── STATE: email page on auth.openai.com ────────────────────────────────
function handleEmailPage(email) {
    console.log('[AI Tools ChatGPT] State: EMAIL — filling…');
    updateLoaderStatus('Entering email address...');

    const selectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[type="email"]',
        'input[id="username"]',
        'input[autocomplete="email"]',
        'input[autocomplete="username email"]',
    ];

    const tryFill = () => {
        for (const sel of selectors) {
            const input = document.querySelector(sel);
            if (input && input.offsetHeight > 0) {
                input.focus();
                setNativeValue(input, email);
                console.log('[AI Tools ChatGPT] Email filled.');

                setTimeout(() => {
                    const btn = document.querySelector('button[type="submit"]')
                              || findVisibleButton(['continue', 'next', 'log in']);
                    if (btn) {
                        btn.click();
                        console.log('[AI Tools ChatGPT] Continue clicked');
                    } else {
                        input.dispatchEvent(new KeyboardEvent('keypress', {
                            key: 'Enter', keyCode: 13, bubbles: true
                        }));
                    }
                }, 800);
                return true;
            }
        }
        return false;
    };

    if (!tryFill()) {
        waitForElement('input[name="username"]', () => setTimeout(tryFill, 400));
    }
}

// ─── STATE: password page on auth.openai.com ─────────────────────────────
function handlePasswordPage(password) {
    console.log('[AI Tools ChatGPT] State: PASSWORD — filling…');
    updateLoaderStatus('Entering password...');

    const passSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="password"]',
        'input[id="password"]',
    ];

    const tryFill = () => {
        let input = null;
        for (const sel of passSelectors) {
            const el = document.querySelector(sel);
            if (el && el.offsetHeight > 0) { input = el; break; }
        }

        if (!input) return false;

        input.focus();
        input.click();
        setNativeValue(input, password);
        console.log('[AI Tools ChatGPT] Password filled.');

        setTimeout(() => {
            const submitBtn =
                document.querySelector('button[type="submit"]') ||
                document.querySelector('button[name="action"][value="default"]') ||
                findVisibleButton(['continue', 'log in', 'sign in', 'submit']);

            if (submitBtn) {
                submitBtn.click();
                console.log('[AI Tools ChatGPT] Submit clicked — authenticating...');
                updateLoaderStatus('Establishing secure session...');
            } else {
                input.dispatchEvent(new KeyboardEvent('keypress', {
                    key: 'Enter', keyCode: 13, bubbles: true
                }));
            }
        }, 1000);

        return true;
    };

    if (!tryFill()) {
        let attempts = 0;
        const retry = setInterval(() => {
            if (tryFill() || ++attempts >= 15) clearInterval(retry);
        }, 600);
    }
}

// ─── Main page router ─────────────────────────────────────────────────────
async function routePage(login) {
    const url  = window.location.href;
    console.log('[AI Tools ChatGPT] Route | url:', url.split('?')[0]);

    // Check for success on logged in homepage
    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
            console.log('[AI Tools ChatGPT] Login successful! Removing loader overlay.');
            showLoaderSuccess(() => {
                chrome.storage.local.remove('pendingLogin');
                chrome.runtime.sendMessage({ type: 'LOGIN_COMPLETE' });
            });
            return;
        }
    }

    // ── auth.openai.com/email-verification — "Check your inbox" page ─────────
    if (url.includes('email-verification') || url.includes('email_verification')) {
        console.log('[AI Tools ChatGPT] Email verification page — clicking "Continue with password"…');
        updateLoaderStatus('Selecting password login...');

        // Extended list of button patterns OpenAI uses (UI changes over time)
        const PASSWORD_BTN_PATTERNS = [
            'continue with password',
            'use password',
            'with password',
            'password instead',
            'sign in with password',
            'use a password',
            'enter password',
        ];

        let attempts = 0;
        const tryClick = () => {
            attempts++;
            const btn = findVisibleButton(PASSWORD_BTN_PATTERNS);
            if (btn) {
                btn.click();
                console.log('[AI Tools ChatGPT] ✅ Clicked "Continue with password"');
                updateLoaderStatus('Switching to password...');
            } else if (attempts < 20) {
                setTimeout(tryClick, 800);
            } else {
                console.warn('[AI Tools ChatGPT] Password button not found — dismissing loader');
                dismissLoader();
            }
        };

        setTimeout(tryClick, 1500);
        return;
    }

    // ── auth.openai.com/log-in/password — PASSWORD PAGE (after "Continue with password") ──
    if (url.includes('log-in/password') || url.includes('login/password')) {
        console.log('[AI Tools ChatGPT] State: PASSWORD PAGE — filling password…');
        updateLoaderStatus('Entering password...');
        setTimeout(() => handlePasswordPage(login.password), 1200);
        return;
    }

    // ── auth.openai.com — email or password form (generic fallback) ────────────
    if (url.includes('auth.openai.com') || url.includes('/authorize')) {
        setTimeout(() => {
            if (document.querySelector('input[type="password"]')) {
                handlePasswordPage(login.password);
            } else {
                handleEmailPage(login.email);
            }
        }, 1500);
        return;
    }

    // ── chatgpt.com/auth/login — THE ACTUAL LOGIN FORM ────────────────────
    if (url.includes('chatgpt.com/auth/login') || url.includes('chat.openai.com/auth/login')) {
        console.log('[AI Tools ChatGPT] On /auth/login page — waiting for redirect…');
        updateLoaderStatus('Contacting identity provider...');
        setTimeout(() => {
            if (document.querySelector('input[type="password"]')) {
                handlePasswordPage(login.password);
            } else {
                handleEmailPage(login.email);
            }
        }, 1500);
        return;
    }

    // ── chatgpt.com/auth/logout|callback|session — passthrough redirects ──
    if (/chatgpt\.com\/auth\/(logout|callback|session|csrf)/.test(url)) {
        updateLoaderStatus('Securing session tokens...');
        return;
    }

    // ── chatgpt.com homepage (logged out) ──────────────────────────────────
    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
        console.log('[AI Tools ChatGPT] On homepage (logged out) → redirecting to login gateway.');
        updateLoaderStatus('Opening secure gateway...');
        setTimeout(() => {
            window.location.href = 'https://chatgpt.com/auth/login';
        }, 1500);
        return;
    }
}

// ─── Entry point ──────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'CHECK_CLEAR_STORAGE', tool: 'chatgpt' }, (response) => {
    console.log('[AI Tools ChatGPT] Storage clear check response:', response);

    // Retrieve and print background debug logs for inspection
    chrome.storage.local.get('debugLogs', (logData) => {
        console.group('[AI Tools Extension Debug Logs]');
        if (logData && logData.debugLogs) {
            logData.debugLogs.forEach(l => console.log(l));
        } else {
            console.log('No debug logs found in storage.');
        }
        console.groupEnd();
    });

    chrome.storage.local.get('pendingLogin', (data) => {
        if (!data.pendingLogin) return; // no pending login, do nothing

        const login = data.pendingLogin;
        if (login.tool !== 'chatgpt') return;

        const ageMs = Date.now() - (login.timestamp || 0);
        if (ageMs > CREDENTIAL_TTL_MS) {
            chrome.storage.local.remove('pendingLogin');
            console.warn('[AI Tools ChatGPT] Credentials expired — cleared.');
            return;
        }

        console.log('[AI Tools ChatGPT] 🟢 Pending login detected.');

        // Inject the loader immediately (runs at document_start)
        injectLoader('#10b981', '🤖', 'ChatGPT Plus');

        // 15-second safeguard timeout to prevent lockouts
        setTimeout(() => {
            console.warn('[AI Tools ChatGPT] Safeguard timeout reached. Hiding overlay.');
            dismissLoader();
        }, 15000);

        // Captcha detection interval
        setInterval(checkForCaptchas, 500);

        // Route page
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            routePage(login);
        } else {
            window.addEventListener('DOMContentLoaded', () => routePage(login));
        }
    });
});
