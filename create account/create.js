// Form Submission Handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    // Form Submit Event
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic Validation
        if (!email) {
            showNotification('Please enter your email or phone number', 'error');
            emailInput.focus();
            return;
        }

        if (!password) {
            showNotification('Please enter your password', 'error');
            passwordInput.focus();
            return;
        }

        // Email or Phone Validation
        if (!isValidEmailOrPhone(email)) {
            showNotification('Please enter a valid email or phone number', 'error');
            emailInput.focus();
            return;
        }

        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            passwordInput.focus();
            return;
        }

        // check existing profile for password match
        const existing = JSON.parse(localStorage.getItem('userProfile')) || null;
        if (existing && existing.email === email && existing.password && existing.password !== password) {
            showNotification('Incorrect password for this account', 'error');
            return;
        }

        // Simulate Login
        loginForm.querySelector('.submit-btn').disabled = true;
        loginForm.querySelector('.submit-btn').textContent = 'Signing in...';

        setTimeout(() => {
            showNotification('Login successful! Redirecting...', 'success');

            // update or create profile object in localStorage
            let profile = JSON.parse(localStorage.getItem('userProfile')) || {};
            profile.email = email;
            profile.password = password; // plain text for demo
            profile.lastLogin = new Date().toLocaleString();
            if (!profile.createdAt) {
                profile.createdAt = new Date().toISOString();
            }
            localStorage.setItem('userProfile', JSON.stringify(profile));

            setTimeout(() => {
                // Redirect to dashboard or home page
                window.location.href = '../main page/index.html';
            }, 1500);
        }, 1000);
    });



    // Sign Up Link
    document.querySelector('.signup-link').addEventListener('click', function(e) {
        e.preventDefault();
        // Redirect to sign up page
        // window.location.href = '/signup';
        showNotification('Redirecting to sign up page...', 'info');
    });

    // Input Event Listeners for Real-time Validation
    emailInput.addEventListener('blur', function() {
        if (this.value.trim() && !isValidEmailOrPhone(this.value.trim())) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }
    });

    passwordInput.addEventListener('focus', function() {
        this.classList.remove('invalid');
    });
});

// Validation Functions
function isValidEmailOrPhone(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,}$/;
    
    return emailRegex.test(value) || phoneRegex.test(value);
}

// Notification Function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles dynamically
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    // Set color based on type
    const colors = {
        success: { bg: '#2d5016', border: '#4caf50', text: '#c8e6c9' },
        error: { bg: '#5a1a1a', border: '#f44336', text: '#ffcdd2' },
        warning: { bg: '#5a4a00', border: '#ff9800', text: '#ffe0b2' },
        info: { bg: '#1a3a5a', border: '#2196f3', text: '#bbdefb' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.border = `1px solid ${color.border}`;
    notification.style.color = color.text;

    document.body.appendChild(notification);

    // Auto remove notification
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

// Add Animation Keyframes
const style = document.createElement('style');
style.textContent = `
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

    .form-input.invalid {
        border-color: #f44336 !important;
    }
`;
document.head.appendChild(style);
