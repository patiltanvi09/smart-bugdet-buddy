// Reports Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize header functionality
    initializeHeader();

    // Initialize page
    initializePage();

    // Set up event listeners
    setupEventListeners();
});

function initializeHeader() {
    // Elements
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const profileBtn = document.getElementById('profileBtn');

    // Menu Toggle Functionality
    menuBtn.addEventListener('click', function() {
        const isActive = dropdownMenu.classList.contains('active');

        if (isActive) {
            // Close menu
            dropdownMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        } else {
            // Open menu
            dropdownMenu.classList.add('active');
            menuBtn.classList.add('active');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        }
    });

    // Close menu when clicking on a menu item
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            dropdownMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        });
    });

    // Add Transaction Button
    addTransactionBtn.addEventListener('click', function() {
        // Navigate to add transaction page
        window.location.href = '../add transaction/add.html';
    });

    // Profile Button
    profileBtn.addEventListener('click', function() {
        // Navigate to profile page
        window.location.href = '../profile/profile.html';
    });
}

function initializePage() {
    // Initialize charts
    initializeCharts();

    // Load initial data
    loadReportData();

    // Generate initial report
    generateReport();
}

function setupEventListeners() {
    // Report controls
    document.getElementById('reportType').addEventListener('change', generateReport);
    document.getElementById('timeRange').addEventListener('change', generateReport);
    document.getElementById('generateReport').addEventListener('click', generateReport);
}

function initializeCharts() {
    // Initialize Chart.js charts will be created in generateReport()
}

function loadReportData() {
    // Load data from localStorage or use sample data
    const transactions = getStoredTransactions();
    if (transactions.length === 0) {
        return getSampleReportData();
    }

    // Calculate summary from real transactions
    const summary = calculateReportSummary(transactions);
    const monthlyData = calculateMonthlyData(transactions);

    return {
        summary: summary,
        transactions: transactions,
        monthlyData: monthlyData
    };
}

// filter transactions array based on chosen time range
function filterByTimeRange(transactions, range) {
    // if there are no transactions (e.g. using sample data), skip filtering
    if (!transactions || transactions.length === 0 || range === 'all') {
        return transactions;
    }
    const now = new Date();
    return transactions.filter(tx => {
        const d = new Date(tx.date);
        switch (range) {
            case 'today':
                return d.toDateString() === now.toDateString();
            case 'week': {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return d >= weekAgo && d <= now;
            }
            case 'month':
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            case 'quarter': {
                const m = now.getMonth();
                const qStart = new Date(now.getFullYear(), Math.floor(m / 3) * 3, 1);
                return d >= qStart && d <= now;
            }
            case 'year':
                return d.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });
}

// updates the chart-section heading based on the currently selected report type
function updateChartTitle(reportType) {
    const heading = document.querySelector('.charts-section .chart-container h2');
    if (!heading) return;
    switch (reportType) {
        case 'overview':
            heading.textContent = 'Overview';
            break;
        case 'income-expense':
            heading.textContent = 'Income vs Expense';
            break;
        case 'category-breakdown':
            heading.textContent = 'Spending by Category';
            break;
        case 'monthly-trends':
            heading.textContent = 'Monthly Trends';
            break;
    }
}

function getStoredTransactions() {
    // Try to get transactions from localStorage
    const stored = localStorage.getItem('budgetBuddyTransactions');
    return stored ? JSON.parse(stored) : [];
}

function calculateReportSummary(transactions) {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount;
        } else {
            totalExpenses += tx.amount;
        }
    });

    const netSavings = totalIncome - totalExpenses;
    const avgMonthly = totalExpenses / 12; // Simple average, could be improved

    return {
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        netSavings: netSavings,
        avgMonthly: avgMonthly
    };
}

function calculateMonthlyData(transactions) {
    const monthlyIncome = new Array(12).fill(0);
    const monthlyExpenses = new Array(12).fill(0);
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const month = date.getMonth();

        if (tx.type === 'income') {
            monthlyIncome[month] += tx.amount;
        } else {
            monthlyExpenses[month] += tx.amount;
        }
    });

    return {
        labels: labels,
        income: monthlyIncome,
        expenses: monthlyExpenses
    };
}

function getSampleReportData() {
    return {
        summary: {
            totalIncome: 5250.00,
            totalExpenses: 1850.00,
            netSavings: 3400.00,
            avgMonthly: 1750.00
        },
        transactions: [
            { id: 1, type: 'income', amount: 3500.00, category: 'salary', date: '2024-03-01', description: 'Monthly salary' },
            { id: 2, type: 'expense', amount: 450.00, category: 'food', date: '2024-03-02', description: 'Groceries' },
            { id: 3, type: 'expense', amount: 250.00, category: 'transportation', date: '2024-03-03', description: 'Gas and maintenance' },
            { id: 4, type: 'expense', amount: 180.00, category: 'entertainment', date: '2024-03-04', description: 'Movies and dining' },
            { id: 5, type: 'expense', amount: 120.00, category: 'shopping', date: '2024-03-05', description: 'Clothing' },
            { id: 6, type: 'income', amount: 200.00, category: 'freelance', date: '2024-03-06', description: 'Freelance work' },
            { id: 7, type: 'expense', amount: 350.00, category: 'bills', date: '2024-03-07', description: 'Utilities' }
        ],
        monthlyData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            income: [4500, 4200, 5250, 4800, 5500, 5200, 5800, 5400, 6000, 5800, 6200, 5500],
            expenses: [1500, 1600, 1850, 1700, 1550, 1800, 1450, 1600, 1700, 1500, 1650, 1700]
        }
    };
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const timeRange = document.getElementById('timeRange').value;

    // Load all stored data
    const rawData = loadReportData();

    // apply time-range filter to transactions
    const filteredTransactions = filterByTimeRange(rawData.transactions, timeRange);

    // recalc summary and monthly datasets based on filtered transactions
    const summary = calculateReportSummary(filteredTransactions);
    const monthlyData = calculateMonthlyData(filteredTransactions);
    const data = {
        summary: summary,
        transactions: filteredTransactions,
        monthlyData: monthlyData
    };

    // update heading so user sees change immediately
    updateChartTitle(reportType);

    // Update summary cards with filtered totals
    updateSummaryCards(data.summary);

    // Generate appropriate chart based on report type
    switch (reportType) {
        case 'overview':
            generateOverviewChart(data);
            break;
        case 'income-expense':
            generateIncomeExpenseChart(data);
            break;
        case 'category-breakdown':
            generateCategoryBreakdownChart(data);
            break;
        case 'monthly-trends':
            generateMonthlyTrendsChart(data);
            break;
    }

    // Update category breakdown (always use filtered set so breakdown matches)
    updateCategoryBreakdown(data.transactions);
}

function updateSummaryCards(summary) {
    document.getElementById('totalIncome').textContent = `$${summary.totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${summary.totalExpenses.toFixed(2)}`;
    document.getElementById('netSavings').textContent = `$${summary.netSavings.toFixed(2)}`;
    document.getElementById('avgMonthly').textContent = `$${summary.avgMonthly.toFixed(2)}`;
}

function generateOverviewChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (window.mainChart) {
        window.mainChart.destroy();
    }

    window.mainChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses', 'Savings'],
            datasets: [{
                data: [data.summary.totalIncome, data.summary.totalExpenses, data.summary.netSavings],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(74, 158, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(74, 158, 255, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 500
                        }
                    }
                }
            }
        }
    });
}


function generateIncomeExpenseChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    if (window.mainChart) {
        window.mainChart.destroy();
    }

    window.mainChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Income', 'Total Expenses', 'Net Savings'],
            datasets: [{
                data: [data.summary.totalIncome, data.summary.totalExpenses, data.summary.netSavings],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',    // Green for income
                    'rgba(220, 53, 69, 0.8)',    // Red for expenses
                    'rgba(74, 158, 255, 0.8)'    // Blue for savings
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(74, 158, 255, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 500
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function generateCategoryBreakdownChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    // Calculate category totals
    const categoryTotals = {};
    data.transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
        }
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    if (window.mainChart) {
        window.mainChart.destroy();
    }

    window.mainChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories.map(cat => formatCategoryName(cat)),
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function generateMonthlyTrendsChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    if (window.mainChart) {
        window.mainChart.destroy();
    }

    const savings = data.monthlyData.income.map((income, index) => income - data.monthlyData.expenses[index]);

    window.mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.monthlyData.labels,
            datasets: [{
                label: 'Net Savings',
                data: savings,
                borderColor: 'rgba(74, 158, 255, 1)',
                backgroundColor: 'rgba(74, 158, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateCategoryBreakdown(transactions) {
    const breakdownList = document.getElementById('categoryBreakdown');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Calculate totals by category
    const categoryTotals = {};
    let totalExpenses = 0;

    expenseTransactions.forEach(transaction => {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
        totalExpenses += transaction.amount;
    });

    // Create breakdown items
    const breakdownHTML = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            return `
                <div class="breakdown-item">
                    <div class="breakdown-info">
                        <div class="breakdown-icon">${getCategoryIcon(category)}</div>
                        <div class="breakdown-details">
                            <div class="breakdown-category">${formatCategoryName(category)}</div>
                            <div class="breakdown-meta">${percentage}% of expenses</div>
                        </div>
                    </div>
                    <div class="breakdown-amount">
                        $${amount.toFixed(2)}
                        <span class="breakdown-percentage">(${percentage}%)</span>
                    </div>
                </div>
            `;
        }).join('');

    breakdownList.innerHTML = breakdownHTML;
}

function getCategoryIcon(category) {
    const icons = {
        food: '🍽️',
        transportation: '🚗',
        shopping: '🛍️',
        entertainment: '🎬',
        bills: '💡',
        healthcare: '🏥',
        education: '📚',
        travel: '✈️',
        other: '📦'
    };
    return icons[category] || '📦';
}

function formatCategoryName(category) {
    return category.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Export functions
function exportToPDF() {
    alert('PDF export functionality would be implemented here. This would generate a comprehensive PDF report.');
}

function exportToCSV() {
    alert('CSV export functionality would be implemented here. This would download transaction data as a CSV file.');
}

function printReport() {
    window.print();
}
