// =====================
// Global Variables
// =====================

let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '',
    phone: '+1 (555) 123-4567',
    dob: '1990-01-01',
    currency: 'USD',
    language: 'en',
    theme: 'dark',
    notifications: true,
    twoFactor: true,
    lastLogin: new Date().toLocaleString(),
    createdAt: new Date().toISOString()
};

// ensure createdAt exists in older profiles
if (!userProfile.createdAt) {
    userProfile.createdAt = new Date().toISOString();
    saveUserProfile();
}

let goals = JSON.parse(localStorage.getItem('budgetGoals')) || [];
// use the same key as other modules
let transactions = JSON.parse(localStorage.getItem('budgetBuddyTransactions')) || [];
let categories = JSON.parse(localStorage.getItem('budgetCategories')) || [];

// =====================
// DOM Elements
// =====================

const modal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeBtn = document.querySelector('.close-btn');
let currentEditSection = '';

// =====================
// Navigation Functions
// =====================

function navigateToPage(page) {
    const pages = {
        'dashboard': '../index.html',
        'view-transactions': '../view transaction/view.html',
        'reports': '../report/report.html',
        'manage-budget': '../manage budget/manage.html',
        'profile': 'profile.html',
        'add-transaction': '../add transaction/add.html'
    };

    if (pages[page]) {
        window.location.href = pages[page];
    }
}

// =====================
// Modal Functions
// =====================

function openModal(section) {
    currentEditSection = section;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Hide all form sections
    document.querySelectorAll('.form-section').forEach(form => {
        form.classList.remove('active');
    });

    // Show the relevant form section
    const formSection = document.getElementById(section + 'Form');
    if (formSection) {
        formSection.classList.add('active');
    }

    // Set modal title
    const titles = {
        'personal': 'Edit Personal Information',
        'security': 'Edit Security Settings',
        'preferences': 'Edit Preferences',
        'goals': 'Add New Goal'
    };
    document.getElementById('modalTitle').textContent = titles[section] || 'Edit Information';

    // Populate form with current values
    populateForm(section);
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    editForm.reset();
    currentEditSection = '';
}

// =====================
// Form Population Functions
// =====================

function populateForm(section) {
    switch(section) {
        case 'personal':
            document.getElementById('firstName').value = userProfile.firstName;
            document.getElementById('lastName').value = userProfile.lastName;
            document.getElementById('email').value = userProfile.email;
            document.getElementById('phone').value = userProfile.phone;
            document.getElementById('dob').value = userProfile.dob;
            break;

        case 'security':
            document.getElementById('twoFactor').checked = userProfile.twoFactor;
            break;

        case 'preferences':
            document.getElementById('currency').value = userProfile.currency;
            document.getElementById('language').value = userProfile.language;
            document.getElementById('theme').value = userProfile.theme;
            document.getElementById('notifications').checked = userProfile.notifications;
            break;

        case 'goals':
            // Reset goal form
            document.getElementById('goalName').value = '';
            document.getElementById('goalTarget').value = '';
            document.getElementById('goalCurrent').value = '';
            document.getElementById('goalIcon').value = 'fa-piggy-bank';
            break;
    }
}

// =====================
// Form Submission Functions
// =====================

function handleFormSubmit(e) {
    e.preventDefault();

    switch(currentEditSection) {
        case 'personal':
            updatePersonalInfo();
            break;
        case 'security':
            updateSecuritySettings();
            break;
        case 'preferences':
            updatePreferences();
            break;
        case 'goals':
            addNewGoal();
            break;
    }

    closeModal();
    updateDisplay();
}

// =====================
// Update Functions
// =====================

function updatePersonalInfo() {
    userProfile.firstName = document.getElementById('firstName').value;
    userProfile.lastName = document.getElementById('lastName').value;
    userProfile.email = document.getElementById('email').value;
    userProfile.phone = document.getElementById('phone').value;
    userProfile.dob = document.getElementById('dob').value;

    saveUserProfile();
}

function updateSecuritySettings() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword && newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (newPassword) {
        userProfile.password = newPassword; // store plain for demo
        alert('Password updated successfully!');
    }

    userProfile.twoFactor = document.getElementById('twoFactor').checked;
    saveUserProfile();
}

function updatePreferences() {
    userProfile.currency = document.getElementById('currency').value;
    userProfile.language = document.getElementById('language').value;
    userProfile.theme = document.getElementById('theme').value;
    userProfile.notifications = document.getElementById('notifications').checked;

    saveUserProfile();
    applyTheme();
}

function addNewGoal() {
    const goalData = {
        id: Date.now().toString(),
        name: document.getElementById('goalName').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        current: parseFloat(document.getElementById('goalCurrent').value || 0),
        icon: document.getElementById('goalIcon').value,
        color: 'linear-gradient(135deg, #28a745, #20c997)'
    };

    goals.push(goalData);
    saveGoals();
    updateGoalsDisplay();
}

// =====================
// Display Update Functions
// =====================

function updateDisplay() {
    // Update profile info
    document.getElementById('userName').textContent = `${userProfile.firstName} ${userProfile.lastName}`;
    document.getElementById('userEmail').textContent = userProfile.email;

    // Update personal info display
    document.getElementById('displayName').textContent = `${userProfile.firstName} ${userProfile.lastName}`;
    document.getElementById('displayEmail').textContent = userProfile.email;
    document.getElementById('displayPhone').textContent = userProfile.phone;
    document.getElementById('displayDob').textContent = formatDate(userProfile.dob);

    // Update preferences display
    document.getElementById('displayCurrency').textContent = getCurrencyDisplay(userProfile.currency);
    document.getElementById('displayLanguage').textContent = getLanguageDisplay(userProfile.language);
    document.getElementById('displayTheme').textContent = capitalizeFirst(userProfile.theme);

    // Update security status
    const twoFactorStatus = document.querySelector('.status.enabled, .status.disabled');
    if (twoFactorStatus) {
        twoFactorStatus.textContent = userProfile.twoFactor ? 'Enabled' : 'Disabled';
        twoFactorStatus.className = `status ${userProfile.twoFactor ? 'enabled' : 'disabled'}`;
    }

    // Update last login
    document.getElementById('lastLogin').textContent = userProfile.lastLogin;

    // Update stats
    updateStats();
}

function updateStats() {
    // refresh arrays from storage in case they changed
    transactions = JSON.parse(localStorage.getItem('budgetBuddyTransactions')) || [];
categories = JSON.parse(localStorage.getItem('budgetCategories')) || []; // already correct
    document.getElementById('totalTransactions').textContent = transactions.length;
    document.getElementById('totalCategories').textContent = categories.length;

    // Calculate account age from registration date
    const created = new Date(userProfile.createdAt || new Date());
    const accountAge = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
    document.getElementById('accountAge').textContent = accountAge;
}

function updateGoalsDisplay() {
    const goalsContainer = document.querySelector('.goals-summary');
    if (!goalsContainer) return;

    goalsContainer.innerHTML = goals.map(goal => {
        const percentage = goal.current > 0 ? (goal.current / goal.target) * 100 : 0;
        return `
            <div class="goal-summary-item">
                <div class="goal-icon">
                    <i class="fas ${goal.icon}"></i>
                </div>
                <div class="goal-info">
                    <h4>${goal.name}</h4>
                    <p>$${goal.current.toFixed(2)} of $${goal.target.toFixed(2)} saved</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// =====================
// Utility Functions
// =====================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getCurrencyDisplay(currency) {
    const currencies = {
        'USD': 'USD ($)',
        'EUR': 'EUR (€)',
        'GBP': 'GBP (£)',
        'JPY': 'JPY (¥)'
    };
    return currencies[currency] || currency;
}

function getLanguageDisplay(language) {
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German'
    };
    return languages[language] || language;
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function applyTheme() {
    // In a real app, you'd apply the theme to the document
    console.log('Applying theme:', userProfile.theme);
}

// =====================
// Storage Functions
// =====================

function saveUserProfile() {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function saveGoals() {
    localStorage.setItem('budgetGoals', JSON.stringify(goals));
}

// =====================
// Event Listeners
// =====================

// Navigation event listeners
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

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            openModal(section);
        });
    });
});

// Modal event listeners
closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});

editForm.addEventListener('submit', handleFormSubmit);

// =====================
// Initialize Page
// =====================

document.addEventListener('DOMContentLoaded', function() {
    updateDisplay();
    updateGoalsDisplay();
    updateStats();

    // listen for changes in other tabs
    window.addEventListener('storage', function(e) {
        if (['budgetBuddyTransactions','budgetCategories','userProfile'].includes(e.key)) {
            // reload arrays
            transactions = JSON.parse(localStorage.getItem('budgetBuddyTransactions')) || [];
            categories = JSON.parse(localStorage.getItem('budgetCategories')) || [];
            userProfile = JSON.parse(localStorage.getItem('userProfile')) || userProfile;
            updateDisplay();
            updateStats();
            updateGoalsDisplay();
        }
    });

    // Sample data for demonstration
    if (transactions.length === 0) {
        transactions = [
            { id: 1, type: 'income', amount: 3000, category: 'Salary', date: '2024-01-01' },
            { id: 2, type: 'expense', amount: 150, category: 'Food', date: '2024-01-02' },
            { id: 3, type: 'expense', amount: 200, category: 'Transportation', date: '2024-01-03' }
        ];
        localStorage.setItem('budgetBuddyTransactions', JSON.stringify(transactions));
    }

    if (categories.length === 0) {
        categories = [
            { id: '1', name: 'Food & Dining', budget: 600, spent: 450 },
            { id: '2', name: 'Transportation', budget: 300, spent: 180 },
            { id: '3', name: 'Entertainment', budget: 200, spent: 120 }
        ];
        localStorage.setItem('budgetCategories', JSON.stringify(categories));
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
        updateGoalsDisplay();
    }

    updateStats();
});
