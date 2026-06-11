/**
 * content.js — Laravel Auto Login Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Injected by Chrome on:
 *   http://127.0.0.1:8000/login
 *   http://localhost:8000/login
 *
 * Behaviour:
 *   1. Locate the email field, password field, and login button.
 *   2. Fill the hard-coded test credentials.
 *   3. Dispatch synthetic input / change events so Laravel's Blade form (and
 *      any potential JS validation) correctly detects the new values.
 *   4. Wait ~1 second (gives the page time to settle), then click the button.
 */

console.log('[AutoLogin] Laravel Auto Login Extension Loaded');

// ─── Helper: set an input value and fire the events frameworks expect ────────
function setInputValue(element, value) {
    // Use the native input-value setter so React-style frameworks also pick it up
    const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeSetter.call(element, value);

    // Dispatch both 'input' and 'change' events
    element.dispatchEvent(new Event('input',  { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

// ─── Main auto-login logic ───────────────────────────────────────────────────
function attemptAutoLogin() {
    const emailField    = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const loginBtn      = document.getElementById('loginBtn');

    // Guard: all three elements must exist before proceeding
    if (!emailField || !passwordField || !loginBtn) {
        console.warn('[AutoLogin] Login fields not found — check that #email, #password and #loginBtn exist on the page.');
        return;
    }

    // ── Fill credentials ─────────────────────────────────────────────────────
    setInputValue(emailField,    'admin@tool.com');
    setInputValue(passwordField, '123');

    console.log('[AutoLogin] Fields filled — email: admin@tool.com | password: ******');

    // ── Wait 1 s then click (DISABLED to allow choosing between Admin and User) ──
    // The short delay ensures any CSS animations / JS listeners on the page
    // have fully initialised before we trigger the submit.
    setTimeout(function () {
        // loginBtn.click();
        console.log('[AutoLogin] Auto-submit disabled. Please click Sign in manually or change credentials.');
    }, 1000);
}

// Run after the DOM is idle (run_at: document_idle guarantees this, but the
// check adds a clear safety net if the script is ever invoked another way).
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptAutoLogin);
} else {
    attemptAutoLogin();
}
