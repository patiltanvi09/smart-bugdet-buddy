// View Transactions Page JavaScript

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
    // Load transactions from localStorage or API
    loadTransactions();

    // Update stats
    updateStats();

    // Set default date filter to current month
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
}

function setupEventListeners() {
    // Filter event listeners
    document.getElementById('filterType').addEventListener('change', filterTransactions);
    document.getElementById('filterCategory').addEventListener('change', filterTransactions);
    document.getElementById('filterDate').addEventListener('change', filterTransactions);
    document.getElementById('search').addEventListener('input', filterTransactions);
}

function loadTransactions() {
    // In a real application, this would load from an API or database
    // For now, we'll use localStorage or display sample data
    const transactions = getStoredTransactions();
    if (transactions.length === 0) {
        displaySampleTransactions();
    } else {
        displayTransactions(transactions);
    }
    // Update stats after loading
    updateStats();
}

function getStoredTransactions() {
    // Try to get transactions from localStorage
    const stored = localStorage.getItem('budgetBuddyTransactions');
    return stored ? JSON.parse(stored) : [];
}

function displaySampleTransactions() {
    // Sample transactions for demonstration
    const sampleTransactions = [
        {
            id: 1,
            type: 'income',
            amount: 3500.00,
            category: 'salary',
            date: '2024-03-01',
            description: 'Monthly salary payment',
            paymentMethod: 'bank-transfer'
        },
        {
            id: 2,
            type: 'expense',
            amount: 85.50,
            category: 'food',
            date: '2024-03-02',
            description: 'Grocery shopping at Whole Foods',
            paymentMethod: 'credit-card'
        },
        {
            id: 3,
            type: 'expense',
            amount: 45.00,
            category: 'transportation',
            date: '2024-03-03',
            description: 'Uber ride to downtown',
            paymentMethod: 'digital-wallet'
        },
        {
            id: 4,
            type: 'income',
            amount: 200.00,
            category: 'freelance',
            date: '2024-03-05',
            description: 'Freelance web design project',
            paymentMethod: 'bank-transfer'
        },
        {
            id: 5,
            type: 'expense',
            amount: 120.00,
            category: 'entertainment',
            date: '2024-03-07',
            description: 'Movie tickets and dinner',
            paymentMethod: 'credit-card'
        }
    ];

    displayTransactions(sampleTransactions);
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    const transactionCount = document.getElementById('transactionCount');

    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="no-transactions">
                <div class="no-transactions-icon">📋</div>
                <h3>No transactions found</h3>
                <p>You haven't added any transactions yet. Click the + button to add your first transaction.</p>
                <button class="btn btn-primary" onclick="window.location.href='../add transaction/add.html'">
                    Add Transaction
                </button>
            </div>
        `;
        transactionCount.textContent = '0';
        return;
    }

    transactionCount.textContent = transactions.length;

    const transactionsHTML = transactions.map(transaction => `
        <div class="transaction-item" onclick="showTransactionDetails(${transaction.id})">
            <div class="transaction-info">
                <div class="transaction-icon ${transaction.type}">
                    ${getTransactionIcon(transaction.category)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${formatCategoryName(transaction.category)}</div>
                    <div class="transaction-meta">${formatDate(transaction.date)} • ${transaction.description || 'No description'}</div>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
        </div>
    `).join('');

    transactionsList.innerHTML = transactionsHTML;
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
    let tx = getStoredTransactions();
    if (tx.length === 0) {
        // If no stored transactions, use sample data for demo
        tx = getSampleTransactions();
    }
    const { income, expense, remaining } = calculateTotals(tx);
    const incEl = document.querySelector('.income-text');
    const expEl = document.querySelector('.expense-text');
    const remEl = document.querySelector('.remaining-text');
    if (incEl) incEl.textContent = `$${income.toFixed(2)}`;
    if (expEl) expEl.textContent = `$${expense.toFixed(2)}`;
    if (remEl) remEl.textContent = `$${remaining.toFixed(2)}`;
}

function getTransactionIcon(category) {
    const icons = {
        salary: '💼',
        freelance: '💻',
        business: '🏢',
        investment: '📈',
        gift: '🎁',
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function filterTransactions() {
    const typeFilter = document.getElementById('filterType').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const dateFilter = document.getElementById('filterDate').value;
    const searchTerm = document.getElementById('search').value.toLowerCase();

    let transactions = getStoredTransactions();
    if (transactions.length === 0) {
        transactions = getSampleTransactions();
    }

    // Apply filters
    let filteredTransactions = transactions.filter(transaction => {
        // Type filter
        if (typeFilter !== 'all' && transaction.type !== typeFilter) {
            return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && transaction.category !== categoryFilter) {
            return false;
        }

        // Date filter
        if (dateFilter !== 'all' && !matchesDateFilter(transaction.date, dateFilter)) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const searchableText = `${transaction.description} ${transaction.category} ${transaction.amount}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    displayTransactions(filteredTransactions);
}

function matchesDateFilter(transactionDate, filter) {
    const transaction = new Date(transactionDate);
    const now = new Date();

    switch (filter) {
        case 'today':
            return transaction.toDateString() === now.toDateString();
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transaction >= weekAgo;
        case 'month':
            return transaction.getMonth() === now.getMonth() && transaction.getFullYear() === now.getFullYear();
        case 'year':
            return transaction.getFullYear() === now.getFullYear();
        default:
            return true;
    }
}

function getSampleTransactions() {
    // Return the same sample data
    return [
        {
            id: 1,
            type: 'income',
            amount: 3500.00,
            category: 'salary',
            date: '2024-03-01',
            description: 'Monthly salary payment',
            paymentMethod: 'bank-transfer'
        },
        {
            id: 2,
            type: 'expense',
            amount: 85.50,
            category: 'food',
            date: '2024-03-02',
            description: 'Grocery shopping at Whole Foods',
            paymentMethod: 'credit-card'
        },
        {
            id: 3,
            type: 'expense',
            amount: 45.00,
            category: 'transportation',
            date: '2024-03-03',
            description: 'Uber ride to downtown',
            paymentMethod: 'digital-wallet'
        },
        {
            id: 4,
            type: 'income',
            amount: 200.00,
            category: 'freelance',
            date: '2024-03-05',
            description: 'Freelance web design project',
            paymentMethod: 'bank-transfer'
        },
        {
            id: 5,
            type: 'expense',
            amount: 120.00,
            category: 'entertainment',
            date: '2024-03-07',
            description: 'Movie tickets and dinner',
            paymentMethod: 'credit-card'
        }
    ];
}

function showTransactionDetails(transactionId) {
    // Find the transaction
    let transactions = getStoredTransactions();
    if (transactions.length === 0) {
        transactions = getSampleTransactions();
    }

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Create modal content
    const modal = document.getElementById('transactionModal');
    const detailsContainer = document.getElementById('transactionDetails');

    detailsContainer.innerHTML = `
        <div class="transaction-detail">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
        </div>
        <div class="transaction-detail">
            <span class="detail-label">Amount:</span>
            <span class="detail-value ${transaction.type}">$${transaction.amount.toFixed(2)}</span>
        </div>
        <div class="transaction-detail">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${formatCategoryName(transaction.category)}</span>
        </div>
        <div class="transaction-detail">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formatDate(transaction.date)}</span>
        </div>
        <div class="transaction-detail">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${formatPaymentMethod(transaction.paymentMethod)}</span>
        </div>
        ${transaction.description ? `
        <div class="transaction-detail">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${transaction.description}</span>
        </div>
        ` : ''}
    `;

    modal.classList.add('show');
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('show');
}

function formatPaymentMethod(method) {
    return method.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('transactionModal');
    if (e.target === modal) {
        closeTransactionModal();
    }
});

// Utility function to add new transactions (can be called from add transaction page)
function addTransaction(transaction) {
    const transactions = getStoredTransactions();
    transaction.id = Date.now(); // Simple ID generation
    transactions.unshift(transaction); // Add to beginning of array
    localStorage.setItem('budgetBuddyTransactions', JSON.stringify(transactions));

    // Refresh the display if we're on the view page
    if (window.location.pathname.includes('view.html')) {
        loadTransactions();
    }
}
