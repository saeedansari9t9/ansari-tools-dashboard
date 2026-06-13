/**
 * background.js — AI Tools Auto Login
 * ─────────────────────────────────────────────────────────────────────
 * Service worker. Handles:
 *   1. INJECT_COOKIES_AND_OPEN — injects session cookies → opens tool (Toolstakes method)
 *   2. OPEN_TOOL_TAB           — opens tool URL (email/pass fallback)
 *   3. LOGIN_COMPLETE          — brings tab to front after form login
 */

async function logDebug(message) {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${message}`;
    console.log(formatted);
    try {
        const data = await chrome.storage.local.get('debugLogs');
        const logs = data.debugLogs || [];
        logs.push(formatted);
        if (logs.length > 500) logs.shift();
        await chrome.storage.local.set({ debugLogs: logs });
    } catch (e) {
        console.error('Failed to write debug log:', e);
    }
}

async function clearAllCookiesForDomain(baseDomain) {
    try {
        const allCookies = await chrome.cookies.getAll({});
        const existing = allCookies.filter(c => c.domain.includes(baseDomain));
        await logDebug(`Querying cookies for domain: ${baseDomain} (found ${existing.length} cookies to clear)`);
        for (const c of existing) {
            const scheme = c.secure ? 'https' : 'http';
            const domain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
            const removeUrl = `${scheme}://${domain}${c.path}`;
            const removeDetails = {
                url:  removeUrl,
                name: c.name
            };
            if (c.partitionKey) {
                removeDetails.partitionKey = c.partitionKey;
            }
            if (c.storeId) {
                removeDetails.storeId = c.storeId;
            }
            try {
                await chrome.cookies.remove(removeDetails);
            } catch (err) {
                await logDebug(`Warning clearing cookie ${c.name} on ${removeUrl}: ${err.message}`);
            }
        }
    } catch (e) {
        await logDebug(`Error clearing cookies for domain ${baseDomain}: ${e.message}`);
    }
}

function getCanonicalToolKey(toolName) {
    if (!toolName) return '';
    const normalized = toolName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const map = {
        chatgpt: 'chatgpt',
        openai: 'chatgpt',
        canva: 'canva',
        canvapro: 'canva',
        gemini: 'gemini',
        google: 'gemini',
        geminigoogle: 'gemini',
        quillbot: 'quillbot',
        quilbot: 'quillbot',
        grammarly: 'grammarly',
        grammerly: 'grammarly',
        capcut: 'capcut',
        semrush: 'semrush',
        moz: 'moz',
        ubersuggest: 'ubersuggest',
        ubbersuggest: 'ubersuggest',
        neilpatel: 'ubersuggest',
        wordtune: 'wordtune',
        vistacreate: 'vistacreate',
        picmonkey: 'picmonkey',
        envatoelements: 'envatoelements',
        envato: 'envatoelements',
        elements: 'envatoelements',
        storyblocks: 'storyblocks',
        placeit: 'placeit',
        skillshare: 'skillshare',
        jasper: 'jasper',
        jasperai: 'jasper'
    };
    return map[normalized] || normalized;
}

const TOOL_CONFIGS = {
    chatgpt: {
        domains: ['chatgpt.com', 'openai.com'],
        flagCookieUrl: 'https://chatgpt.com',
        flagCookieDomain: '.chatgpt.com'
    },
    canva: {
        domains: ['canva.com'],
        flagCookieUrl: 'https://canva.com',
        flagCookieDomain: '.canva.com'
    },
    gemini: {
        domains: ['google.com'],
        flagCookieUrl: 'https://gemini.google.com',
        flagCookieDomain: '.google.com'
    },
    quillbot: {
        domains: ['quillbot.com'],
        flagCookieUrl: 'https://quillbot.com',
        flagCookieDomain: '.quillbot.com'
    },
    grammarly: {
        domains: ['grammarly.com'],
        flagCookieUrl: 'https://grammarly.com',
        flagCookieDomain: '.grammarly.com'
    },
    capcut: {
        domains: ['capcut.com'],
        flagCookieUrl: 'https://capcut.com',
        flagCookieDomain: '.capcut.com'
    },
    semrush: {
        domains: ['semrush.com'],
        flagCookieUrl: 'https://semrush.com',
        flagCookieDomain: '.semrush.com'
    },
    moz: {
        domains: ['moz.com'],
        flagCookieUrl: 'https://moz.com',
        flagCookieDomain: '.moz.com'
    },
    ubersuggest: {
        domains: ['neilpatel.com'],
        flagCookieUrl: 'https://neilpatel.com',
        flagCookieDomain: '.neilpatel.com'
    },
    wordtune: {
        domains: ['wordtune.com'],
        flagCookieUrl: 'https://wordtune.com',
        flagCookieDomain: '.wordtune.com'
    },
    vistacreate: {
        domains: ['vistacreate.com'],
        flagCookieUrl: 'https://vistacreate.com',
        flagCookieDomain: '.vistacreate.com'
    },
    picmonkey: {
        domains: ['picmonkey.com'],
        flagCookieUrl: 'https://picmonkey.com',
        flagCookieDomain: '.picmonkey.com'
    },
    envatoelements: {
        domains: ['envato.com'],
        flagCookieUrl: 'https://elements.envato.com',
        flagCookieDomain: '.envato.com'
    },
    storyblocks: {
        domains: ['storyblocks.com'],
        flagCookieUrl: 'https://storyblocks.com',
        flagCookieDomain: '.storyblocks.com'
    },
    placeit: {
        domains: ['placeit.net'],
        flagCookieUrl: 'https://placeit.net',
        flagCookieDomain: '.placeit.net'
    },
    skillshare: {
        domains: ['skillshare.com'],
        flagCookieUrl: 'https://skillshare.com',
        flagCookieDomain: '.skillshare.com'
    },
    jasper: {
        domains: ['jasper.ai'],
        flagCookieUrl: 'https://jasper.ai',
        flagCookieDomain: '.jasper.ai'
    }
};

chrome.runtime.onInstalled.addListener(async () => {
    console.log('[AI Tools BG] Extension ready — v5 (cookie injection)');
    chrome.storage.local.remove('pendingLogin');
    await chrome.storage.local.set({ debugLogs: [`[${new Date().toLocaleTimeString()}] Extension initialized`] });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    // ══════════════════════════════════════════════════════════════════
    //  METHOD 1: Cookie Injection (Toolstakes style — INSTANT login)
    //  Injects all session cookies then opens the tool URL directly.
    //  No login form interaction needed — user lands logged-in.
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'INJECT_COOKIES_AND_OPEN') {
        (async () => {
            const cookies  = msg.cookies  || [];
            const openUrl  = msg.url      || 'https://chatgpt.com';

            // Clear any old pending logins to avoid automation script conflicts
            chrome.storage.local.remove('pendingLogin');

            let toolKey = msg.tool ? getCanonicalToolKey(msg.tool) : null;
            if (!toolKey) {
                if (openUrl.includes('chatgpt.com') || openUrl.includes('openai.com')) {
                    toolKey = 'chatgpt';
                } else if (openUrl.includes('canva.com')) {
                    toolKey = 'canva';
                } else if (openUrl.includes('google.com')) {
                    toolKey = 'gemini';
                } else if (openUrl.includes('quillbot.com')) {
                    toolKey = 'quillbot';
                } else if (openUrl.includes('grammarly.com')) {
                    toolKey = 'grammarly';
                } else if (openUrl.includes('capcut.com')) {
                    toolKey = 'capcut';
                } else if (openUrl.includes('semrush.com')) {
                    toolKey = 'semrush';
                } else if (openUrl.includes('moz.com')) {
                    toolKey = 'moz';
                } else if (openUrl.includes('neilpatel.com')) {
                    toolKey = 'ubersuggest';
                } else if (openUrl.includes('wordtune.com')) {
                    toolKey = 'wordtune';
                } else if (openUrl.includes('vistacreate.com')) {
                    toolKey = 'vistacreate';
                } else if (openUrl.includes('picmonkey.com')) {
                    toolKey = 'picmonkey';
                } else if (openUrl.includes('envato.com')) {
                    toolKey = 'envatoelements';
                } else if (openUrl.includes('storyblocks.com')) {
                    toolKey = 'storyblocks';
                } else if (openUrl.includes('placeit.net')) {
                    toolKey = 'placeit';
                } else if (openUrl.includes('skillshare.com')) {
                    toolKey = 'skillshare';
                } else if (openUrl.includes('jasper.ai')) {
                    toolKey = 'jasper';
                } else {
                    toolKey = 'chatgpt';
                }
            }

            const config = TOOL_CONFIGS[toolKey] || TOOL_CONFIGS['chatgpt'];

            // Step 1: Clear existing session cookies first
            for (const domain of config.domains) {
                await clearAllCookiesForDomain(domain);
            }

            // Step 1.5: Set local storage clearing flag
            await chrome.storage.local.set({ clearLocalStorageFor: toolKey });

            // Step 1.6: Set clear_storage_flag cookie synchronously to trigger main world content script clearing
            try {
                const flagCookie = {
                    name: 'clear_storage_flag',
                    value: '1',
                    path: '/',
                    secure: true,
                    url: config.flagCookieUrl,
                    domain: config.flagCookieDomain
                };
                await chrome.cookies.set(flagCookie);
                if (toolKey === 'chatgpt') {
                    await chrome.cookies.set({
                        name: 'clear_storage_flag',
                        value: '1',
                        path: '/',
                        secure: true,
                        url: 'https://openai.com',
                        domain: '.openai.com'
                    });
                }
            } catch (e) {
                console.warn('[AI Tools BG] Failed to set clear_storage_flag cookie:', e.message);
            }

            // Step 2: Inject new session cookies
            let injected = 0;
            for (const c of cookies) {
                try {
                    const domain = c.domain || ('.' + config.domains[0]);
                    const host = domain.startsWith('.') ? domain.substring(1) : domain;
                    const scheme = c.secure !== false ? 'https' : 'http';
                    const computedUrl = `${scheme}://${host}${c.path || '/'}`;

                    const details = {
                        url:      computedUrl,
                        name:     c.name,
                        value:    c.value,
                        path:     c.path      || '/',
                        secure:   c.secure    !== false,
                        httpOnly: c.httpOnly  || false,
                    };
                    
                    const isHostOnly = c.hostOnly === true || c.name.startsWith('__Host-');
                    if (!isHostOnly) {
                        details.domain = domain;
                    }

                    if (c.sameSite) {
                        const val = c.sameSite.toLowerCase();
                        if (val === 'no_restriction' || val === 'none') {
                            details.sameSite = 'no_restriction';
                        } else if (val === 'lax') {
                            details.sameSite = 'lax';
                        } else if (val === 'strict') {
                            details.sameSite = 'strict';
                        }
                    }
                    if (c.expirationDate) details.expirationDate = c.expirationDate;

                    await chrome.cookies.set(details);
                    injected++;
                } catch (e) {
                    console.warn('[AI Tools BG] Cookie inject failed for:', c.name, '—', e.message);
                }
            }
            console.log(`[AI Tools BG] ✅ Injected ${injected}/${cookies.length} cookies for ${toolKey}`);

            // Step 3: Open tool — user lands already logged in
            chrome.tabs.create({ url: openUrl, active: true }, (tab) => {
                console.log('[AI Tools BG] Opened tab:', tab.id, openUrl);
            });

            sendResponse({ ok: true, injected });
        })();
        return true; // keep channel open for async
    }

    // ══════════════════════════════════════════════════════════════════
    //  METHOD 1B: Cookie Injection ONLY (For Access Redirect page)
    //  Injects all session cookies into the browser for the tool domain
    //  without opening any new tabs (the page itself handles redirect).
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'INJECT_COOKIES_ONLY') {
        (async () => {
            const cookies  = msg.cookies  || [];
            const toolKey  = getCanonicalToolKey(msg.tool || 'chatgpt');
            const config   = TOOL_CONFIGS[toolKey] || TOOL_CONFIGS['chatgpt'];

            // Clear any old pending logins and clear debug logs for a fresh run
            chrome.storage.local.remove('pendingLogin');
            await chrome.storage.local.set({ debugLogs: [`[${new Date().toLocaleTimeString()}] Starting cookie injection flow for ${toolKey}...`] });
            await logDebug(`Total cookies received from backend for injection: ${cookies.length}`);

            // Step 1: Clear existing cookies explicitly
            for (const domain of config.domains) {
                await clearAllCookiesForDomain(domain);
            }

            // Step 1.5: Set local storage clearing flag
            await chrome.storage.local.set({ clearLocalStorageFor: toolKey });

            // Step 1.6: Set clear_storage_flag cookie synchronously to trigger main world content script clearing
            try {
                const flagCookie = {
                    name: 'clear_storage_flag',
                    value: '1',
                    path: '/',
                    secure: true,
                    url: config.flagCookieUrl,
                    domain: config.flagCookieDomain
                };
                await chrome.cookies.set(flagCookie);
                if (toolKey === 'chatgpt') {
                    await chrome.cookies.set({
                        name: 'clear_storage_flag',
                        value: '1',
                        path: '/',
                        secure: true,
                        url: 'https://openai.com',
                        domain: '.openai.com'
                    });
                }
            } catch (e) {
                await logDebug(`[INJECT_COOKIES_ONLY] Failed to set clear_storage_flag cookie: ${e.message}`);
            }

            // Step 2: Inject new session cookies
            let injected = 0;
            for (const c of cookies) {
                try {
                    const domain = c.domain || ('.' + config.domains[0]);
                    const host = domain.startsWith('.') ? domain.substring(1) : domain;
                    const scheme = c.secure !== false ? 'https' : 'http';
                    const computedUrl = `${scheme}://${host}${c.path || '/'}`;

                    const details = {
                        url:      computedUrl,
                        name:     c.name,
                        value:    c.value,
                        path:     c.path      || '/',
                        secure:   c.secure    !== false,
                        httpOnly: c.httpOnly  || false,
                    };
                    
                    const isHostOnly = c.hostOnly === true || c.name.startsWith('__Host-');
                    if (!isHostOnly) {
                        details.domain = domain;
                    }
                    
                    // Chromium API only accepts specific case-sensitive values for sameSite: 'no_restriction', 'lax', 'strict'
                    if (c.sameSite) {
                        const val = c.sameSite.toLowerCase();
                        if (val === 'no_restriction' || val === 'none') {
                            details.sameSite = 'no_restriction';
                        } else if (val === 'lax') {
                            details.sameSite = 'lax';
                        } else if (val === 'strict') {
                            details.sameSite = 'strict';
                        }
                    }
                    
                    if (c.expirationDate) details.expirationDate = c.expirationDate;

                    await logDebug(`Attempting to set cookie: ${c.name} (domain: ${details.domain || 'host-only'}, path: ${details.path}, secure: ${details.secure}, httpOnly: ${details.httpOnly}, sameSite: ${details.sameSite || 'default'}, hostOnly: ${isHostOnly}) on URL: ${computedUrl}`);
                    
                    try {
                        const result = await chrome.cookies.set(details);
                        if (!result) {
                            const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Unknown validation error';
                            await logDebug(`❌ FAILED to set cookie: ${c.name}. Error: ${errMsg}`);
                        } else {
                            await logDebug(`✅ Successfully set cookie: ${c.name}`);
                            injected++;
                        }
                    } catch (e) {
                        await logDebug(`❌ FAILED to set cookie (throw): ${c.name}. Error: ${e.message}`);
                    }
                } catch (e) {
                    await logDebug(`❌ Cookie processing failed for ${c.name}: ${e.message}`);
                }
            }
            await logDebug(`Finished injection: Successfully injected ${injected}/${cookies.length} cookies.`);
            sendResponse({ ok: true, injected });
        })();
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  METHOD 2: Open tool URL (email/password fallback)
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'OPEN_TOOL_TAB') {
        chrome.tabs.create({ url: msg.url, active: true }, (tab) => {
            console.log('[AI Tools BG] Opened tab:', tab.id, msg.url);
        });
        sendResponse({ ok: true });
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  Bring tab to front after form login completes
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'LOGIN_COMPLETE') {
        const tabId    = sender.tab.id;
        const windowId = sender.tab.windowId;
        const homeUrl  = msg.homeUrl || null;

        if (homeUrl) {
            chrome.tabs.update(tabId, { url: homeUrl, active: true });
        } else {
            chrome.tabs.update(tabId, { active: true });
        }
        chrome.windows.update(windowId, { focused: true });
        console.log('[AI Tools BG] Login complete — tab', tabId, 'brought to front');
        sendResponse({ ok: true });
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  SETUP CAPTURE — opens chatgpt.com in capture mode
    //  Called when user clicks "Setup Account" on dashboard
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'SETUP_CAPTURE') {
        const tool = msg.tool || 'chatgpt';
        (async () => {
            // Clear existing cookies for both domains explicitly so capture script doesn't catch expired sessions
            await clearAllCookiesForDomain('chatgpt.com');
            await clearAllCookiesForDomain('openai.com');

            // Store capture flag — chatgpt_capture.js will read this
            chrome.storage.local.set({ captureSession: { tool, timestamp: Date.now() } }, () => {
                // Open chatgpt.com for manual login
                chrome.tabs.create({ url: 'https://chatgpt.com', active: true }, (tab) => {
                    console.log('[AI Tools BG] Capture mode: opened chatgpt.com tab', tab.id);
                });
            });
            sendResponse({ ok: true });
        })();
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  CHECK_LOGGED_IN — checks if the user is logged into ChatGPT
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'CHECK_LOGGED_IN') {
        (async () => {
            try {
                const cookies = await chrome.cookies.getAll({ domain: 'chatgpt.com' });
                const hasSession = cookies.some(c => c.name.includes('session-token'));
                sendResponse({ loggedIn: hasSession });
            } catch (e) {
                console.error('[AI Tools BG] Login check error:', e.message);
                sendResponse({ loggedIn: false });
            }
        })();
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  GET_CHATGPT_COOKIES — returns all chatgpt.com cookies
    //  Called by chatgpt_capture.js after login detected
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'GET_CHATGPT_COOKIES') {
        (async () => {
            try {
                // Fetch cookies from both chatgpt.com and openai.com domains
                const list1 = await chrome.cookies.getAll({ domain: 'chatgpt.com' });
                const list2 = await chrome.cookies.getAll({ domain: 'openai.com' });
                
                // Combine and deduplicate by name + domain
                const allCookies = [...list1, ...list2];
                const seen = new Set();
                const uniqueCookies = [];
                for (const c of allCookies) {
                    const key = `${c.name}:${c.domain}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueCookies.push(c);
                    }
                }
                
                console.log(`[AI Tools BG] Got ${uniqueCookies.length} unique cookies for chatgpt.com / openai.com`);
                sendResponse({ ok: true, cookies: uniqueCookies });
            } catch (e) {
                console.error('[AI Tools BG] Cookie read error:', e.message);
                sendResponse({ ok: false, cookies: [] });
            }
        })();
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  CAPTURE_COMPLETE — cookies saved successfully, notify all dashboard tabs
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'CAPTURE_COMPLETE') {
        console.log(`[AI Tools BG] ✅ Session captured for ${msg.tool}: ${msg.count} cookies`);
        // Notify all dashboard tabs
        chrome.tabs.query({ url: ['http://127.0.0.1:8000/*', 'http://localhost:8000/*'] }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type:  'SESSION_CAPTURED',
                    tool:  msg.tool,
                    count: msg.count,
                }).catch(() => {});
            });
        });
        
        // Auto close the capture/automation tab
        if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id);
        }
        
        sendResponse({ ok: true });
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  GET_DEBUG_LOGS — returns extension debug logs
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'GET_DEBUG_LOGS') {
        chrome.storage.local.get('debugLogs', (data) => {
            sendResponse({ logs: data.debugLogs || [] });
        });
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  SAVE_SESSION_TO_BACKEND — saves cookies to backend from bg context to bypass CORS/PNA
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'SAVE_SESSION_TO_BACKEND') {
        (async () => {
            try {
                const url = msg.url || 'http://127.0.0.1:8000/api/save-session';
                const body = {
                    tool: msg.tool,
                    cookies: msg.cookies
                };
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                
                const result = await response.json();
                sendResponse({ ok: true, result });
            } catch (e) {
                console.error('[AI Tools BG] SAVE_SESSION_TO_BACKEND request failed:', e.message);
                sendResponse({ ok: false, error: e.message });
            }
        })();
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  CLEAR_TOOL_COOKIES — clears cookies for tool domains from privileged context
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'CLEAR_TOOL_COOKIES') {
        (async () => {
            const toolKey = getCanonicalToolKey(msg.tool || 'chatgpt');
            const config = TOOL_CONFIGS[toolKey] || TOOL_CONFIGS['chatgpt'];
            for (const domain of config.domains) {
                await clearAllCookiesForDomain(domain);
            }
            sendResponse({ ok: true });
        })();
        return true;
    }

    // ══════════════════════════════════════════════════════════════════
    //  CHECK_CLEAR_STORAGE — checks flag and runs scripting.executeScript to clear main world storage
    // ══════════════════════════════════════════════════════════════════
    if (msg.type === 'CHECK_CLEAR_STORAGE') {
        const tool = msg.tool || 'chatgpt';
        (async () => {
            try {
                const data = await chrome.storage.local.get('clearLocalStorageFor');
                if (data.clearLocalStorageFor === tool) {
                    await logDebug(`[CHECK_CLEAR_STORAGE] Flag detected for ${tool}. Executing main world script to clear local storage...`);
                    
                    // Clear the flag from extension storage
                    await chrome.storage.local.remove('clearLocalStorageFor');

                    // Run script in MAIN world of the sender's tab
                    if (sender.tab && sender.tab.id) {
                        await chrome.scripting.executeScript({
                            target: { tabId: sender.tab.id },
                            world: 'MAIN',
                            func: () => {
                                try {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    if (window.indexedDB && window.indexedDB.databases) {
                                        window.indexedDB.databases().then(dbs => {
                                            dbs.forEach(db => {
                                                try { window.indexedDB.deleteDatabase(db.name); } catch(e) {}
                                            });
                                        });
                                    }
                                    console.log('[AI Tools] Local data, session, and IndexedDB cleared in main world.');
                                } catch (e) {
                                    console.error('[AI Tools] Failed to clear storage in main world:', e);
                                }
                            }
                        });
                        await logDebug(`[CHECK_CLEAR_STORAGE] Main world script executed successfully.`);
                        sendResponse({ ok: true, cleared: true });
                    } else {
                        await logDebug(`[CHECK_CLEAR_STORAGE] Error: No sender tab ID found.`);
                        sendResponse({ ok: false, cleared: false, error: 'No sender tab ID' });
                    }
                } else {
                    sendResponse({ ok: true, cleared: false });
                }
            } catch (e) {
                await logDebug(`[CHECK_CLEAR_STORAGE] Error: ${e.message}`);
                sendResponse({ ok: false, cleared: false, error: e.message });
            }
        })();
        return true;
    }

});
