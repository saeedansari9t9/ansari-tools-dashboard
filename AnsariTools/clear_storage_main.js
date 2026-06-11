/**
 * clear_storage_main.js
 * Runs in the MAIN world synchronously at document_start.
 * Checks for clear_storage_flag cookie and clears localStorage / sessionStorage.
 */
(function() {
    try {
        if (document.cookie.includes('clear_storage_flag=1')) {
            console.log('[AI Tools] clear_storage_flag cookie detected. Clearing storage synchronously...');
            
            // Clear storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear Service Workers
            if (navigator.serviceWorker) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        try {
                            registration.unregister();
                            console.log('[AI Tools] Unregistered service worker:', registration);
                        } catch(e) {}
                    });
                }).catch(() => {});
            }

            // Clear Cache Storage
            if (window.caches) {
                caches.keys().then(keys => {
                    keys.forEach(key => {
                        try {
                            caches.delete(key);
                            console.log('[AI Tools] Deleted Cache Storage:', key);
                        } catch(e) {}
                    });
                }).catch(() => {});
            }

            // Try to clear IndexedDB databases (asynchronous, but starts immediately)
            if (window.indexedDB && window.indexedDB.databases) {
                window.indexedDB.databases().then(dbs => {
                    if (dbs && dbs.length > 0) {
                        dbs.forEach(db => {
                            try {
                                window.indexedDB.deleteDatabase(db.name);
                                console.log('[AI Tools] Sent delete request for IndexedDB:', db.name);
                            } catch(e) {}
                        });
                    }
                }).catch(() => {});
            }
            
            // Delete the cookie
            const domain = window.location.hostname;
            const baseDomain = '.' + domain.split('.').slice(-2).join('.');
            document.cookie = 'clear_storage_flag=; Path=/; Domain=' + domain + '; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
            document.cookie = 'clear_storage_flag=; Path=/; Domain=' + baseDomain + '; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
            console.log('[AI Tools] Storage cleared and flag cookie removed.');
        }
    } catch (e) {
        console.error('[AI Tools] Error in clear_storage_main:', e);
    }
})();
