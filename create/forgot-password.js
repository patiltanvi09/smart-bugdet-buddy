// Forgot Password Logic
let generatedCode = null;
let codeExpireTime = null;
let codeSentEmail = null;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('emailInput');
    const securityCodeInput = document.getElementById('securityCodeInput');
    const submitEmailBtn = document.getElementById('submitEmailBtn');
    const sendCodeLink = document.getElementById('sendCodeLink');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    const emailSection = document.getElementById('emailSection');
    const codeSection = document.getElementById('codeSection');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    // Submit Email Event
    submitEmailBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();

        if (!email) {
            showNotification('Please enter your email address', 'error');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }

        // Simulate sending code
        submitEmailBtn.disabled = true;
        submitEmailBtn.textContent = 'Sending...';

        setTimeout(() => {
            // Generate 6-digit code
            generatedCode = generateSecurityCode();
            codeSentEmail = email;
            
            // Set code expiration time (50 seconds)
            codeExpireTime = Date.now() + 50000;

            console.log('Security Code sent to ' + email + ':', generatedCode);
            
            showNotification('Security code sent to ' + email, 'success');

            // Switch to code verification section
            emailSection.classList.remove('active');
            codeSection.classList.add('active');
            
            // Enable security code input
            securityCodeInput.disabled = false;
            securityCodeInput.focus();

            // Initialize timer and send code link
            initializeTimer();
            updateSendCodeLink();

            // Reset button
            submitEmailBtn.disabled = false;
            submitEmailBtn.textContent = 'Send Security Code';
        }, 1000);
    });

    // Send Code Link Click
    sendCodeLink.addEventListener('click', function(e) {
        e.preventDefault();

        if (sendCodeLink.classList.contains('disabled')) {
            return;
        }

        // Send new code
        generatedCode = generateSecurityCode();
        codeExpireTime = Date.now() + 50000;

        console.log('New Security Code sent to ' + codeSentEmail + ':', generatedCode);

        showNotification('New security code sent to ' + codeSentEmail, 'success');

        // Clear previous code input
        securityCodeInput.value = '';
        securityCodeInput.classList.remove('error', 'success');
        verifyCodeBtn.disabled = true;

        // Reinitialize timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        initializeTimer();
        updateSendCodeLink();
    });

    // Verify Code Event
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const enteredCode = securityCodeInput.value.trim();

        if (!enteredCode) {
            showNotification('Please enter the security code', 'error');
            securityCodeInput.focus();
            return;
        }

        if (enteredCode.length !== 6) {
            showNotification('Security code must be 6 digits', 'error');
            securityCodeInput.focus();
            return;
        }

        // Check if code is expired
        if (Date.now() > codeExpireTime) {
            showNotification('The security code has expired. Please request a new one.', 'error');
            securityCodeInput.classList.add('error');
            return;
        }

        // Verify code
        if (enteredCode === generatedCode.toString()) {
            securityCodeInput.classList.remove('error');
            securityCodeInput.classList.add('success');
            showNotification('Code verified successfully!', 'success');

            // Simulate redirecting to reset password page
            setTimeout(() => {
                // window.location.href = '/reset-password?email=' + codeSentEmail;
                // For now, show a message
                showNotification('Redirecting to password reset page...', 'info');
                // Clear values
                setTimeout(() => {
                    emailInput.value = '';
                    securityCodeInput.value = '';
                    emailSection.classList.add('active');
                    codeSection.classList.remove('active');
                    securityCodeInput.disabled = true;
                    generatedCode = null;
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                }, 1500);
            }, 1000);
        } else {
            securityCodeInput.classList.add('error');
            showNotification('The code is incorrect', 'error');
            securityCodeInput.value = '';
            securityCodeInput.focus();
        }
    });

    // Real-time Code Input Validation
    securityCodeInput.addEventListener('input', function(e) {
        // Only allow numbers
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);

        // Check if code is expired
        if (Date.now() > codeExpireTime && this.value.length > 0) {
            this.classList.add('error');
            showNotification('The security code has expired. Please request a new one.', 'error');
            return;
        }

        this.classList.remove('error');

        // Enable verify button when 6 digits are entered
        if (this.value.length === 6) {
            verifyCodeBtn.disabled = false;
        } else {
            verifyCodeBtn.disabled = true;
        }
    });

    // Clear error on focus
    securityCodeInput.addEventListener('focus', function() {
        this.classList.remove('error');
    });

    emailInput.addEventListener('focus', function() {
        this.classList.remove('error');
    });
});

// Generate 6-digit Security Code
function generateSecurityCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Validate Email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize Timer
function initializeTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    const sendCodeLink = document.getElementById('sendCodeLink');

    // Clear existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Start timer
    timerInterval = setInterval(() => {
        const timeRemaining = Math.max(0, codeExpireTime - Date.now());
        const seconds = Math.ceil(timeRemaining / 1000);

        if (seconds > 0) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const displayTime = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
            
            timerDisplay.textContent = displayTime;
            timerDisplay.classList.remove('expired');

            // Change color based on time remaining
            if (seconds <= 10) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning');
            }

            sendCodeLink.classList.add('disabled');
        } else {
            // Timer expired
            timerDisplay.classList.add('expired');
            clearInterval(timerInterval);
            
            // Enable resend code
            sendCodeLink.classList.remove('disabled');
            sendCodeLink.textContent = 'Resend code';
        }
    }, 100);
}

// Update Send Code Link Text
function updateSendCodeLink() {
    const sendCodeLink = document.getElementById('sendCodeLink');
    sendCodeLink.textContent = 'Resend code';
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
