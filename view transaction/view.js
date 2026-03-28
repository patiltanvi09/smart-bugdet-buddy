// ============================================================
// BUDGET BUDDY - VIEW TRANSACTIONS (FIXED)
// ============================================================

const CURRENCY_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', INR:'₹' };
const CURRENCY_RATES   = { USD:1/83.12, EUR:0.92/83.12, GBP:0.79/83.12, JPY:151.50/83.12, INR:1 };

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

function getTransactions() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    return JSON.parse(localStorage.getItem('budgetTransactions_' + user.id) || '[]');
}

function getCategoryIcon(category) {
    const icons = {
        'Salary':'💼','Freelance':'💻','Business':'🏢','Investment':'📈','Gift':'🎁',
        'Other Income':'💰','Food & Dining':'🍽️','Transportation':'🚗','Shopping':'🛍️',
        'Entertainment':'🎬','Bills & Utilities':'💡','Healthcare':'🏥','Education':'📚',
        'Travel':'✈️','Other Expense':'📦','Other':'📦'
    };
    return icons[category] || '📦';
}

function formatDateStr(ds) {
    return new Date(ds).toLocaleDateString(getPrefs().language || 'en', { year:'numeric', month:'short', day:'numeric' });
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
        maxWidth:'400px',background:c.bg,border:`1px solid ${c.border}`,color:c.text
    });
    document.body.appendChild(n);
    setTimeout(()=>n.remove(), 3500);
}

applyTheme();

document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../create/create.html'; return; }

    initHeader();
    loadAll();
    setupFilters();

    // Re-render on storage changes
    window.addEventListener('storage', function(e) {
        if (e.key && (e.key.includes('budgetTransactions') || e.key.includes('userCurrency') || e.key.includes('userTheme'))) {
            applyTheme();
            loadAll();
        }
    });

    setInterval(loadAll, 3000);
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
        link.addEventListener('click', function(e) { e.preventDefault(); window.location.href=this.getAttribute('href'); });
    });
}

function setupFilters() {
    ['filterType','filterCategory','filterDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });
    const search = document.getElementById('search');
    if (search) search.addEventListener('input', applyFilters);
}

function loadAll() {
    applyTheme();
    const txns = getTransactions();
    updateStats(txns);
    populateCategoryFilter(txns);
    applyFilters();
}

function updateStats(txns) {
    let income=0, expense=0;
    txns.forEach(tx => {
        if (tx.type==='income') income  += parseFloat(tx.amount)||0;
        else                    expense += parseFloat(tx.amount)||0;
    });
    const el = s => document.querySelector(s);
    if (el('.income-text'))    el('.income-text').textContent    = fmt(income);
    if (el('.expense-text'))   el('.expense-text').textContent   = fmt(expense);
    if (el('.remaining-text')) el('.remaining-text').textContent = fmt(income - expense);
}

function populateCategoryFilter(txns) {
    if (!txns) txns = getTransactions();
    const cats = [...new Set(txns.map(tx=>tx.category))].sort();
    const sel  = document.getElementById('filterCategory');
    if (!sel) return;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        sel.appendChild(opt);
    });
    if (current !== 'all' && cats.includes(current)) sel.value = current;
}

function applyFilters() {
    const typeF  = document.getElementById('filterType')?.value     || 'all';
    const catF   = document.getElementById('filterCategory')?.value || 'all';
    const dateF  = document.getElementById('filterDate')?.value     || 'all';
    const search = (document.getElementById('search')?.value || '').toLowerCase();

    const now   = new Date();
    const allTx = getTransactions();

    const filtered = allTx.filter(tx => {
        if (typeF !== 'all' && tx.type !== typeF) return false;
        if (catF  !== 'all' && tx.category !== catF) return false;
        if (dateF !== 'all') {
            const d = new Date(tx.date);
            if (dateF==='today' && d.toDateString()!==now.toDateString()) return false;
            if (dateF==='week') {
                const weekAgo = new Date(now); weekAgo.setDate(now.getDate()-7);
                if (d < weekAgo) return false;
            }
            if (dateF==='month' && (d.getMonth()!==now.getMonth()||d.getFullYear()!==now.getFullYear())) return false;
            if (dateF==='year' && d.getFullYear()!==now.getFullYear()) return false;
        }
        if (search) {
            const text = `${tx.category} ${tx.description||''}`.toLowerCase();
            if (!text.includes(search)) return false;
        }
        return true;
    }).sort((a,b)=>new Date(b.date)-new Date(a.date));

    renderTransactions(filtered);
}

function renderTransactions(txns) {
    const list  = document.getElementById('transactionsList');
    const count = document.getElementById('transactionCount');
    if (!list) return;
    if (count) count.textContent = txns.length;

    if (txns.length === 0) {
        list.innerHTML = `<div class="no-transactions">
            <div class="no-transactions-icon">📋</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or add a new transaction.</p>
            <button class="btn btn-primary" onclick="window.location.href='../add transaction/add.html'">Add Transaction</button>
        </div>`;
        return;
    }

    list.innerHTML = txns.map(tx => `
        <div class="transaction-item" onclick="showTxDetail('${tx.id}')">
            <div class="transaction-info">
                <div class="transaction-icon ${tx.type}">${getCategoryIcon(tx.category)}</div>
                <div class="transaction-details">
                    <div class="transaction-title">${tx.category}</div>
                    <div class="transaction-meta">${formatDateStr(tx.date)} • ${tx.description||'No description'}</div>
                </div>
            </div>
            <div class="transaction-amount ${tx.type}">
                ${tx.type==='income'?'+':'-'}${fmt(parseFloat(tx.amount)||0)}
            </div>
        </div>`).join('');
}

window.showTxDetail = function(id) {
    const tx = getTransactions().find(t=>t.id===id);
    if (!tx) return;
    const modal   = document.getElementById('transactionModal');
    const details = document.getElementById('transactionDetails');
    if (!modal||!details) return;
    details.innerHTML = `
        <div class="transaction-detail"><span class="detail-label">Type:</span><span class="detail-value ${tx.type}">${tx.type.toUpperCase()}</span></div>
        <div class="transaction-detail"><span class="detail-label">Amount:</span><span class="detail-value ${tx.type}">${fmt(parseFloat(tx.amount)||0)}</span></div>
        <div class="transaction-detail"><span class="detail-label">Category:</span><span class="detail-value">${tx.category}</span></div>
        <div class="transaction-detail"><span class="detail-label">Date:</span><span class="detail-value">${formatDateStr(tx.date)}</span></div>
        <div class="transaction-detail"><span class="detail-label">Payment:</span><span class="detail-value">${(tx.paymentMethod||'Not specified').replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</span></div>
        ${tx.description?`<div class="transaction-detail"><span class="detail-label">Note:</span><span class="detail-value">${tx.description}</span></div>`:''}`;
    modal.classList.add('show');
};

window.closeTransactionModal = function() {
    const m = document.getElementById('transactionModal');
    if (m) m.classList.remove('show');
};

document.addEventListener('click', e => {
    const m = document.getElementById('transactionModal');
    if (m && e.target===m) window.closeTransactionModal();
});
