// ============================================================
// BUDGET BUDDY - MAIN DASHBOARD (FIXED)
// ============================================================

// ---- SHARED UTILS (duplicated per page since no module system) ----
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
const CURRENCY_RATES   = { USD: 1/83.12, EUR: 0.92/83.12, GBP: 0.79/83.12, JPY: 151.50/83.12, INR: 1 };
// All amounts are stored in INR. To display in another currency: amount * CURRENCY_RATES[cur]

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
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
        document.body.style.background = '#0f1115';
        document.body.style.color = '#e0e0e0';
    } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        document.body.style.background = '#f4f6f7';
        document.body.style.color = '#333333';
    }
}

function getTransactions() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    return JSON.parse(localStorage.getItem('budgetTransactions_' + user.id) || '[]');
}

function getCategories() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    return JSON.parse(localStorage.getItem('budgetCategories_' + user.id) || '[]');
}

function getCategoryIcon(category) {
    const icons = {
        'Salary':'💼','salary':'💼','Freelance':'💻','freelance':'💻',
        'Business':'🏢','business':'🏢','Investment':'📈','investment':'📈',
        'Gift':'🎁','gift':'🎁','Other Income':'💰','other-income':'💰',
        'Food & Dining':'🍽️','food':'🍽️','Transportation':'🚗','transportation':'🚗',
        'Shopping':'🛍️','shopping':'🛍️','Entertainment':'🎬','entertainment':'🎬',
        'Bills & Utilities':'💡','bills':'💡','Healthcare':'🏥','healthcare':'🏥',
        'Education':'📚','education':'📚','Travel':'✈️','travel':'✈️',
        'Other Expense':'📦','other-expense':'📦','Other':'📦','other':'📦'
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
        warning:{ bg:'#5a4a00', border:'#ff9800', text:'#ffe0b2' },
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
        background:c.bg, border:`1px solid ${c.border}`, color:c.text,
        animation:'slideInRight .3s ease'
    });
    document.body.appendChild(n);
    setTimeout(()=>{ n.style.animation='slideOutRight .3s ease'; setTimeout(()=>n.remove(),300); },3500);
}

// ---- PAGE-SPECIFIC CODE ----
let financialChart = null;
applyTheme();

document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../create/index.html'; return; }

    initHeader();
    refreshDashboard();
    setupChartButtons();

    // Poll for changes (transactions, preferences)
    setInterval(refreshDashboard, 3000);

    // Listen cross-tab
    window.addEventListener('storage', function(e) {
        if (e.key && (e.key.includes('budgetTransactions') || e.key.includes('userCurrency') ||
            e.key.includes('userTheme') || e.key.includes('userLanguage'))) {
            applyTheme();
            refreshDashboard();
        }
    });
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
    if (addBtn) addBtn.addEventListener('click', ()=>{ window.location.href='../add transaction/add.html'; });
    if (profileBtn) profileBtn.addEventListener('click', ()=>{ window.location.href='../profile/profile.html'; });

    // Fix all menu links (prevent default, use href)
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.getAttribute('href');
        });
    });

    // Welcome message
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle && user) {
        welcomeTitle.textContent = `Welcome back, ${user.firstName || 'User'}!`;
    }
}

function refreshDashboard() {
    applyTheme();
    const txns = getTransactions();
    updateStats(txns);
    updateRecentTransactions(txns);
    const activeBtn = document.querySelector('.chart-btn.active');
    const type = (activeBtn && activeBtn.id === 'weeklyChartBtn') ? 'weekly' : 'monthly';
    renderChart(type, txns);
}

function updateStats(txns) {
    let income=0, expense=0;
    txns.forEach(tx => {
        if (tx.type === 'income') income += parseFloat(tx.amount)||0;
        else expense += parseFloat(tx.amount)||0;
    });
    const savings = income - expense;
    const el = (sel) => document.querySelector(sel);
    if (el('.income-text'))    el('.income-text').textContent    = fmt(income);
    if (el('.expense-text'))   el('.expense-text').textContent   = fmt(expense);
    if (el('.remaining-text')) el('.remaining-text').textContent = fmt(savings);
}

function updateRecentTransactions(txns) {
    const list = document.getElementById('transactionsList');
    if (!list) return;
    const recent = [...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
    if (recent.length === 0) {
        list.innerHTML = `<div class="transaction-item"><div class="transaction-icon">📋</div>
            <div class="transaction-details">
                <div class="transaction-title">No transactions yet</div>
                <div class="transaction-date">Click + to add your first transaction</div>
            </div></div>`;
        return;
    }
    list.innerHTML = recent.map(tx => `
        <div class="transaction-item" onclick="showTransactionDetail('${tx.id}')">
            <div class="transaction-icon">${getCategoryIcon(tx.category)}</div>
            <div class="transaction-details">
                <div class="transaction-title">${tx.category}</div>
                <div class="transaction-date">${formatDateStr(tx.date)}</div>
            </div>
            <div class="transaction-amount ${tx.type}">
                ${tx.type==='income'?'+':'-'}${fmt(parseFloat(tx.amount)||0)}
            </div>
        </div>`).join('');
}

function setupChartButtons() {
    const mb = document.getElementById('monthlyChartBtn');
    const wb = document.getElementById('weeklyChartBtn');
    if (mb) mb.addEventListener('click', ()=>{ mb.classList.add('active'); wb&&wb.classList.remove('active'); renderChart('monthly', getTransactions()); });
    if (wb) wb.addEventListener('click', ()=>{ wb.classList.add('active'); mb&&mb.classList.remove('active'); renderChart('weekly',  getTransactions()); });
}

function renderChart(type, txns) {
    const canvas = document.getElementById('financialChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prefs = getPrefs();
    const textColor = prefs.theme==='dark'?'#e0e0e0':'#333333';
    const gridColor = prefs.theme==='dark'?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)';

    let labels, incomeData, expenseData, savingsData;
    const now = new Date();

    if (type === 'monthly') {
        labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        incomeData  = new Array(12).fill(0);
        expenseData = new Array(12).fill(0);
        txns.forEach(tx => {
            const d = new Date(tx.date);
            if (d.getFullYear() === now.getFullYear()) {
                const m = d.getMonth();
                if (tx.type==='income')  incomeData[m]  += parseFloat(tx.amount)||0;
                else                     expenseData[m] += parseFloat(tx.amount)||0;
            }
        });
    } else {
        // This week Mon-Sun
        const startOfWeek = new Date(now);
        const day = now.getDay(); // 0=Sun
        startOfWeek.setDate(now.getDate() - (day===0?6:day-1));
        startOfWeek.setHours(0,0,0,0);
        labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        incomeData  = new Array(7).fill(0);
        expenseData = new Array(7).fill(0);
        txns.forEach(tx => {
            const d = new Date(tx.date); d.setHours(0,0,0,0);
            const diff = Math.round((d - startOfWeek)/(86400000));
            if (diff>=0 && diff<7) {
                if (tx.type==='income')  incomeData[diff]  += parseFloat(tx.amount)||0;
                else                     expenseData[diff] += parseFloat(tx.amount)||0;
            }
        });
    }
    savingsData = incomeData.map((v,i) => v - expenseData[i]);

    if (financialChart) { financialChart.destroy(); financialChart=null; }

    financialChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label:'Income',  data: incomeData,  backgroundColor:'rgba(40,167,69,.8)',  borderColor:'rgba(40,167,69,1)',  borderWidth:1 },
                { label:'Expense', data: expenseData, backgroundColor:'rgba(220,53,69,.8)',  borderColor:'rgba(220,53,69,1)',  borderWidth:1 },
                { label:'Savings', data: savingsData, backgroundColor:'rgba(54,162,235,.8)', borderColor:'rgba(54,162,235,1)', borderWidth:1, type:'line', fill:false, tension:.4 }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{
                legend:{ position:'top', labels:{ color:textColor, font:{size:12} } },
                tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } }
            },
            scales:{
                y:{ beginAtZero:true, ticks:{ callback:v=>fmt(v), color:textColor }, grid:{color:gridColor} },
                x:{ ticks:{ color:textColor }, grid:{color:gridColor} }
            }
        }
    });
}

// Transaction detail modal
window.showTransactionDetail = function(id) {
    const tx = getTransactions().find(t=>t.id===id);
    if (!tx) return;
    const modal = document.getElementById('transactionDetailModal');
    const body  = document.getElementById('transactionDetailBody');
    if (!modal||!body) return;
    body.innerHTML = `
        <div class="transaction-detail"><span class="detail-label">Type:</span><span class="detail-value ${tx.type}">${tx.type.toUpperCase()}</span></div>
        <div class="transaction-detail"><span class="detail-label">Amount:</span><span class="detail-value ${tx.type}">${fmt(parseFloat(tx.amount)||0)}</span></div>
        <div class="transaction-detail"><span class="detail-label">Category:</span><span class="detail-value">${tx.category}</span></div>
        <div class="transaction-detail"><span class="detail-label">Date:</span><span class="detail-value">${formatDateStr(tx.date)}</span></div>
        ${tx.paymentMethod?`<div class="transaction-detail"><span class="detail-label">Payment:</span><span class="detail-value">${tx.paymentMethod.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</span></div>`:''}
        ${tx.description?`<div class="transaction-detail"><span class="detail-label">Note:</span><span class="detail-value">${tx.description}</span></div>`:''}`;
    modal.classList.add('show');
};

window.closeTransactionModal = function() {
    const m = document.getElementById('transactionDetailModal');
    if (m) m.classList.remove('show');
};

document.addEventListener('click', e => {
    const m = document.getElementById('transactionDetailModal');
    if (m && e.target===m) window.closeTransactionModal();
});
