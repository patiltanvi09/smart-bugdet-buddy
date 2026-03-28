// ============================================================
// BUDGET BUDDY - REPORTS (FIXED)
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
    const u = JSON.parse(localStorage.getItem('currentUser'));
    if (!u) return [];
    return JSON.parse(localStorage.getItem('budgetTransactions_' + u.id) || '[]');
}

function getCategoryIcon(cat) {
    const m = { 'Salary':'💼','Freelance':'💻','Business':'🏢','Investment':'📈','Gift':'🎁',
                 'Other Income':'💰','Food & Dining':'🍽️','Transportation':'🚗','Shopping':'🛍️',
                 'Entertainment':'🎬','Bills & Utilities':'💡','Healthcare':'🏥','Education':'📚',
                 'Travel':'✈️','Other Expense':'📦','Other':'📦' };
    return m[cat] || '📦';
}

function showNotification(msg, type='info') {
    document.querySelectorAll('.bb-notif').forEach(n=>n.remove());
    const colors = { success:{bg:'#2d5016',border:'#4caf50',text:'#c8e6c9'},
                     error:{bg:'#5a1a1a',border:'#f44336',text:'#ffcdd2'},
                     info:{bg:'#1a3a5a',border:'#2196f3',text:'#bbdefb'},
                     warning:{bg:'#5a4a00',border:'#ff9800',text:'#ffe0b2'} };
    const c = colors[type]||colors.info;
    const n = document.createElement('div'); n.className='bb-notif'; n.textContent=msg;
    Object.assign(n.style,{position:'fixed',top:'20px',right:'20px',padding:'15px 20px',
        borderRadius:'8px',fontSize:'14px',fontWeight:'500',zIndex:'9999',maxWidth:'400px',
        background:c.bg,border:`1px solid ${c.border}`,color:c.text});
    document.body.appendChild(n);
    setTimeout(()=>n.remove(),3500);
}

let mainChart = null;
let categoryChart = null;
applyTheme();

document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = '../create/index.html'; return; }

    initHeader();
    generateReport();

    document.getElementById('generateReport')?.addEventListener('click', generateReport);
    document.getElementById('reportType')?.addEventListener('change', generateReport);
    document.getElementById('timeRange')?.addEventListener('change', generateReport);

    window.addEventListener('storage', function(e) {
        if (e.key && (e.key.includes('budgetTransactions') || e.key.includes('userCurrency') || e.key.includes('userTheme'))) {
            applyTheme();
            generateReport();
        }
    });

    setInterval(generateReport, 5000);
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

function filterByRange(txns, range) {
    const now = new Date();
    return txns.filter(tx => {
        const d = new Date(tx.date);
        if (range==='month')   return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
        if (range==='quarter') {
            const q = Math.floor(now.getMonth()/3);
            return Math.floor(d.getMonth()/3)===q && d.getFullYear()===now.getFullYear();
        }
        if (range==='year') return d.getFullYear()===now.getFullYear();
        return true; // 'all'
    });
}

function generateReport() {
    applyTheme();
    const reportType = document.getElementById('reportType')?.value || 'income-expense';
    const timeRange  = document.getElementById('timeRange')?.value  || 'all';
    const allTxns    = getTransactions();
    const txns       = filterByRange(allTxns, timeRange);

    // Summary cards
    let income=0, expense=0;
    txns.forEach(tx => {
        if (tx.type==='income') income  += parseFloat(tx.amount)||0;
        else                    expense += parseFloat(tx.amount)||0;
    });
    const savings = income - expense;

    // Avg monthly: get number of unique months
    const months = new Set(txns.map(tx => {
        const d = new Date(tx.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
    })).size || 1;
    const avgMonthly = expense / months;

    const el = id => document.getElementById(id);
    if (el('totalIncome'))   el('totalIncome').textContent   = fmt(income);
    if (el('totalExpenses')) el('totalExpenses').textContent = fmt(expense);
    if (el('netSavings'))    el('netSavings').textContent    = fmt(savings);
    if (el('avgMonthly'))    el('avgMonthly').textContent    = fmt(avgMonthly);

    // Charts
    if (reportType === 'income-expense' || reportType === 'overview') {
        renderMainChart(txns, reportType);
    } else if (reportType === 'monthly-trends') {
        renderMonthlyTrendsChart(txns);
    } else {
        renderCategoryBarChart(txns);
    }

    renderCategoryPieChart(txns);
    renderBreakdown(txns);
}

function renderMainChart(txns, type) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    // Restore canvas if needed
    const parent = canvas.parentNode;
    if (!document.getElementById('mainChart')) {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'mainChart';
        parent.appendChild(newCanvas);
    }

    const ctx = canvas.getContext('2d');
    const prefs = getPrefs();
    const textColor = prefs.theme==='dark'?'#e0e0e0':'#333333';
    const gridColor = prefs.theme==='dark'?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)';

    // Group by month
    const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const incomeArr  = new Array(12).fill(0);
    const expenseArr = new Array(12).fill(0);
    const now = new Date();

    txns.forEach(tx => {
        const d = new Date(tx.date);
        if (d.getFullYear()===now.getFullYear()) {
            if (tx.type==='income')  incomeArr[d.getMonth()]  += parseFloat(tx.amount)||0;
            else                     expenseArr[d.getMonth()] += parseFloat(tx.amount)||0;
        }
    });

    const savingsArr = incomeArr.map((v,i)=>v-expenseArr[i]);

    if (mainChart) { mainChart.destroy(); mainChart=null; }

    mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label:'Income',  data:incomeArr,  backgroundColor:'rgba(40,167,69,.8)' },
                { label:'Expense', data:expenseArr, backgroundColor:'rgba(220,53,69,.8)' },
                { label:'Savings', data:savingsArr, backgroundColor:'rgba(54,162,235,.8)', type:'line', fill:false, tension:.4, borderColor:'rgba(54,162,235,1)', borderWidth:2 }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{position:'top',labels:{color:textColor}}, tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw)}`}} },
            scales:{ y:{beginAtZero:true,ticks:{callback:v=>fmt(v),color:textColor},grid:{color:gridColor}}, x:{ticks:{color:textColor},grid:{color:gridColor}} }
        }
    });
}

function renderMonthlyTrendsChart(txns) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prefs = getPrefs();
    const textColor = prefs.theme==='dark'?'#e0e0e0':'#333333';
    const gridColor = prefs.theme==='dark'?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)';

    const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const expenseArr = new Array(12).fill(0);
    const now = new Date();

    txns.forEach(tx => {
        const d = new Date(tx.date);
        if (tx.type==='expense' && d.getFullYear()===now.getFullYear()) {
            expenseArr[d.getMonth()] += parseFloat(tx.amount)||0;
        }
    });

    if (mainChart) { mainChart.destroy(); mainChart=null; }

    mainChart = new Chart(ctx, {
        type:'line',
        data:{ labels:months, datasets:[{ label:'Monthly Expenses', data:expenseArr, borderColor:'rgba(220,53,69,1)', backgroundColor:'rgba(220,53,69,.1)', fill:true, tension:.4 }] },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{position:'top',labels:{color:textColor}}, tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw)}`}} },
            scales:{ y:{beginAtZero:true,ticks:{callback:v=>fmt(v),color:textColor},grid:{color:gridColor}}, x:{ticks:{color:textColor},grid:{color:gridColor}} }
        }
    });
}

function renderCategoryBarChart(txns) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prefs = getPrefs();
    const textColor = prefs.theme==='dark'?'#e0e0e0':'#333333';

    const catTotals = {};
    txns.filter(tx=>tx.type==='expense').forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category]||0) + (parseFloat(tx.amount)||0);
    });
    const cats   = Object.keys(catTotals);
    const amounts = Object.values(catTotals);

    if (cats.length===0) {
        canvas.parentNode.innerHTML = `<h2>Spending by Category</h2><p style="text-align:center;padding:40px;color:#666">No expense data for this period.</p>`;
        return;
    }

    const colors = cats.map((_,i) => `hsl(${(i*137)%360},70%,55%)`);

    if (mainChart) { mainChart.destroy(); mainChart=null; }

    mainChart = new Chart(ctx, {
        type:'bar',
        data:{ labels:cats, datasets:[{ label:'Spending', data:amounts, backgroundColor:colors }] },
        options:{
            responsive:true, maintainAspectRatio:false, indexAxis:'y',
            plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>`${fmt(c.raw)}`}} },
            scales:{ x:{beginAtZero:true,ticks:{callback:v=>fmt(v),color:textColor}}, y:{ticks:{color:textColor}} }
        }
    });
}

function renderCategoryPieChart(txns) {
    const canvas = document.getElementById('categoryChart');
    const parent = canvas?.parentNode;
    if (!parent) return;

    const catTotals = {};
    txns.filter(tx=>tx.type==='expense').forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category]||0) + (parseFloat(tx.amount)||0);
    });

    const cats   = Object.keys(catTotals);
    const amounts = Object.values(catTotals);

    if (cats.length===0) {
        if (categoryChart) { categoryChart.destroy(); categoryChart=null; }
        parent.innerHTML = `<h2>Spending by Category</h2><p style="text-align:center;padding:40px;color:#666">No expense data available.</p>`;
        return;
    }

    // Recreate canvas if innerHTML was replaced
    let cvs = document.getElementById('categoryChart');
    if (!cvs) {
        parent.innerHTML = '<h2>Spending by Category</h2><canvas id="categoryChart"></canvas>';
        cvs = document.getElementById('categoryChart');
    }

    const ctx = cvs.getContext('2d');
    const prefs = getPrefs();
    const textColor = prefs.theme==='dark'?'#e0e0e0':'#333333';
    const colors = cats.map((_,i) => `hsl(${(i*137)%360},65%,55%)`);

    if (categoryChart) { categoryChart.destroy(); categoryChart=null; }

    categoryChart = new Chart(ctx, {
        type:'pie',
        data:{ labels:cats, datasets:[{ data:amounts, backgroundColor:colors, borderWidth:1 }] },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{
                legend:{position:'right',labels:{boxWidth:12,padding:12,color:textColor,font:{size:11}}},
                tooltip:{callbacks:{label:c=>{
                    const total = c.dataset.data.reduce((a,b)=>a+b,0);
                    const pct = total>0?((c.raw/total)*100).toFixed(1):0;
                    return `${c.label}: ${fmt(c.raw)} (${pct}%)`;
                }}}
            }
        }
    });
}

function renderBreakdown(txns) {
    const list = document.getElementById('categoryBreakdown');
    if (!list) return;

    const expTxns = txns.filter(t=>t.type==='expense');
    if (expTxns.length===0) {
        list.innerHTML='<p style="text-align:center;padding:20px;color:#666">No expense data for the selected period.</p>';
        return;
    }

    const catTotals = {};
    let totalExp = 0;
    expTxns.forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category]||0)+(parseFloat(tx.amount)||0);
        totalExp += parseFloat(tx.amount)||0;
    });

    list.innerHTML = Object.entries(catTotals)
        .sort(([,a],[,b])=>b-a)
        .map(([cat,amount])=>{
            const pct = totalExp>0?((amount/totalExp)*100).toFixed(1):0;
            return `
            <div class="breakdown-item">
                <div class="breakdown-info">
                    <div class="breakdown-icon">${getCategoryIcon(cat)}</div>
                    <div class="breakdown-details">
                        <div class="breakdown-category">${cat}</div>
                        <div class="breakdown-meta">${pct}% of total expenses</div>
                    </div>
                </div>
                <div class="breakdown-amount">${fmt(amount)}<span class="breakdown-percentage">(${pct}%)</span></div>
            </div>`;
        }).join('');
}

// Export functions
window.exportToPDF  = () => showNotification('PDF export coming soon!','info');
window.printReport  = () => window.print();
window.exportToCSV  = function() {
    const txns = getTransactions();
    if (!txns.length) { showNotification('No transactions to export','warning'); return; }
    let csv = 'Date,Type,Category,Amount (INR),Description,Payment Method\n';
    txns.forEach(tx => {
        csv += `${tx.date},${tx.type},${tx.category},${(parseFloat(tx.amount)||0).toFixed(2)},${tx.description||''},${tx.paymentMethod||''}\n`;
    });
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `budget_buddy_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showNotification('CSV exported!','success');
};
