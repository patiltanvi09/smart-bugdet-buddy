// Header Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const profileBtn = document.getElementById('profileBtn');
    const monthlyChartBtn = document.getElementById('monthlyChartBtn');
    const weeklyChartBtn = document.getElementById('weeklyChartBtn');
    let financialChart = null;

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
        // Open profile page in new window/tab
        window.open('profile.html', '_blank');
    });

    // Chart Button Functionality
    monthlyChartBtn.addEventListener('click', function() {
        monthlyChartBtn.classList.add('active');
        weeklyChartBtn.classList.remove('active');
        updateChart('monthly');
    });

    weeklyChartBtn.addEventListener('click', function() {
        weeklyChartBtn.classList.add('active');
        monthlyChartBtn.classList.remove('active');
        updateChart('weekly');
    });

    // Initialize Chart
    function initializeChart() {
        const ctx = document.getElementById('financialChart');
        if (!ctx) return;

        financialChart = new Chart(ctx, {
            type: 'bar',
            data: getMonthlyData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                weight: 500
                            },
                            color: '#333333'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#666666',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#666666',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }

    function updateChart(type) {
        if (!financialChart) return;

        const newData = type === 'monthly' ? getMonthlyData() : getWeeklyData();
        financialChart.data = newData;
        financialChart.update();
    }

    // Transaction data helpers
    function getStoredTransactions() {
        const stored = localStorage.getItem('budgetBuddyTransactions');
        return stored ? JSON.parse(stored) : [];
    }

    function calculateTotals(transactions) {
        let income = 0;
        let expense = 0;
        transactions.forEach(tx => {
            if (tx.type === 'income') {
                income += tx.amount;
            } else {
                expense += tx.amount;
            }
        });
        const remaining = income - expense;
        return { income, expense, remaining };
    }

    function updateStats() {
        const tx = getStoredTransactions();
        const { income, expense, remaining } = calculateTotals(tx);
        const incEl = document.querySelector('.income-text');
        const expEl = document.querySelector('.expense-text');
        const remEl = document.querySelector('.remaining-text');
        if (incEl) incEl.textContent = `$${income.toFixed(2)}`;
        if (expEl) expEl.textContent = `$${expense.toFixed(2)}`;
        if (remEl) remEl.textContent = `$${remaining.toFixed(2)}`;

        // refresh chart to match totals
        if (typeof updateChart === 'function' && financialChart) {
            updateChart(monthlyChartBtn.classList.contains('active') ? 'monthly' : 'weekly');
        }
    }

    function getMonthlyData() {
        // Build monthly totals from stored transactions, zeros for empty months
        const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const incomeArr = new Array(12).fill(0);
        const expenseArr = new Array(12).fill(0);
        const transactions = getStoredTransactions();
        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const idx = date.getMonth();
            if (tx.type === 'income') incomeArr[idx] += tx.amount;
            else expenseArr[idx] += tx.amount;
        });
        const savingArr = incomeArr.map((inc, i) => inc - expenseArr[i]);

        return {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeArr,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                },
                {
                    label: 'Expense',
                    data: expenseArr,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                },
                {
                    label: 'Savings',
                    data: savingArr,
                    backgroundColor: 'rgba(74, 158, 255, 0.8)',
                    borderColor: 'rgba(74, 158, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }
            ]
        };
    }

    function getWeeklyData() {
        // Build daily totals for the current week, zeros for missing days
        const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const incomeArr = new Array(7).fill(0);
        const expenseArr = new Array(7).fill(0);
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1); // Monday

        const transactions = getStoredTransactions();
        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const diff = Math.floor((date - weekStart) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7) {
                if (tx.type === 'income') incomeArr[diff] += tx.amount;
                else expenseArr[diff] += tx.amount;
            }
        });
        const savingArr = incomeArr.map((inc, i) => inc - expenseArr[i]);

        return {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeArr,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                },
                {
                    label: 'Expense',
                    data: expenseArr,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                },
                {
                    label: 'Savings',
                    data: savingArr,
                    backgroundColor: 'rgba(74, 158, 255, 0.8)',
                    borderColor: 'rgba(74, 158, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 8
                }
            ]
        };
    }

    // Highlight current page in menu
    const currentPath = window.location.pathname.split('/').pop();
    menuLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });

    // Initialize dashboard
    initializeDashboard();

    function initializeDashboard() {
        console.log('Dashboard initialized');
        initializeChart();
        updateStats();
    }
});

// Utility functions for future use
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    const colors = {
        success: { bg: '#28a745', border: '#28a745', text: '#ffffff' },
        error: { bg: '#dc3545', border: '#dc3545', text: '#ffffff' },
        warning: { bg: '#ffc107', border: '#ffc107', text: '#000000' },
        info: { bg: '#17a2b8', border: '#17a2b8', text: '#ffffff' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.border = `1px solid ${color.border}`;
    notification.style.color = color.text;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// Add slide animations
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(animationStyle);
