// Add Transaction Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize header functionality
    initializeHeader();

    // Initialize the page
    initializePage();

    // Set up event listeners
    setupEventListeners();
});

function initializeHeader() {
    // Elements
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

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
}

function initializePage() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    // Show expense categories by default (since expense is checked)
    toggleCategories();
}

function setupEventListeners() {
    // Transaction type radio buttons
    const transactionTypeRadios = document.querySelectorAll('input[name="transactionType"]');
    transactionTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleCategories);
    });

    // Form submission
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', handleFormSubmit);

    // Amount input formatting
    const amountInput = document.getElementById('amount');
    amountInput.addEventListener('input', formatAmountInput);

    // Dropdown functionality
    setupDropdown();
}

function toggleCategories() {
    const transactionType = document.querySelector('input[name="transactionType"]:checked').value;
    const incomeCategories = document.getElementById('incomeCategories');
    const expenseCategories = document.getElementById('expenseCategories');
    const categorySelect = document.getElementById('category');

    if (transactionType === 'income') {
        incomeCategories.style.display = 'block';
        expenseCategories.style.display = 'none';
        categorySelect.value = 'salary'; // Default to salary for income
    } else {
        incomeCategories.style.display = 'none';
        expenseCategories.style.display = 'block';
        categorySelect.value = 'food'; // Default to food for expense
    }
}

function formatAmountInput(event) {
    let value = event.target.value;

    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }

    event.target.value = value;
}

function handleFormSubmit(event) {
    event.preventDefault();

    // Validate form
    if (!validateForm()) {
        return;
    }

    // Collect form data
    const formData = collectFormData();

    // Simulate API call (in a real app, this would send data to server)
    simulateTransactionSubmission(formData);
}

function validateForm() {
    let isValid = true;
    const errors = [];

    // Check required fields
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!amount || parseFloat(amount) <= 0) {
        errors.push('Please enter a valid amount greater than 0');
        highlightField('amount');
        isValid = false;
    } else {
        removeFieldHighlight('amount');
    }

    if (!category) {
        errors.push('Please select a category');
        highlightField('category');
        isValid = false;
    } else {
        removeFieldHighlight('category');
    }

    if (!date) {
        errors.push('Please select a date');
        highlightField('date');
        isValid = false;
    } else {
        removeFieldHighlight('date');
    }

    // Check if date is not in the future
    if (date) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            errors.push('Transaction date cannot be in the future');
            highlightField('date');
            isValid = false;
        }
    }

    // Display errors if any
    if (!isValid) {
        displayErrors(errors);
    } else {
        hideErrors();
    }

    return isValid;
}

function highlightField(fieldId) {
    const field = document.getElementById(fieldId);
    field.style.borderColor = '#dc3545';
    field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
}

function removeFieldHighlight(fieldId) {
    const field = document.getElementById(fieldId);
    field.style.borderColor = '#e0e0e0';
    field.style.boxShadow = 'none';
}

function displayErrors(errors) {
    // Remove existing error messages
    hideErrors();

    // Create error container
    const formContainer = document.querySelector('.form-container');
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessages';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        margin-bottom: 20px;
        font-size: 14px;
    `;

    errorDiv.innerHTML = '<strong>Please fix the following errors:</strong><ul style="margin-top: 8px; margin-bottom: 0;">' +
        errors.map(error => `<li>${error}</li>`).join('') + '</ul>';

    formContainer.insertBefore(errorDiv, document.querySelector('.transaction-form'));
}

function hideErrors() {
    const errorDiv = document.getElementById('errorMessages');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function collectFormData() {
    return {
        type: document.querySelector('input[name="transactionType"]:checked').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        timestamp: new Date().toISOString()
    };
}

function simulateTransactionSubmission(formData) {
    // Show loading state
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding Transaction...';
    submitBtn.disabled = true;

    // Simulate API delay
    setTimeout(() => {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Save transaction locally
        saveTransaction(formData);

        // Show success modal
        showSuccessModal(formData);

        // In a real app, you would redirect or update the UI here
        // For now, we'll just show the modal
    }, 1500);
}

function showSuccessModal(formData) {
    const modal = document.getElementById('successModal');
    modal.classList.add('show');

    // Update modal content with transaction details
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <p><strong>Type:</strong> ${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}</p>
        <p><strong>Amount:</strong> $${formData.amount.toFixed(2)}</p>
        <p><strong>Category:</strong> ${formatCategoryName(formData.category)}</p>
        <p><strong>Date:</strong> ${formatDate(formData.date)}</p>
        ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
        <br>
        <p>Your transaction has been recorded and added to your budget tracking.</p>
    `;
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');

    // Optional: Reset form after closing modal
    setTimeout(() => {
        document.getElementById('transactionForm').reset();
        initializePage(); // Reset to default state
        // redirect back to dashboard so new totals/graph appear
        window.location.href = '../main page/index.html';
    }, 300);
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
        month: 'long',
        day: 'numeric'
    });
}

function setupDropdown() {
    // The dropdown functionality is handled by CSS hover, but we can add click functionality for mobile
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (window.innerWidth <= 768) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownContent.style.opacity = dropdownContent.style.opacity === '1' ? '0' : '1';
            dropdownContent.style.visibility = dropdownContent.style.visibility === 'visible' ? 'hidden' : 'visible';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            dropdownContent.style.opacity = '0';
            dropdownContent.style.visibility = 'hidden';
        });
    }
}

// Utility function to format currency display
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Local storage helpers
function getStoredTransactions() {
    const stored = localStorage.getItem('budgetBuddyTransactions');
    return stored ? JSON.parse(stored) : [];
}

function saveTransaction(tx) {
    const transactions = getStoredTransactions();
    // ensure amount is number
    tx.amount = parseFloat(tx.amount);
    transactions.push(tx);
    localStorage.setItem('budgetBuddyTransactions', JSON.stringify(transactions));
}
