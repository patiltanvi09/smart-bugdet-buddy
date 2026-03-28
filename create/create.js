// ============================================================
// BUDGET BUDDY — AUTH (create.js)
// Login + Signup + Forgot Password (all on one page)
// ============================================================

class UserDatabase {
    static getUsers() { return JSON.parse(localStorage.getItem('budgetBuddyUsers') || '[]'); }
    static saveUsers(users) { localStorage.setItem('budgetBuddyUsers', JSON.stringify(users)); }
    static findByEmailOrPhone(identifier) {
        var id = identifier.trim().toLowerCase();
        return this.getUsers().find(function(u) {
            return u.email.toLowerCase() === id || u.phone === identifier.trim();
        }) || null;
    }
    static findByEmail(email) {
        var e = email.trim().toLowerCase();
        return this.getUsers().find(function(u) { return u.email.toLowerCase() === e; }) || null;
    }
    static addUser(data) {
        var users = this.getUsers();
        var user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            firstName: data.firstName, lastName: data.lastName,
            email: data.email, phone: data.phone || '',
            password: data.password, dob: data.dob || '',
            currency: 'INR', language: 'en', theme: 'light',
            notifications: true, twoFactor: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toLocaleString('en-IN')
        };
        users.push(user);
        this.saveUsers(users);
        return user;
    }
    static updateUser(email, updates) {
        var users = this.getUsers();
        var i = users.findIndex(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
        if (i !== -1) { users[i] = Object.assign({}, users[i], updates); this.saveUsers(users); return users[i]; }
        return null;
    }
    static updatePassword(email, newPassword) { return !!this.updateUser(email, { password: newPassword }); }
    static setCurrentUser(user) { localStorage.setItem('currentUser', JSON.stringify(user)); }
    static getCurrentUser() { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
    static isLoggedIn() { return this.getCurrentUser() !== null; }
}

function showNotification(message, type) {
    if (!type) type = 'info';
    document.querySelectorAll('.auth-notif').forEach(function(n) { n.remove(); });
    var colors = {
        success: { bg:'#2d5016', border:'#4caf50', text:'#c8e6c9' },
        error:   { bg:'#5a1a1a', border:'#f44336', text:'#ffcdd2' },
        warning: { bg:'#5a4a00', border:'#ff9800', text:'#ffe0b2' },
        info:    { bg:'#1a3a5a', border:'#2196f3', text:'#bbdefb' }
    };
    var c = colors[type] || colors.info;
    var n = document.createElement('div');
    n.className = 'auth-notif';
    n.textContent = message;
    n.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:8px;' +
        'font-size:14px;font-weight:500;z-index:9999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,.15);' +
        'background:' + c.bg + ';border:1px solid ' + c.border + ';color:' + c.text;
    document.body.appendChild(n);
    setTimeout(function() { n.remove(); }, 4000);
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function isValidPhone(phone) { return /^\d{10,}$/.test(phone.replace(/\D/g, '')); }
function redirectToDashboard() { window.location.href = '../main page/main.html'; }

function initializeUserData(userId) {
    // New users start completely fresh — no default categories or transactions.
    localStorage.setItem('budgetCategories_'  + userId, JSON.stringify([]));
    localStorage.setItem('budgetGoals_'        + userId, JSON.stringify([]));
    localStorage.setItem('budgetTransactions_'+ userId, JSON.stringify([]));
}

// Forgot password state
var fpCode = null, fpEmail = null, fpExpires = null, fpTimer = null;

function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
    var payload = decodeJwtResponse(response.credential);
    var email = payload.email;
    var firstName = payload.given_name;
    var lastName = payload.family_name || '';

    var user = UserDatabase.findByEmail(email);
    if (!user) {
        // Auto-register user via Google
        user = UserDatabase.addUser({
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: '',
            password: 'OAUTH_' + Math.random().toString(36).substr(2, 12),
            dob: ''
        });
        initializeUserData(user.id);
        showNotification('Account created automatically! Redirecting…', 'success');
    } else {
        user.lastLogin = new Date().toLocaleString('en-IN');
        UserDatabase.updateUser(user.email, { lastLogin: user.lastLogin });
        showNotification('Login successful! Redirecting…', 'success');
    }

    UserDatabase.setCurrentUser(user);
    localStorage.setItem('userCurrency',      user.currency      || 'INR');
    localStorage.setItem('userTheme',         user.theme         || 'light');
    localStorage.setItem('userLanguage',      user.language      || 'en');
    localStorage.setItem('userNotifications', String(user.notifications !== false));

    setTimeout(redirectToDashboard, 1500);
}

document.addEventListener('DOMContentLoaded', function() {
    if (UserDatabase.isLoggedIn()) { redirectToDashboard(); return; }

    function initGoogle() {
        if (window.google && google.accounts) {
            google.accounts.id.initialize({
                client_id: "484117256397-8ndar46hgs1mi3dppu20olndieiaq5o4.apps.googleusercontent.com",
                callback: handleCredentialResponse
            });
            google.accounts.id.renderButton(
                document.getElementById("googleSignInContainer"),
                { theme: "outline", size: "large", type: "standard", shape: "rectangular", text: "continue_with" }
            );
        }
    }
    
    // Try to init immediately if script loaded quickly
    initGoogle();
    // Also wait for window load in case it is loaded asynchronously later
    window.addEventListener('load', initGoogle);

    var loginForm    = document.getElementById('loginForm');
    var signupForm   = document.getElementById('signupForm');
    var loginToggle  = document.getElementById('loginToggle');
    var signupToggle = document.getElementById('signupToggle');
    var forgotLink   = document.getElementById('forgotPassword');
    var toggleCont   = document.querySelector('.toggle-container');

    function showLogin() {
        hideForgot();
        toggleCont.style.display = '';
        loginForm.style.display  = 'block';
        signupForm.style.display = 'none';
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
    }

    loginToggle.addEventListener('click', showLogin);

    signupToggle.addEventListener('click', function() {
        hideForgot();
        toggleCont.style.display = '';
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display  = 'none';
    });

    // ── LOGIN ────────────────────────────────────────────
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var ident = document.getElementById('loginEmail').value.trim();
        var pwd   = document.getElementById('loginPassword').value;
        if (!ident || !pwd) { showNotification('Please fill in all fields.', 'error'); return; }
        var user = UserDatabase.findByEmailOrPhone(ident);
        if (!user) { showNotification('No account found with this email or phone number.', 'error'); return; }
        if (user.password !== pwd) { showNotification('Incorrect password. Please try again.', 'error'); return; }
        user.lastLogin = new Date().toLocaleString('en-IN');
        UserDatabase.updateUser(user.email, { lastLogin: user.lastLogin });
        UserDatabase.setCurrentUser(user);
        localStorage.setItem('userCurrency',      user.currency      || 'INR');
        localStorage.setItem('userTheme',         user.theme         || 'light');
        localStorage.setItem('userLanguage',      user.language      || 'en');
        localStorage.setItem('userNotifications', String(user.notifications !== false));
        showNotification('Login successful! Redirecting…', 'success');
        var btn = loginForm.querySelector('.submit-btn');
        btn.disabled = true; btn.textContent = 'Signing in…';
        setTimeout(redirectToDashboard, 1500);
    });

    // ── SIGNUP ───────────────────────────────────────────
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var fn  = document.getElementById('signupFirstName').value.trim();
        var ln  = document.getElementById('signupLastName').value.trim();
        var em  = document.getElementById('signupEmail').value.trim();
        var ph  = document.getElementById('signupPhone').value.trim();
        var pw  = document.getElementById('signupPassword').value;
        var cpw = document.getElementById('signupConfirmPassword').value;
        var dob = document.getElementById('signupDob').value;
        var ok  = document.getElementById('termsAgree').checked;
        if (!fn||!ln||!em||!pw||!cpw) { showNotification('Please fill in all required fields.', 'error'); return; }
        if (!ok)                       { showNotification('Please agree to the Terms of Service.', 'error'); return; }
        if (!isValidEmail(em))         { showNotification('Please enter a valid email address.', 'error'); return; }
        if (pw.length < 6)             { showNotification('Password must be at least 6 characters.', 'error'); return; }
        if (pw !== cpw)                { showNotification('Passwords do not match.', 'error'); return; }
        if (ph && !isValidPhone(ph))   { showNotification('Please enter a valid phone number (10+ digits).', 'error'); return; }
        if (UserDatabase.findByEmail(em)) { showNotification('An account with this email already exists.', 'error'); return; }
        if (ph && UserDatabase.findByEmailOrPhone(ph)) { showNotification('An account with this phone number already exists.', 'error'); return; }
        var newUser = UserDatabase.addUser({ firstName:fn, lastName:ln, email:em, phone:ph, password:pw, dob:dob });
        initializeUserData(newUser.id);
        UserDatabase.setCurrentUser(newUser);
        localStorage.setItem('userCurrency',      newUser.currency      || 'INR');
        localStorage.setItem('userTheme',         newUser.theme         || 'light');
        localStorage.setItem('userLanguage',      newUser.language      || 'en');
        localStorage.setItem('userNotifications', String(newUser.notifications !== false));
        showNotification('Account created successfully! Redirecting…', 'success');
        var btn = signupForm.querySelector('.submit-btn');
        btn.disabled = true; btn.textContent = 'Creating account…';
        setTimeout(redirectToDashboard, 1500);
    });

    // ── FORGOT PASSWORD ──────────────────────────────────
    forgotLink.addEventListener('click', function(e) { e.preventDefault(); showForgotStep1(showLogin); });

    // Real-time validation
    document.getElementById('signupEmail').addEventListener('blur', function() {
        this.classList.toggle('invalid', !!(this.value && !isValidEmail(this.value)));
    });
    document.getElementById('signupPhone').addEventListener('blur', function() {
        this.classList.toggle('invalid', !!(this.value && !isValidPhone(this.value)));
    });
    document.getElementById('signupPassword').addEventListener('input', function() {
        var cf = document.getElementById('signupConfirmPassword');
        if (cf.value) cf.classList.toggle('invalid', this.value !== cf.value);
    });
    document.getElementById('signupConfirmPassword').addEventListener('input', function() {
        var pw = document.getElementById('signupPassword').value;
        if (pw) this.classList.toggle('invalid', this.value !== pw);
    });
});

// ── FORGOT — Step 1: enter email/phone ─────────────────────
function showForgotStep1(onBack) {
    hideForgot();
    var wrapper = document.querySelector('.login-wrapper');
    document.getElementById('loginForm').style.display  = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.querySelector('.toggle-container').style.display = 'none';

    var sec = document.createElement('div');
    sec.id  = 'forgotSection';
    sec.innerHTML =
        '<a href="#" id="fpBack1" style="color:#4a9eff;font-size:13px;text-decoration:none;display:inline-block;margin-bottom:20px;">← Back to Login</a>' +
        '<h3 style="color:#fff;font-size:22px;margin-bottom:8px;">Forgot Password?</h3>' +
        '<p style="color:#999;font-size:13px;margin-bottom:24px;">Enter the email or phone number linked to your account and we\'ll generate a security code.</p>' +
        '<div class="form-group"><input type="text" id="fpIdent" class="form-input" placeholder="Email address or phone number"></div>' +
        '<button type="button" class="submit-btn" id="fpSendBtn">Send Security Code</button>';
    wrapper.appendChild(sec);

    document.getElementById('fpBack1').addEventListener('click', function(e) {
        e.preventDefault(); if (onBack) onBack();
    });

    document.getElementById('fpSendBtn').addEventListener('click', function() {
        var ident = document.getElementById('fpIdent').value.trim();
        if (!ident) { showNotification('Please enter your email or phone number.', 'error'); return; }
        var user = UserDatabase.findByEmailOrPhone(ident);
        if (!user) { showNotification('No account found with this email or phone number.', 'error'); return; }
        fpCode    = Math.floor(100000 + Math.random() * 900000).toString();
        fpEmail   = user.email;
        fpExpires = Date.now() + 300000; // 5 min
        // Demo: show code in notification. In production, send via email/SMS.
        showNotification('Your security code is: ' + fpCode + '  (Demo — in production this would be sent to ' + user.email + ')', 'info');
        hideForgot();
        showForgotStep2(user.email, onBack);
    });
}

// ── FORGOT — Step 2: enter code + new password ─────────────
function showForgotStep2(email, onBack) {
    var wrapper = document.querySelector('.login-wrapper');
    var sec = document.createElement('div');
    sec.id  = 'forgotSection';
    sec.innerHTML =
        '<a href="#" id="fpBack2" style="color:#4a9eff;font-size:13px;text-decoration:none;display:inline-block;margin-bottom:20px;">← Back</a>' +
        '<h3 style="color:#fff;font-size:22px;margin-bottom:8px;">Enter Security Code</h3>' +
        '<p style="color:#999;font-size:13px;margin-bottom:24px;">Enter the 6-digit code sent to <strong style="color:#ddd;">' + email + '</strong>, then set your new password.</p>' +
        '<div class="form-group"><input type="text" id="fpCodeInput" class="form-input" placeholder="6-digit security code" maxlength="6" inputmode="numeric"></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
            '<span id="fpTimerTxt" style="font-size:13px;font-weight:600;color:#ff6b6b;">Expires in <span id="fpSecs">300</span>s</span>' +
            '<a href="#" id="fpResend" style="color:#555;font-size:12px;pointer-events:none;">Resend code</a>' +
        '</div>' +
        '<div class="form-group"><input type="password" id="fpNewPwd" class="form-input" placeholder="New password (min. 6 characters)"></div>' +
        '<div class="form-group"><input type="password" id="fpCfmPwd" class="form-input" placeholder="Confirm new password"></div>' +
        '<button type="button" class="submit-btn" id="fpResetBtn">Reset Password</button>';
    wrapper.appendChild(sec);

    // Timer
    if (fpTimer) clearInterval(fpTimer);
    fpTimer = setInterval(function() {
        var rem     = Math.max(0, Math.ceil((fpExpires - Date.now()) / 1000));
        var secsEl  = document.getElementById('fpSecs');
        var txtEl   = document.getElementById('fpTimerTxt');
        var rsndEl  = document.getElementById('fpResend');
        if (secsEl) secsEl.textContent = rem;
        if (rem <= 0) {
            clearInterval(fpTimer);
            if (txtEl)  { txtEl.textContent = 'Code expired'; txtEl.style.color = '#dc3545'; }
            if (rsndEl) { rsndEl.style.color = '#4a9eff'; rsndEl.style.pointerEvents = 'auto'; }
        } else if (rem <= 30 && txtEl) { txtEl.style.color = '#ff9800'; }
    }, 1000);

    document.getElementById('fpBack2').addEventListener('click', function(e) {
        e.preventDefault(); clearInterval(fpTimer); hideForgot(); showForgotStep1(onBack);
    });

    document.getElementById('fpResend').addEventListener('click', function(e) {
        e.preventDefault();
        if (this.style.pointerEvents === 'none') return;
        fpCode    = Math.floor(100000 + Math.random() * 900000).toString();
        fpExpires = Date.now() + 300000;
        showNotification('New code: ' + fpCode + ' (Demo)', 'info');
        clearInterval(fpTimer);
        hideForgot();
        showForgotStep2(email, onBack);
    });

    document.getElementById('fpResetBtn').addEventListener('click', function() {
        var code   = (document.getElementById('fpCodeInput').value || '').trim();
        var newPwd = document.getElementById('fpNewPwd').value;
        var cfmPwd = document.getElementById('fpCfmPwd').value;
        if (!code || code.length !== 6)       { showNotification('Please enter the 6-digit security code.', 'error'); return; }
        if (Date.now() > fpExpires)           { showNotification('The code has expired. Please request a new one.', 'error'); return; }
        if (code !== fpCode)                  { showNotification('Incorrect code. Please try again.', 'error'); document.getElementById('fpCodeInput').value = ''; return; }
        if (!newPwd || newPwd.length < 6)    { showNotification('Password must be at least 6 characters.', 'error'); return; }
        if (newPwd !== cfmPwd)                { showNotification('Passwords do not match.', 'error'); return; }
        var user = UserDatabase.findByEmail(fpEmail);
        if (user && user.password === newPwd) { showNotification('New password must differ from your current password.', 'error'); return; }
        if (UserDatabase.updatePassword(fpEmail, newPwd)) {
            clearInterval(fpTimer);
            fpCode = fpEmail = fpExpires = fpTimer = null;
            showNotification('Password reset successfully! Please log in with your new password.', 'success');
            if (onBack) onBack();
        } else {
            showNotification('Error resetting password. Please try again.', 'error');
        }
    });
}

function hideForgot() {
    var s = document.getElementById('forgotSection');
    if (s) s.remove();
    if (fpTimer) { clearInterval(fpTimer); fpTimer = null; }
}

// Keyframes + invalid style
var st = document.createElement('style');
st.textContent =
    '@keyframes slideInRight{from{opacity:0;transform:translateX(100px)}to{opacity:1;transform:translateX(0)}}' +
    '@keyframes slideOutRight{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(100px)}}' +
    '.form-input.invalid{border-color:#f44336!important;}';
document.head.appendChild(st);
