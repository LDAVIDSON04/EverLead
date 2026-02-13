const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Set name immediately so Dock/Launchpad show "Soradin" instead of "Electron"
app.setName('Soradin');

// Agent and admin portal URLs — dashboard routes, not login pages
const PORTAL_URL = process.env.PORTAL_URL || 'https://soradin.com/agent/dashboard';
const ADMIN_PORTAL_URL = process.env.ADMIN_PORTAL_URL || 'https://soradin.com/admin/dashboard';
const SIGNUP_API_URL = process.env.SIGNUP_API_URL || 'https://soradin.com/api/agent/signup';
// Custom URL we intercept so logo click in the portal opens the app welcome page
const APP_WELCOME_URL = 'soradin-app://welcome';
const APP_WELCOME_PATH = '/__soradin_app_welcome__'; // fallback: intercept this path on the portal origin

const ICON_PATH = path.join(__dirname, 'icon.png');
const WELCOME_PATH = path.join(__dirname, 'welcome.html');
const LOGIN_PATH = path.join(__dirname, 'login.html');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const SESSION_FILE = path.join(app.getPath('userData'), 'soradin-session.json');

// Supabase project ref for localStorage key (sb-<ref>-auth-token)
const SUPABASE_STORAGE_KEY = 'sb-jvcsomdihbfexrwtlahc-auth-token';

let mainWindow = null;
// When true we're in the "inject session then load dashboard" flow — don't treat /agent as logout
let pendingPortalLoad = false;
// When true we're switching to welcome (e.g. after logout); hide until welcome has loaded to avoid flash
let transitioningToWelcome = false;

function parseEnvFile(content) {
  const out = {};
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  return out;
}

function getAuthConfig() {
  let url = '';
  let anonKey = '';
  try {
    const configPath = path.join(__dirname, 'auth-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(raw);
      url = config.url || '';
      anonKey = config.anonKey || '';
    }
  } catch (e) {
    // ignore
  }
  if (process.env.ELECTRON_SUPABASE_URL) url = process.env.ELECTRON_SUPABASE_URL;
  if (process.env.ELECTRON_SUPABASE_ANON_KEY) anonKey = process.env.ELECTRON_SUPABASE_ANON_KEY;
  // Same as website: use project .env.local when running from repo (e.g. electron .)
  if (!url || !anonKey) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const env = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
      if (!url) url = env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!anonKey) anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }
  }
  return { url, anonKey };
}

function loadStoredSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const raw = fs.readFileSync(SESSION_FILE, 'utf8');
    const data = JSON.parse(raw);
    const expiresAt = data.expires_at;
    // Consider valid if at least 60 seconds until expiry
    if (expiresAt && expiresAt > Math.floor(Date.now() / 1000) + 60) {
      return data;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveSession(session) {
  try {
    const dir = path.dirname(SESSION_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(session), 'utf8');
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

/** Fetch profile role (admin | agent) so we can send user to the right portal. */
async function getProfileRole(session) {
  const { url, anonKey } = getAuthConfig();
  if (!url || !anonKey || !session?.access_token || !session?.user?.id) return null;
  try {
    const base = url.replace(/\/$/, '');
    const res = await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=role`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const role = Array.isArray(data) && data[0] ? data[0].role : null;
    return role === 'admin' ? 'admin' : role === 'agent' ? 'agent' : null;
  } catch (e) {
    return null;
  }
}

function portalUrlForRole(role) {
  return role === 'admin' ? ADMIN_PORTAL_URL : PORTAL_URL;
}

function isPortalLoginPageUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/$/, '') || '/';
    return p === '/agent';
  } catch (e) {
    return false;
  }
}

async function loginWithSupabase(email, password) {
  const { url, anonKey } = getAuthConfig();
  if (!url || !anonKey) {
    return { ok: false, error: 'App is not configured for login. Add electron/auth-config.json with url and anonKey (see auth-config.example.json).' };
  }
  const tokenUrl = `${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.msg || data.error_description || data.message || 'Login failed.';
    return { ok: false, error: msg };
  }
  const access_token = data.access_token;
  const refresh_token = data.refresh_token;
  const expires_in = data.expires_in || 3600;
  const user = data.user;
  if (!access_token || !user) {
    return { ok: false, error: 'Invalid response from server.' };
  }
  const expires_at = Math.floor(Date.now() / 1000) + expires_in;
  const session = {
    access_token,
    refresh_token,
    expires_at,
    expires_in: data.expires_in,
    token_type: data.token_type,
    user,
  };
  saveSession(session);
  return { ok: true, session };
}

function injectSessionIntoPage(webContents, session) {
  const key = SUPABASE_STORAGE_KEY;
  const script = `
    (function() {
      try {
        var session = ${JSON.stringify(session)};
        localStorage.setItem('${key}', JSON.stringify(session));
        return true;
      } catch (e) { return false; }
    })();
  `;
  return webContents.executeJavaScript(script);
}

function createWindow(opts) {
  const { showWindow = true } = opts || {};
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Soradin',
    show: showWindow,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
    icon: ICON_PATH,
  });

  // Keep app title; don't let the loaded page show website title (avoids browser-tab feel)
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
    mainWindow.setTitle('Soradin');
  });

  // Open external links (e.g. password reset, help) in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Logo in portal: intercept app-welcome URL and show app welcome (don't clear session)
  function loadAppWelcomePage() {
    if (!mainWindow || pendingPortalLoad) return;
    transitioningToWelcome = true;
    mainWindow.hide();
    mainWindow.loadFile(WELCOME_PATH);
  }

  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url === APP_WELCOME_URL) {
      e.preventDefault();
      loadAppWelcomePage();
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.pathname === APP_WELCOME_PATH && (parsed.hostname === 'soradin.com' || parsed.hostname === new URL(PORTAL_URL).hostname)) {
        e.preventDefault();
        loadAppWelcomePage();
      }
    } catch (_) {}
  });

  function goToWelcomePage() {
    if (!mainWindow || pendingPortalLoad) return;
    transitioningToWelcome = true;
    mainWindow.hide();
    clearSession();
    mainWindow.loadFile(WELCOME_PATH);
  }

  function goToWelcomeIfOnLoginPage() {
    if (!mainWindow || pendingPortalLoad) return;
    const url = mainWindow.webContents.getURL();
    if (isPortalLoginPageUrl(url)) {
      goToWelcomePage();
    }
  }

  // When user is sent to the website login page (e.g. logout), show app welcome and clear session
  mainWindow.webContents.on('did-navigate', (_event, url) => {
    if (!mainWindow) return;
    if (pendingPortalLoad) return;
    if (isPortalLoginPageUrl(url)) {
      goToWelcomePage();
    }
  });

  // Client-side navigations (e.g. Next.js router) don't fire did-navigate; catch in-page URL changes
  mainWindow.webContents.on('did-navigate-in-page', (_event, url) => {
    if (!mainWindow) return;
    if (pendingPortalLoad) return;
    if (isPortalLoginPageUrl(url)) {
      goToWelcomePage();
    }
  });

  // After any load: show window if we were transitioning to welcome, or check if we need to go to welcome
  mainWindow.webContents.on('did-finish-load', () => {
    if (transitioningToWelcome) {
      transitioningToWelcome = false;
      mainWindow.show();
      return;
    }
    goToWelcomeIfOnLoginPage();
    // When viewing the portal: (1) logo click -> welcome, (2) add a visible "Back to welcome" link
    try {
      const u = mainWindow.webContents.getURL();
      const origin = (function() { try { return new URL(PORTAL_URL).origin; } catch(e) { return 'https://soradin.com'; } })();
      if (u.startsWith('https://soradin.com/agent/') || u.startsWith('https://soradin.com/admin/') || (u.includes('/agent/') && u.startsWith(origin)) || (u.includes('/admin/') && u.startsWith(origin))) {
        const appWelcome = APP_WELCOME_URL;
        mainWindow.webContents.executeJavaScript(`
          (function(){
            var appWelcome = '${appWelcome}';
            function isLogoLink(el) {
              var a = el && (el.closest ? el.closest('a') : (function(n){ while(n){ if(n.tagName==='A') return n; n=n.parentElement; } return null; })(el));
              if (!a) return false;
              var img = a.querySelector && a.querySelector('img');
              if (!img) return false;
              var s = (img.src || '') + ' ' + (img.alt || '');
              return /logo|soradin/i.test(s);
            }
            function handleClick(e) {
              if (!isLogoLink(e.target)) return;
              e.preventDefault();
              e.stopImmediatePropagation();
              window.location.href = appWelcome;
            }
            if (!document.__soradinLogoCapture) {
              document.__soradinLogoCapture = true;
              document.addEventListener('click', handleClick, true);
            }
            if (document.getElementById('soradin-app-back')) return;
            var back = document.createElement('a');
            back.id = 'soradin-app-back';
            back.href = appWelcome;
            back.textContent = '← Welcome';
            back.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;padding:6px 10px;background:rgba(0,0,0,0.85);color:#fff;font-size:13px;text-decoration:none;border-radius:6px;font-family:system-ui,sans-serif;';
            document.body.appendChild(back);
          })();
        `).catch(() => {});
      }
    } catch (err) {}
  });

  const session = loadStoredSession();
  if (session) {
    pendingPortalLoad = true;
    getProfileRole(session).then((role) => {
      const portalUrl = portalUrlForRole(role);
      mainWindow.loadURL(portalUrl);
      mainWindow.webContents.once('did-finish-load', () => {
        injectSessionIntoPage(mainWindow.webContents, session).then(() => {
          mainWindow.loadURL(portalUrl);
          mainWindow.webContents.once('did-finish-load', () => {
            pendingPortalLoad = false;
            mainWindow.show();
          });
        });
      });
    }).catch(() => {
      mainWindow.loadURL(PORTAL_URL);
      mainWindow.webContents.once('did-finish-load', () => {
        injectSessionIntoPage(mainWindow.webContents, session).then(() => {
          mainWindow.loadURL(PORTAL_URL);
          mainWindow.webContents.once('did-finish-load', () => {
            pendingPortalLoad = false;
            mainWindow.show();
          });
        });
      });
    });
  } else {
    mainWindow.loadFile(WELCOME_PATH);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(ICON_PATH);
  }

  // Use "Soradin" in the menu bar instead of "Electron" (macOS/Windows)
  const appMenu = Menu.buildFromTemplate([
    { label: 'Soradin', submenu: [{ role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
    { label: 'Help', submenu: [{ role: 'about' }] },
  ]);
  Menu.setApplicationMenu(appMenu);

  ipcMain.handle('hasAuthConfig', () => {
    const { url, anonKey } = getAuthConfig();
    return !!(url && anonKey);
  });

  ipcMain.handle('createAccountSignup', async (event, payload) => {
    try {
      const res = await fetch(SIGNUP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || 'Signup failed. Please try again.' };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Something went wrong. Please try again.' };
    }
  });

  ipcMain.handle('login', async (event, email, password) => {
    if (!email || !password) {
      return { ok: false, error: 'Please enter email and password.' };
    }
    const result = await loginWithSupabase(email, password);
    if (!result.ok) return result;
    if (!mainWindow) return { ok: false, error: 'Window closed.' };
    const role = await getProfileRole(result.session);
    if (role !== 'admin' && role !== 'agent') {
      return { ok: false, error: role === null ? 'Could not load your profile. Please check your connection and try again.' : 'Your account role is not set up for login. Contact support.' };
    }
    const portalUrl = portalUrlForRole(role);
    pendingPortalLoad = true;
    mainWindow.hide();
    mainWindow.loadURL(portalUrl);
    mainWindow.webContents.once('did-finish-load', () => {
      injectSessionIntoPage(mainWindow.webContents, result.session).then(() => {
        mainWindow.loadURL(portalUrl);
        mainWindow.webContents.once('did-finish-load', () => {
          pendingPortalLoad = false;
          mainWindow.show();
        });
      });
    });
    return { ok: true };
  });

  createWindow({ showWindow: !loadStoredSession() });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow({ showWindow: !loadStoredSession() });
  }
});
