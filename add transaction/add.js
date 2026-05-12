// ============================================================
// BUDGET BUDDY - ADD TRANSACTION (FIXED)
// ============================================================

const CURRENCY_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', INR:'₹' };
const CURRENCY_RATES   = { USD:1/83.12, EUR:0.92/83.12, GBP:0.79/83.12, JPY:151.50/83.12, INR:1 };

// Category value → display name map (matches option values in HTML)
const CATEGORY_DISPLAY = {
    'salary':'Salary','freelance':'Freelance','business':'Business',
    'investment':'Investment','gift':'Gift','other-income':'Other Income',
    'food':'Food & Dining','transportation':'Transportation','shopping':'Shopping',
    'entertainment':'Entertainment','bills':'Bills & Utilities','healthcare':'Healthcare',
    'education':'Education','travel':'Travel','other-expense':'Other Expense'
};

function getPrefs() {
    return {
        currency : localStorage.getItem('userCurrency')  || 'INR',
        theme    : localStorage.getItem('userTheme')     || 'light',
        language : localStorage.getItem('userLanguage')  || 'en'
    };
}

function fmt(amountINR) {
    const { currency } = getPrefs();
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const rate   = CURRENCY_RATES[currency]   || 1;
    return symbol + (amountINR * rate).toFixed(2);
}

// Convert displayed amount back to INR for storage
function toINR(amount) {
    const { currency } = getPrefs();
    const rate = CURRENCY_RATES[currency] || 1;
    return amount / rate;   // displayed → INR
}

function applyTheme() {
    const theme = getPrefs().theme;
    if (theme === 'dark') {
        document.body.style.background = '#1a1d23';
        document.body.style.color = '#e0e0e0';
    } else {
        document.body.style.background = '#f4f6f7';
        document.body.style.color = '#333333';
    }
}

function updateCurrencySymbol() {
    const sym = document.querySelector('.currency-symbol');
    if (sym) sym.textContent = CURRENCY_SYMBOLS[getPrefs().currency] || '₹';
}

function showNotification(msg, type='info') {
    document.querySelectorAll('.bb-notif').forEach(n=>n.remove());
    const colors = {
        success:{ bg:'#2d5016', border:'#4caf50', text:'#c8e6c9' },
        error  :{ bg:'#5a1a1a', border:'#f44336', text:'#ffcdd2' },
        info   :{ bg:'#1a3a5a', border:'#2196f3', text:'#bbdefb' }
    };
    const c = colors[type] || colors.info;
    const n = document.createElement('div');
    n.className = 'bb-notif';
    n.textContent = msg;
    Object.assign(n.style,{
        position:'fixed',top:'20px',right:'20px',padding:'15px 20px',
        borderRadius:'8px',fontSize:'14px',fontWeight:'500',zIndex:'9999',
        maxWidth:'400px',boxShadow:'0 4px 12px rgba(0,0,0,.15)',
        background:c.bg, border:`1px solid ${c.border}`, color:c.text
    });
    document.body.appendChild(n);
    setTimeout(()=>n.remove(), 3500);
}

// Apply immediately on load
applyTheme();

document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../create/index.html'; return; }

    initHeader();
    updateCurrencySymbol();

    // Set today as default date
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Transaction type radio → toggle categories
    document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
        radio.addEventListener('change', toggleCategories);
    });
    toggleCategories();

    // Form submit
    const form = document.getElementById('transactionForm');
    if (form) form.addEventListener('submit', handleSubmit);

    // Listen for pref changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'userCurrency') { updateCurrencySymbol(); }
        if (e.key === 'userTheme')    { applyTheme(); }
    });

    setInterval(()=>{ applyTheme(); updateCurrencySymbol(); }, 1000);
});

function initHeader() {
    const menuBtn      = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const addBtn       = document.getElementById('addTransactionBtn');
    const profileBtn   = document.getElementById('profileBtn');

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
    if (addBtn)     addBtn.addEventListener('click', ()=>window.location.href='../add transaction/add.html');
    if (profileBtn) profileBtn.addEventListener('click', ()=>window.location.href='../profile/profile.html');

    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.getAttribute('href');
        });
    });
}

function toggleCategories() {
    const type = document.querySelector('input[name="transactionType"]:checked')?.value || 'expense';
    const incGrp = document.getElementById('incomeCategories');
    const expGrp = document.getElementById('expenseCategories');
    const catSel = document.getElementById('category');
    if (!incGrp || !expGrp || !catSel) return;

    if (type === 'income') {
        incGrp.style.display = '';
        expGrp.style.display = 'none';
    } else {
        incGrp.style.display = 'none';
        expGrp.style.display = '';
    }
    catSel.value = '';
}

function validateForm() {
    const amount   = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date     = document.getElementById('date').value;
    const errors   = [];

    if (!amount || parseFloat(amount) <= 0) errors.push('Please enter a valid amount greater than 0');
    if (!category) errors.push('Please select a category');
    if (!date)     errors.push('Please select a date');

    const existing = document.getElementById('formErrors');
    if (existing) existing.remove();

    if (errors.length > 0) {
        const div = document.createElement('div');
        div.id = 'formErrors';
        div.style.cssText='background:#f8d7da;color:#721c24;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:14px;';
        div.innerHTML = '<strong>Please fix:</strong><br>' + errors.join('<br>');
        const fc = document.querySelector('.form-container');
        if (fc) fc.insertBefore(div, document.querySelector('.transaction-form'));
        return false;
    }
    return true;
}

function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const catValue   = document.getElementById('category').value;
    const catDisplay = CATEGORY_DISPLAY[catValue] || catValue; // Use display name for storage

    const rawAmount  = parseFloat(document.getElementById('amount').value) || 0;
    const amountINR  = toINR(rawAmount); // Convert input currency → INR for storage

    const tx = {
        id           : 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2,9),
        type         : document.querySelector('input[name="transactionType"]:checked').value,
        amount       : amountINR,            // always stored in INR
        categoryValue: catValue,             // raw select value
        category     : catDisplay,           // display name used everywhere
        date         : document.getElementById('date').value,
        description  : document.getElementById('description').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        timestamp    : new Date().toISOString()
    };

    // Save transaction
    const key = 'budgetTransactions_' + user.id;
    const txns = JSON.parse(localStorage.getItem(key) || '[]');
    txns.push(tx);
    localStorage.setItem(key, JSON.stringify(txns));

    // Sync budget category spending if expense
    if (tx.type === 'expense') {
        syncCategorySpending(user.id, tx);
    }

    // Show success modal
    const modal = document.getElementById('successModal');
    if (modal) {
        const body = modal.querySelector('.modal-body p');
        if (body) body.textContent = `${tx.type === 'income' ? 'Income' : 'Expense'} of ${fmt(amountINR)} (${catDisplay}) recorded.`;
        modal.classList.add('show');
    }
}

function syncCategorySpending(userId, newTx) {
    // Re-calculate spending for all categories from scratch (accurate)
    const allTxns = JSON.parse(localStorage.getItem('budgetTransactions_' + userId) || '[]');
    const cats    = JSON.parse(localStorage.getItem('budgetCategories_'    + userId) || '[]');
    const now     = new Date();
    const curM    = now.getMonth();
    const curY    = now.getFullYear();

    cats.forEach(cat => {
        cat.spent = 0;
        allTxns.forEach(tx => {
            if (tx.type !== 'expense') return;
            const d = new Date(tx.date);
            if (d.getMonth() === curM && d.getFullYear() === curY && tx.category === cat.name) {
                cat.spent += parseFloat(tx.amount) || 0;
            }
        });
    });

    localStorage.setItem('budgetCategories_' + userId, JSON.stringify(cats));
}

window.closeModal = function() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('show');
    // Reset form and go to dashboard
    const form = document.getElementById('transactionForm');
    if (form) form.reset();
    toggleCategories();
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    setTimeout(()=>{ window.location.href = '../main-page/main.html'; }, 200);
};
