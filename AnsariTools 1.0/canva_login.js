/**
 * canva_login.js — AI Tools Auto Login (with Premium Secure Loader Overlay)
 * ─────────────────────────────────────────────────────────────────────
 * Premium loading overlay blocks the automation steps from the user.
 * Runs at document_start to guarantee no flash of credentials or login form.
 */

console.log('[AI Tools Canva] Script loaded on:', window.location.href);

const CREDENTIAL_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STEP_DELAY_MS     = 1200;           // delay between steps

// ─── Loader Overlay Functions ───────────────────────────────────────────────
function injectLoader(brandColor = '#7c3aed', brandIcon = '🎨', toolName = 'Canva Pro') {
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
            console.log('[AI Tools Canva] Captcha/Challenge detected! Hiding overlay.');
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
function setNativeValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(element, value);

    element.dispatchEvent(new Event('input',  { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// ─── Utility: wait for element to appear in DOM ───────────────────────────
function waitForElement(selector, callback, timeoutMs = 12000) {
    const existing = document.querySelector(selector);
    if (existing && existing.offsetParent !== null) { callback(existing); return; }

    const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
            observer.disconnect();
            callback(el);
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), timeoutMs);
}

// ─── Utility: find visible button by text ────────────────────────────────
function findVisibleButton(textPatterns) {
    const allBtns = document.querySelectorAll('button, [role="button"], a[href]');
    for (const btn of allBtns) {
        if (btn.offsetParent === null) continue; // skip hidden
        const text = (btn.textContent || btn.innerText || '').toLowerCase().trim();
        for (const pattern of textPatterns) {
            if (text.includes(pattern)) return btn;
        }
    }
    return null;
}

// ─── Check if user is logged in ──────────────────────────────────────────
function isLoggedIn() {
    const path = window.location.pathname;
    return !path.includes('/login') && !path.includes('/signup');
}

// ─── Canva Login Sequence ────────────────────────────────────────────────
function startCanvaLogin(email, password) {
    console.log('[AI Tools Canva] Starting login sequence…');
    updateLoaderStatus('Entering email address...');

    const emailSelectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="email" i]',
        'input[autocomplete="email"]',
        '#email',
    ];

    const tryStep1 = () => {
        for (const sel of emailSelectors) {
            const input = document.querySelector(sel);
            if (input && input.offsetParent !== null) {
                input.focus();
                setNativeValue(input, email);
                console.log('[AI Tools Canva] Email filled.');

                setTimeout(() => {
                    const continueBtn =
                        findVisibleButton(['continue with email']) ||
                        findVisibleButton(['continue', 'next', 'log in', 'sign in']);

                    if (continueBtn) {
                        continueBtn.click();
                        console.log('[AI Tools Canva] Continue clicked');
                        waitForStep2(password);
                    } else {
                        setTimeout(() => {
                            const btn2 = findVisibleButton(['continue', 'next', 'log in', 'sign in']);
                            if (btn2) { btn2.click(); waitForStep2(password); }
                        }, 1500);
                    }
                }, 800);

                return true;
            }
        }
        return false;
    };

    if (!tryStep1()) {
        waitForElement('input[type="email"]', () => {
            setTimeout(tryStep1, 400);
        });
    }
}

// ─── Step 2: wait for password field and fill it ───────────────────────────
function waitForStep2(password) {
    console.log('[AI Tools Canva] Waiting for password field…');
    updateLoaderStatus('Entering password...');

    waitForElement('input[type="password"]', (passInput) => {
        setTimeout(() => {
            passInput.focus();
            setNativeValue(passInput, password);
            console.log('[AI Tools Canva] Password filled.');

            setTimeout(() => {
                const submitBtn =
                    findVisibleButton(['log in', 'login', 'sign in', 'continue', 'submit']) ||
                    document.querySelector('button[type="submit"]');

                if (submitBtn) {
                    submitBtn.click();
                    console.log('[AI Tools Canva] Login submitted — authenticating...');
                    updateLoaderStatus('Establishing secure session...');
                } else {
                    passInput.dispatchEvent(new KeyboardEvent('keypress', {
                        key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
                    }));
                }
            }, 800);
        }, 500);
    }, 10000);
}

// ─── Entry Point ──────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'CHECK_CLEAR_STORAGE', tool: 'canva' }, (response) => {
    console.log('[AI Tools Canva] Storage clear check response:', response);

    chrome.storage.local.get('pendingLogin', (data) => {
        if (!data.pendingLogin) return;

        const login = data.pendingLogin;
        if (login.tool !== 'canva') return;

        // Check age
        const ageMs = Date.now() - (login.timestamp || 0);
        if (ageMs > CREDENTIAL_TTL_MS) {
            chrome.storage.local.remove('pendingLogin');
            return;
        }

        console.log('[AI Tools Canva] 🟢 Pending login detected.');

        // Inject the loader immediately
        injectLoader('#7c3aed', '🎨', 'Canva Pro');

        // 15-second safeguard timeout
        setTimeout(() => {
            console.warn('[AI Tools Canva] Safeguard timeout reached. Hiding overlay.');
            dismissLoader();
        }, 15000);

        // Captcha detection interval
        setInterval(checkForCaptchas, 500);

        // Check if we are already logged in (landing page or dashboard page)
        if (isLoggedIn()) {
            console.log('[AI Tools Canva] Already logged in. Success!');
            showLoaderSuccess(() => {
                chrome.storage.local.remove('pendingLogin');
                chrome.runtime.sendMessage({ type: 'LOGIN_COMPLETE' });
            });
            return;
        }

        // Wait for DOM and start login
        if (document.readyState === 'complete') {
            setTimeout(() => startCanvaLogin(login.email, login.password), STEP_DELAY_MS);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => startCanvaLogin(login.email, login.password), STEP_DELAY_MS);
            });
        }
    });
});
