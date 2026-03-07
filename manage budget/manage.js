// =====================
// Global Variables
// =====================

let categories = JSON.parse(localStorage.getItem('budgetCategories')) || [];
let goals = JSON.parse(localStorage.getItem('budgetGoals')) || [];

// =====================
// DOM Elements
// =====================

const modal = document.getElementById('addCategoryModal');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const closeBtn = document.querySelector('.close-btn');
const categoryForm = document.getElementById('categoryForm');
const categoriesGrid = document.querySelector('.categories-grid');
const goalsList = document.querySelector('.goals-list');

// =====================
// Navigation Functions
// =====================

function navigateToPage(page) {
    const pages = {
        'dashboard': '../index.html',
        'view-transactions': '../view transaction/view.html',
        'reports': '../report/report.html',
        'manage-budget': 'manage.html',
        'profile': '../profile/profile.html',
        'add-transaction': '../add transaction/add.html'
    };

    if (pages[page]) {
        window.location.href = pages[page];
    }
}

// =====================
// Modal Functions
// =====================

function openModal() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    categoryForm.reset();
}

// =====================
// Category Functions
// =====================

function createCategoryCard(category) {
    const percentage = category.spent > 0 ? (category.spent / category.budget) * 100 : 0;
    const remaining = category.budget - category.spent;
    const isOverBudget = category.spent > category.budget;

    return `
        <div class="category-card" data-id="${category.id}">
            <div class="category-header">
                <div class="category-icon" style="background: ${category.color}">
                    <i class="fas ${category.icon}"></i>
                </div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${isOverBudget ? '#dc3545' : '#28a745'}"></div>
            </div>
            <div class="category-amounts">
                <div class="amount spent-amount">$${category.spent.toFixed(2)} spent</div>
                <div class="amount budget-amount">$${category.budget.toFixed(2)} budget</div>
                <div class="remaining-amount">${remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}</div>
            </div>
        </div>
    `;
}

function renderCategories() {
    categoriesGrid.innerHTML = categories.map(category => createCategoryCard(category)).join('');
}

function saveCategories() {
    localStorage.setItem('budgetCategories', JSON.stringify(categories));
}

// =====================
// Goal Functions
// =====================

function createGoalItem(goal) {
    const percentage = goal.current > 0 ? (goal.current / goal.target) * 100 : 0;
    let status = 'behind';
    let statusText = 'Behind Schedule';

    if (percentage >= 100) {
        status = 'achieved';
        statusText = 'Achieved';
    } else if (percentage >= 75) {
        status = 'progress';
        statusText = 'On Track';
    }

    return `
        <div class="goal-item" data-id="${goal.id}">
            <div class="goal-info">
                <div class="goal-icon" style="background: ${goal.color}">
                    <i class="fas ${goal.icon}"></i>
                </div>
                <div class="goal-details">
                    <h4>${goal.name}</h4>
                    <p>$${goal.current.toFixed(2)} of $${goal.target.toFixed(2)} saved</p>
                </div>
            </div>
            <div class="goal-status ${status}">${statusText}</div>
        </div>
    `;
}

function renderGoals() {
    goalsList.innerHTML = goals.map(goal => createGoalItem(goal)).join('');
}

function saveGoals() {
    localStorage.setItem('budgetGoals', JSON.stringify(goals));
}

// =====================
// Form Functions
// =====================

function handleCategorySubmit(e) {
    e.preventDefault();

    const formData = new FormData(categoryForm);
    const categoryData = {
        id: Date.now().toString(),
        name: formData.get('categoryName'),
        description: formData.get('categoryDescription'),
        budget: parseFloat(formData.get('budgetAmount')),
        spent: 0,
        icon: formData.get('categoryIcon'),
        color: formData.get('categoryColor')
    };

    categories.push(categoryData);
    saveCategories();
    renderCategories();
    closeModal();
    updateOverview();
}

// =====================
// Overview & synchronization
// =====================

function getStoredTransactions() {
    const stored = localStorage.getItem('budgetBuddyTransactions');
    return stored ? JSON.parse(stored) : [];
}

// Recalculate each category's spent amount based on expense transactions
function syncCategorySpending() {
    const txs = getStoredTransactions().filter(tx => tx.type === 'expense');
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    categories.forEach(cat => {
        let sum = 0;
        txs.forEach(tx => {
            const d = new Date(tx.date);
            if (d.getMonth() === month && d.getFullYear() === year && tx.category === cat.name) {
                sum += tx.amount;
            }
        });
        cat.spent = sum;
    });
    saveCategories();
}

function updateOverview() {
    // ensure category spent values are up-to-date
    syncCategorySpending();

    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const utilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) + '%' : '0%';

    // Update overview cards
    document.querySelector('.overview-card:nth-child(1) .card-value').textContent = `$${totalBudget.toFixed(2)}`;
    document.querySelector('.overview-card:nth-child(2) .card-value').textContent = `$${totalSpent.toFixed(2)}`;
    document.querySelector('.overview-card:nth-child(3) .card-value').textContent = `$${totalRemaining.toFixed(2)}`;
    document.querySelector('.overview-card:nth-child(4) .card-value').textContent = utilization;
}

// =====================
// Navigation Event Listeners
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Add transaction button
    const addTransactionBtn = document.querySelector('.add-transaction-btn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => navigateToPage('add-transaction'));
    }

    // Menu button and dropdown
    const menuBtn = document.querySelector('.menu-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            dropdownMenu.classList.toggle('active');
        });

        // watch for transaction updates in other tabs
        window.addEventListener('storage', function(e) {
            if (e.key === 'budgetBuddyTransactions') {
                renderCategories();
                updateOverview();
            }
        });

        // Menu links
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                navigateToPage(page);
            });
        });
    }

    // Profile button
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => navigateToPage('profile'));
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            menuBtn.classList.remove('active');
            dropdownMenu.classList.remove('active');
        }
    });
});

// =====================
// Modal Event Listeners
// =====================

addCategoryBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});

// =====================
// Form Event Listeners
// =====================

categoryForm.addEventListener('submit', handleCategorySubmit);

// =====================
// Color Selection
// =====================

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
    });
});

// =====================
// Initialize Page
// =====================

document.addEventListener('DOMContentLoaded', function() {
    renderCategories();
    renderGoals();
    updateOverview();

    // Sample data for demonstration
    if (categories.length === 0) {
        categories = [
            {
                id: '1',
                name: 'Food & Dining',
                description: 'Groceries, restaurants, takeout',
                budget: 600,
                spent: 450,
                icon: 'fa-utensils',
                color: 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
            },
            {
                id: '2',
                name: 'Transportation',
                description: 'Gas, public transport, car maintenance',
                budget: 300,
                spent: 180,
                icon: 'fa-car',
                color: 'linear-gradient(135deg, #4ecdc4, #44a08d)'
            },
            {
                id: '3',
                name: 'Entertainment',
                description: 'Movies, games, subscriptions',
                budget: 200,
                spent: 120,
                icon: 'fa-film',
                color: 'linear-gradient(135deg, #45b7d1, #96c93d)'
            }
        ];
        saveCategories();
        renderCategories();
        updateOverview();
    }

    if (goals.length === 0) {
        goals = [
            {
                id: '1',
                name: 'Emergency Fund',
                target: 5000,
                current: 3200,
                icon: 'fa-shield-alt',
                color: 'linear-gradient(135deg, #667eea, #764ba2)'
            },
            {
                id: '2',
                name: 'Vacation Savings',
                target: 2000,
                current: 850,
                icon: 'fa-plane',
                color: 'linear-gradient(135deg, #f093fb, #f5576c)'
            }
        ];
        saveGoals();
        renderGoals();
    }
});
