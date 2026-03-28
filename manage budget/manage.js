// ============================================================
// BUDGET BUDDY - MANAGE BUDGET (FIXED)
// ============================================================

const CURRENCY_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', INR:'₹' };
const CURRENCY_RATES   = { USD:1/83.12, EUR:0.92/83.12, GBP:0.79/83.12, JPY:151.50/83.12, INR:1 };

// When user enters budget amount in the modal, it is already in their chosen currency.
// We store it in INR, same as transactions.
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

function toINR(amount) {
    const rate = CURRENCY_RATES[getPrefs().currency] || 1;
    return amount / rate;
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

function getUser() { return JSON.parse(localStorage.getItem('currentUser')); }

function getTransactions() {
    const u = getUser(); if (!u) return [];
    return JSON.parse(localStorage.getItem('budgetTransactions_' + u.id) || '[]');
}

function getCategories() {
    const u = getUser(); if (!u) return [];
    return JSON.parse(localStorage.getItem('budgetCategories_' + u.id) || '[]');
}

function saveCategories(cats) {
    const u = getUser(); if (!u) return;
    localStorage.setItem('budgetCategories_' + u.id, JSON.stringify(cats));
}

function getGoals() {
    const u = getUser(); if (!u) return [];
    return JSON.parse(localStorage.getItem('budgetGoals_' + u.id) || '[]');
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
    const user = getUser();
    if (!user) { window.location.href = '../create/index.html'; return; }

    initHeader();
    refreshAll();

    // Re-render when data changes
    window.addEventListener('storage', function(e) {
        if (e.key && (e.key.includes('budget') || e.key.includes('userCurrency') || e.key.includes('userTheme'))) {
            applyTheme();
            refreshAll();
        }
    });

    setInterval(refreshAll, 3000);

    // Add category button
    const addCatBtn = document.getElementById('addCategoryBtn');
    if (addCatBtn) addCatBtn.addEventListener('click', openCategoryModal);

    // Category form submit
    const catForm = document.getElementById('categoryForm');
    if (catForm) catForm.addEventListener('submit', handleCategorySubmit);

    // Color options
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
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
    if (addBtn)     addBtn.addEventListener('click', ()=>window.location.href='../add transaction/add.html');
    if (profileBtn) profileBtn.addEventListener('click', ()=>window.location.href='../profile/profile.html');
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function(e) { e.preventDefault(); window.location.href=this.getAttribute('href'); });
    });
}

function refreshAll() {
    applyTheme();
    syncSpending();
    renderOverview();
    renderCategories();
    renderGoals();
}

// Sync category spending from actual transactions
function syncSpending() {
    const cats = getCategories();
    const txns = getTransactions();
    const now  = new Date();
    const m    = now.getMonth();
    const y    = now.getFullYear();
    let changed = false;

    cats.forEach(cat => {
        const newSpent = txns
            .filter(tx => {
                if (tx.type !== 'expense') return false;
                const d = new Date(tx.date);
                return d.getMonth()===m && d.getFullYear()===y && tx.category===cat.name;
            })
            .reduce((sum, tx) => sum + (parseFloat(tx.amount)||0), 0);
        if (cat.spent !== newSpent) { cat.spent = newSpent; changed = true; }
    });

    if (changed) saveCategories(cats);
}

function renderOverview() {
    const cats = getCategories();
    const totalBudget  = cats.reduce((s,c) => s+(parseFloat(c.budget)||0),0);
    const totalSpent   = cats.reduce((s,c) => s+(parseFloat(c.spent)||0),0);
    const totalRemain  = totalBudget - totalSpent;
    const utilization  = totalBudget > 0 ? ((totalSpent/totalBudget)*100).toFixed(0) : 0;

    const cards = document.querySelectorAll('.overview-card .card-value');
    if (cards.length >= 4) {
        cards[0].textContent = fmt(totalBudget);
        cards[1].textContent = fmt(totalSpent);
        cards[2].textContent = fmt(totalRemain);
        cards[3].textContent = utilization + '%';
    }
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    const cats = getCategories();

    if (cats.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666">
            No budget categories yet. Click "Add Category" to create your first budget category.</div>`;
        return;
    }

    grid.innerHTML = cats.map(cat => {
        const spent   = parseFloat(cat.spent)  || 0;
        const budget  = parseFloat(cat.budget) || 0;
        const pct     = budget > 0 ? Math.min((spent/budget)*100, 100) : 0;
        const over    = spent > budget && budget > 0;
        const remain  = budget - spent;
        const statusText = budget === 0 ? 'No budget set' : over ? `${fmt(Math.abs(remain))} over budget` : `${fmt(remain)} remaining`;
        return `
        <div class="category-card">
            <div class="category-header">
                <div class="category-icon" style="background:${cat.color||'#007bff'}">${getCatEmoji(cat.name)}</div>
                <div class="category-info"><h3>${cat.name}</h3></div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${pct}%;background:${over?'#dc3545':'#28a745'}"></div>
            </div>
            <div class="category-amounts">
                <div class="amount spent-amount">${fmt(spent)} spent</div>
                <div class="amount budget-amount">${fmt(budget)} budget</div>
                <div class="remaining-amount${over?' over-budget':''}">${statusText}</div>
            </div>
            <button onclick="deleteCategory('${cat.id}')" style="margin-top:10px;background:none;border:1px solid #dc3545;color:#dc3545;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;">Remove</button>
        </div>`;
    }).join('');
}

function getCatEmoji(name) {
    const map = {
        'Food & Dining':'🍽️','Transportation':'🚗','Shopping':'🛍️',
        'Entertainment':'🎬','Bills & Utilities':'💡','Healthcare':'🏥',
        'Education':'📚','Travel':'✈️','Other':'📦'
    };
    return map[name] || '📦';
}

window.deleteCategory = function(id) {
    if (!confirm('Remove this budget category?')) return;
    const cats = getCategories().filter(c=>c.id!==id);
    saveCategories(cats);
    refreshAll();
    showNotification('Category removed.', 'info');
};

function renderGoals() {
    const list = document.getElementById('goalsList');
    if (!list) return;
    const goals = getGoals().filter(g=>!g.fromCategory);

    if (goals.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:20px;color:#666">
            No savings goals set yet. Go to your Profile → Financial Goals to add a goal.</div>`;
        return;
    }

    list.innerHTML = goals.map(g => {
        const pct = g.target > 0 ? Math.min((g.current/g.target)*100, 100) : 0;
        let status='behind', statusText='Behind Schedule';
        if (pct>=100) { status='achieved'; statusText='Achieved! 🎉'; }
        else if (pct>=75) { status='progress'; statusText='Almost There!'; }
        else if (pct>=50) { status='progress'; statusText='On Track'; }
        return `
        <div class="goal-item">
            <div class="goal-info">
                <div class="goal-icon" style="background:${g.color||'linear-gradient(135deg,#28a745,#20c997)'}">🎯</div>
                <div class="goal-details">
                    <h4>${g.name}</h4>
                    <p>${fmt(g.current||0)} of ${fmt(g.target||0)} saved</p>
                </div>
            </div>
            <div class="goal-status ${status}">${statusText}</div>
        </div>`;
    }).join('');
}

function openCategoryModal() {
    const m = document.getElementById('categoryModal');
    if (m) { m.classList.add('show'); document.body.style.overflow='hidden'; }
}

window.closeCategoryModal = function() {
    const m = document.getElementById('categoryModal');
    if (m) {
        m.classList.remove('show');
        document.body.style.overflow='auto';
        const f = document.getElementById('categoryForm');
        if (f) f.reset();
    }
};

function handleCategorySubmit(e) {
    e.preventDefault();
    const user = getUser(); if (!user) return;

    const sel = document.getElementById('categoryName');
    if (!sel || !sel.value) { showNotification('Please select a category', 'error'); return; }

    const catValue   = sel.value;
    const catDisplay = sel.options[sel.selectedIndex].text;
    const rawBudget  = parseFloat(document.getElementById('budgetAmount').value);
    const color      = document.querySelector('input[name="categoryColor"]:checked')?.value || '#ff6b6b';

    if (!rawBudget || rawBudget <= 0) { showNotification('Please enter a valid budget amount', 'error'); return; }

    const cats = getCategories();
    if (cats.some(c => c.name.toLowerCase()===catDisplay.toLowerCase())) {
        showNotification('This category already exists!', 'error'); return;
    }

    const budgetINR = toINR(rawBudget); // store in INR

    cats.push({
        id    : 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2,9),
        name  : catDisplay,
        budget: budgetINR,
        spent : 0,
        color,
        userId: user.id
    });

    saveCategories(cats);
    window.closeCategoryModal();
    syncSpending();
    refreshAll();
    showNotification('Category added successfully!', 'success');
}
