// ============================================================
// BUDGET BUDDY — PROFILE PAGE  (Complete Rewrite)
// ============================================================
// Key fixes:
//  1. Modal closes IMMEDIATELY after a successful save
//  2. Display values update on screen right away (no page refresh needed)
//  3. All changes persist to localStorage (currentUser + budgetBuddyUsers)
//  4. Two-Factor and Notifications status shown correctly
//  5. Goals-summary works with id="goalsSummary" in HTML
//  6. No broken function references, no truncated onclick strings
//  7. Form is pre-filled with existing data when Edit is clicked
// ============================================================

const CURRENCY_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', INR:'₹' };
const CURRENCY_RATES   = { USD:1/83.12, EUR:0.92/83.12, GBP:0.79/83.12, JPY:151.50/83.12, INR:1 };

function getPrefs() {
    return {
        currency: localStorage.getItem('userCurrency') || 'INR',
        theme   : localStorage.getItem('userTheme')    || 'light',
        language: localStorage.getItem('userLanguage') || 'en'
    };
}

function fmt(amountINR) {
    const { currency } = getPrefs();
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const rate   = CURRENCY_RATES[currency]   || 1;
    return symbol + (amountINR * rate).toFixed(2);
}

function applyTheme(theme) {
    if (!theme) theme = getPrefs().theme;
    if (theme === 'dark') {
        document.body.style.background = '#1a1d23';
        document.body.style.color      = '#e0e0e0';
    } else {
        document.body.style.background = '#f4f6f7';
        document.body.style.color      = '#333333';
    }
}

function showNotification(msg, type) {
    if (!type) type = 'info';
    document.querySelectorAll('.bb-notif').forEach(function(n) { n.remove(); });
    var colors = {
        success: { bg:'#2d5016', border:'#4caf50', text:'#c8e6c9' },
        error  : { bg:'#5a1a1a', border:'#f44336', text:'#ffcdd2' },
        warning: { bg:'#5a4a00', border:'#ff9800', text:'#ffe0b2' },
        info   : { bg:'#1a3a5a', border:'#2196f3', text:'#bbdefb' }
    };
    var c = colors[type] || colors.info;
    var n = document.createElement('div');
    n.className = 'bb-notif';
    n.textContent = msg;
    n.style.position    = 'fixed';
    n.style.top         = '20px';
    n.style.right       = '20px';
    n.style.padding     = '15px 20px';
    n.style.borderRadius= '8px';
    n.style.fontSize    = '14px';
    n.style.fontWeight  = '500';
    n.style.zIndex      = '9999';
    n.style.maxWidth    = '400px';
    n.style.boxShadow   = '0 4px 12px rgba(0,0,0,.15)';
    n.style.background  = c.bg;
    n.style.border      = '1px solid ' + c.border;
    n.style.color       = c.text;
    document.body.appendChild(n);
    setTimeout(function() { n.remove(); }, 3500);
}

// ── State ──────────────────────────────────────────────────
var currentUser   = null;
var userProfile   = null;
var transactions  = [];
var categories    = [];
var goals         = [];
var activeSection = '';

applyTheme();

// ── DOMContentLoaded ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        window.location.href = '../create/create.html';
        return;
    }

    userProfile = JSON.parse(JSON.stringify(currentUser)); // deep copy
    if (!userProfile.currency) userProfile.currency = localStorage.getItem('userCurrency') || 'INR';
    if (!userProfile.theme)    userProfile.theme    = localStorage.getItem('userTheme')    || 'light';
    if (!userProfile.language) userProfile.language = localStorage.getItem('userLanguage') || 'en';

    // Record last login if missing
    if (!userProfile.lastLogin) {
        var now = new Date().toLocaleString('en-IN');
        userProfile.lastLogin = now;
        persistUser({ lastLogin: now });
    }

    syncPrefsToStorage();
    applyTheme(userProfile.theme);
    loadUserData();
    refreshDisplay();
    initHeader();

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            openModal(this.getAttribute('data-section'));
        });
    });

    // Modal close
    var closeBtn   = document.getElementById('modalCloseBtn');
    var cancelBtn  = document.getElementById('cancelModalBtn');
    var editModal  = document.getElementById('editModal');
    var editForm   = document.getElementById('editForm');

    if (closeBtn)  closeBtn.addEventListener('click',  closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSave();
        });
    }

    // Account action buttons
    var delBtn    = document.getElementById('deleteAccountBtn');
    var logoutBtn = document.getElementById('logoutBtn');
    if (delBtn)    delBtn.addEventListener('click',    deleteAccount);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Cross-tab updates
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.indexOf('budgetTransactions') !== -1) { loadUserData(); refreshDisplay(); }
        if (e.key && e.key.indexOf('budgetGoals')        !== -1) { loadUserData(); refreshGoalsDisplay(); }
        if (e.key === 'currentUser' && e.newValue) {
            currentUser = JSON.parse(e.newValue);
            userProfile = JSON.parse(JSON.stringify(currentUser));
            loadUserData();
            refreshDisplay();
        }
    });
});

// ── Load fresh data ────────────────────────────────────────
function loadUserData() {
    if (!currentUser) return;
    var uid = currentUser.id;
    transactions = JSON.parse(localStorage.getItem('budgetTransactions_' + uid) || '[]');
    categories   = JSON.parse(localStorage.getItem('budgetCategories_'   + uid) || '[]');
    goals        = JSON.parse(localStorage.getItem('budgetGoals_'         + uid) || '[]');
}

// ── Persist changes to both currentUser and users DB ───────
function persistUser(updates) {
    // Update in-memory
    Object.keys(updates).forEach(function(k) {
        userProfile[k]   = updates[k];
        currentUser[k]   = updates[k];
    });

    // Save currentUser
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Save in users DB
    var users = JSON.parse(localStorage.getItem('budgetBuddyUsers') || '[]');
    var idx   = users.findIndex(function(u) { return u.id === currentUser.id; });
    if (idx >= 0) {
        Object.keys(updates).forEach(function(k) { users[idx][k] = updates[k]; });
        localStorage.setItem('budgetBuddyUsers', JSON.stringify(users));
    }
}

function syncPrefsToStorage() {
    if (!userProfile) return;
    localStorage.setItem('userCurrency',      userProfile.currency      || 'INR');
    localStorage.setItem('userTheme',         userProfile.theme         || 'light');
    localStorage.setItem('userLanguage',      userProfile.language      || 'en');
    localStorage.setItem('userNotifications', String(userProfile.notifications !== false));
}

// ── Header ─────────────────────────────────────────────────
function initHeader() {
    var menuBtn      = document.getElementById('menuBtn');
    var dropdownMenu = document.getElementById('dropdownMenu');
    var addBtn       = document.getElementById('addTransactionBtn');
    var profileBtn   = document.getElementById('profileBtn');

    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
        document.addEventListener('click', function(e) {
            if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
                menuBtn.classList.remove('active');
            }
        });
    }
    if (addBtn)     addBtn.addEventListener('click',     function() { window.location.href = '../add transaction/add.html'; });
    if (profileBtn) profileBtn.addEventListener('click', function() { window.location.href = 'profile.html'; });

    document.querySelectorAll('.menu-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.getAttribute('href');
        });
    });
}

// ── Open modal ─────────────────────────────────────────────
function openModal(section) {
    activeSection = section;

    // Show correct form section
    document.querySelectorAll('.form-section').forEach(function(f) { f.classList.remove('active'); });
    var targetForm = document.getElementById(section + 'Form');
    if (targetForm) targetForm.classList.add('active');

    // Set title
    var titles = {
        personal   : 'Edit Personal Information',
        security   : 'Edit Security Settings',
        preferences: 'Edit Preferences',
        goals      : 'Add Financial Goal'
    };
    var titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = titles[section] || 'Edit';

    // Pre-fill existing values
    prefillForm(section);

    // Show modal
    var modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// ── Close modal ────────────────────────────────────────────
function closeModal() {
    var modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    var form = document.getElementById('editForm');
    if (form) form.reset();
    activeSection = '';
}
window.closeModal = closeModal;

// ── Pre-fill form ──────────────────────────────────────────
function prefillForm(section) {
    if (!userProfile) return;

    function sf(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    }

    if (section === 'personal') {
        sf('firstName', userProfile.firstName || '');
        sf('lastName',  userProfile.lastName  || '');
        sf('email',     userProfile.email     || '');
        sf('phone',     userProfile.phone     || '');
        sf('dob',       userProfile.dob       || '');

    } else if (section === 'security') {
        sf('currentPassword', '');
        sf('newPassword',     '');
        sf('confirmPassword', '');
        var tfEl = document.getElementById('twoFactor');
        if (tfEl) tfEl.checked = !!(userProfile.twoFactor);

    } else if (section === 'preferences') {
        sf('currency', userProfile.currency || 'INR');
        sf('language', userProfile.language || 'en');
        sf('theme',    userProfile.theme    || 'light');
        var notifEl = document.getElementById('notifications');
        if (notifEl) notifEl.checked = (userProfile.notifications !== false);

    } else if (section === 'goals') {
        sf('goalName',    '');
        sf('goalTarget',  '');
        sf('goalCurrent', '');
        sf('goalIcon',    'fa-piggy-bank');
    }
}

// ── Handle Save (called on form submit) ────────────────────
function handleSave() {
    var sec    = activeSection;
    var saved  = false;

    if      (sec === 'personal')    saved = savePersonal();
    else if (sec === 'security')    saved = saveSecurity();
    else if (sec === 'preferences') saved = savePreferences();
    else if (sec === 'goals')       saved = saveGoal();

    if (saved) {
        closeModal();      // ← CLOSES MODAL
        refreshDisplay();  // ← UPDATES SCREEN
        if (sec === 'goals') refreshGoalsDisplay();
    }
    // If saved === false, modal stays open (error toast already shown)
}

// ── Save: Personal ─────────────────────────────────────────
function savePersonal() {
    var fn = (document.getElementById('firstName') ? document.getElementById('firstName').value : '').trim();
    var ln = (document.getElementById('lastName')  ? document.getElementById('lastName').value  : '').trim();
    var em = (document.getElementById('email')     ? document.getElementById('email').value     : '').trim();
    var ph = (document.getElementById('phone')     ? document.getElementById('phone').value     : '').trim();
    var db = (document.getElementById('dob')       ? document.getElementById('dob').value       : '');

    if (!fn) { showNotification('First name is required.', 'error'); return false; }
    if (!ln) { showNotification('Last name is required.',  'error'); return false; }
    if (!em) { showNotification('Email is required.', 'error'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }

    persistUser({ firstName:fn, lastName:ln, email:em, phone:ph, dob:db });
    showNotification('Personal information updated!', 'success');
    return true;
}

// ── Save: Security ─────────────────────────────────────────
function saveSecurity() {
    var cp = document.getElementById('currentPassword') ? document.getElementById('currentPassword').value : '';
    var np = document.getElementById('newPassword')     ? document.getElementById('newPassword').value     : '';
    var cf = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '';
    var tf = document.getElementById('twoFactor')       ? document.getElementById('twoFactor').checked     : false;

    if (np) {
        if (!cp) { showNotification('Please enter your current password.', 'error'); return false; }
        if (currentUser.password !== cp) { showNotification('Current password is incorrect!', 'error'); return false; }
        if (np.length < 6) { showNotification('New password must be at least 6 characters.', 'error'); return false; }
        if (np !== cf)     { showNotification('New passwords do not match!', 'error'); return false; }
        if (np === cp)     { showNotification('New password must differ from the current one.', 'error'); return false; }
    } else if (cp) {
        showNotification('Please also enter a new password, or leave both fields blank.', 'error');
        return false;
    }

    var updates = { twoFactor: !!tf };
    if (np) updates.password = np;
    persistUser(updates);
    showNotification('Security settings updated!', 'success');
    return true;
}

// ── Save: Preferences ─────────────────────────────────────
function savePreferences() {
    var currency      = document.getElementById('currency')      ? document.getElementById('currency').value      : 'INR';
    var language      = document.getElementById('language')      ? document.getElementById('language').value      : 'en';
    var theme         = document.getElementById('theme')         ? document.getElementById('theme').value         : 'light';
    var notifications = document.getElementById('notifications') ? document.getElementById('notifications').checked : true;

    persistUser({ currency:currency, language:language, theme:theme, notifications:notifications });

    localStorage.setItem('userCurrency',      currency);
    localStorage.setItem('userTheme',         theme);
    localStorage.setItem('userLanguage',      language);
    localStorage.setItem('userNotifications', String(notifications));

    applyTheme(theme);
    showNotification('Preferences saved! All pages will now use your new settings.', 'success');
    return true;
}

// ── Save: Goal ─────────────────────────────────────────────
function saveGoal() {
    var name    = (document.getElementById('goalName')    ? document.getElementById('goalName').value    : '').trim();
    var target  = parseFloat(document.getElementById('goalTarget')  ? document.getElementById('goalTarget').value  : '0') || 0;
    var current = parseFloat(document.getElementById('goalCurrent') ? document.getElementById('goalCurrent').value : '0') || 0;
    var icon    = document.getElementById('goalIcon') ? document.getElementById('goalIcon').value : 'fa-piggy-bank';

    if (!name)       { showNotification('Please enter a goal name.', 'error'); return false; }
    if (target <= 0) { showNotification('Target amount must be greater than 0.', 'error'); return false; }
    if (current < 0) { showNotification('Current amount cannot be negative.', 'error'); return false; }

    // Store in INR
    var rate       = CURRENCY_RATES[getPrefs().currency] || 1;
    var targetINR  = target  / rate;
    var currentINR = current / rate;

    var newGoal = {
        id          : 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId      : currentUser.id,
        name        : name,
        target      : targetINR,
        current     : currentINR,
        icon        : icon,
        color       : 'linear-gradient(135deg, #28a745, #20c997)',
        fromCategory: false,
        createdAt   : new Date().toISOString()
    };

    goals.push(newGoal);
    localStorage.setItem('budgetGoals_' + currentUser.id, JSON.stringify(goals));
    showNotification('Financial goal added!', 'success');
    return true;
}

// ── Refresh full display ────────────────────────────────────
function refreshDisplay() {
    if (!userProfile) return;
    loadUserData();

    var fullName = ((userProfile.firstName || '') + ' ' + (userProfile.lastName || '')).trim() || 'User';

    setText('userName',  fullName);
    setText('userEmail', userProfile.email || '');

    setText('displayName',  fullName || '—');
    setText('displayEmail', userProfile.email || '—');
    setText('displayPhone', userProfile.phone || '—');
    setText('displayDob',   userProfile.dob ? fmtDate(userProfile.dob) : '—');

    setText('lastLogin', userProfile.lastLogin || '—');

    var tfStatus = document.getElementById('twoFactorStatus');
    if (tfStatus) {
        tfStatus.textContent = userProfile.twoFactor ? 'Enabled' : 'Disabled';
        tfStatus.className   = 'status ' + (userProfile.twoFactor ? 'enabled' : 'disabled');
    }

    setText('displayCurrency', getCurrencyLabel(userProfile.currency || 'INR'));
    setText('displayLanguage', getLangLabel(userProfile.language     || 'en'));
    setText('displayTheme',    capitalise(userProfile.theme          || 'light'));

    var notifEl = document.getElementById('displayNotifications');
    if (notifEl) {
        var on = (userProfile.notifications !== false);
        notifEl.textContent = on ? 'Enabled' : 'Disabled';
        notifEl.className   = 'status ' + (on ? 'enabled' : 'disabled');
    }

    setText('totalTransactions', transactions.length);
    setText('totalCategories',   categories.length);

    if (userProfile.createdAt) {
        var days = Math.floor((Date.now() - new Date(userProfile.createdAt).getTime()) / 86400000);
        setText('accountAge', days >= 0 ? days : 0);
    }

    refreshGoalsDisplay();
}

function refreshGoalsDisplay() {
    var container = document.getElementById('goalsSummary') || document.querySelector('.goals-summary');
    if (!container) return;

    var userGoals = goals.filter(function(g) { return !g.fromCategory; });

    if (userGoals.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:20px">No goals yet. Click "Add Goal" to create your first financial goal!</p>';
        return;
    }

    container.innerHTML = userGoals.map(function(g) {
        var pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100).toFixed(0) : 0;
        return '<div class="goal-summary-item">' +
               '<div class="goal-icon" style="background:' + (g.color || 'linear-gradient(135deg,#28a745,#20c997)') + '">🎯</div>' +
               '<div class="goal-info">' +
               '<h4>' + g.name + '</h4>' +
               '<p>' + fmt(g.current || 0) + ' of ' + fmt(g.target || 0) + ' saved</p>' +
               '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
               '</div></div>';
    }).join('');
}

// ── Helpers ────────────────────────────────────────────────
function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}

function fmtDate(ds) {
    if (!ds) return '—';
    try { return new Date(ds).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }); }
    catch(e) { return ds; }
}

function getCurrencyLabel(c) {
    var m = { INR:'INR (₹)', USD:'USD ($)', EUR:'EUR (€)', GBP:'GBP (£)', JPY:'JPY (¥)' };
    return m[c] || c;
}

function getLangLabel(l) {
    var m = { en:'English', es:'Spanish', fr:'French', de:'German', hi:'Hindi', mr:'Marathi' };
    return m[l] || l;
}

function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ── Export / Import / Delete / Logout ──────────────────────
function exportData() {
    if (!currentUser) return;
    var data = { profile:userProfile, transactions:transactions, categories:categories,
                 goals:goals.filter(function(g){return !g.fromCategory;}), exportDate:new Date().toISOString() };
    var a = document.createElement('a');
    a.href     = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = 'budget_buddy_export_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    showNotification('Data exported successfully!', 'success');
}

function importData() {
    var input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var d = JSON.parse(ev.target.result);
                if (!d.profile || !d.transactions) { showNotification('Invalid file format.', 'error'); return; }
                var updates = { firstName:d.profile.firstName, lastName:d.profile.lastName, email:d.profile.email,
                                phone:d.profile.phone||'', dob:d.profile.dob||'',
                                currency:d.profile.currency||'INR', language:d.profile.language||'en',
                                theme:d.profile.theme||'light', notifications:d.profile.notifications!==false,
                                twoFactor:d.profile.twoFactor||false };
                persistUser(updates);
                localStorage.setItem('budgetTransactions_'+currentUser.id, JSON.stringify(d.transactions));
                localStorage.setItem('budgetCategories_'  +currentUser.id, JSON.stringify(d.categories||[]));
                localStorage.setItem('budgetGoals_'        +currentUser.id, JSON.stringify(d.goals||[]));
                loadUserData(); syncPrefsToStorage(); applyTheme(userProfile.theme); refreshDisplay();
                showNotification('Data imported successfully!', 'success');
            } catch(err) { showNotification('Error reading file.', 'error'); }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
}

function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account and ALL data. This CANNOT be undone.')) return;
    try {
        var users = JSON.parse(localStorage.getItem('budgetBuddyUsers')||'[]').filter(function(u){return u.id!==currentUser.id;});
        localStorage.setItem('budgetBuddyUsers', JSON.stringify(users));
        localStorage.removeItem('budgetTransactions_'+currentUser.id);
        localStorage.removeItem('budgetCategories_'  +currentUser.id);
        localStorage.removeItem('budgetGoals_'        +currentUser.id);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userCurrency');
        localStorage.removeItem('userTheme');
        localStorage.removeItem('userLanguage');
        showNotification('Account deleted. Redirecting…', 'success');
        setTimeout(function(){ window.location.href = '../create/create.html'; }, 2000);
    } catch(err) { showNotification('Error deleting account. Please try again.', 'error'); }
}

function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    persistUser({ lastLogin: new Date().toLocaleString('en-IN') });
    localStorage.removeItem('currentUser');
    window.location.href = '../create/create.html';
}

window.exportData = exportData;
window.importData = importData;
window.logout     = logout;
