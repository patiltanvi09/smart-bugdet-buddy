# Budget Buddy - Personal Finance Management Application

A comprehensive web-based personal finance management application with a modern, responsive design built using HTML5, CSS3, and JavaScript.

## Features

### 🔐 Authentication System
- User login and signup with validation
- Forgot password with security code verification
- Form validation and error handling

### 📊 Dashboard
- Financial overview with interactive charts (Chart.js)
- Budget progress visualization
- Recent transactions display
- Responsive design for all devices

### 💰 Transaction Management
- Add new transactions with categories
- View all transactions with filtering and search
- Transaction details and editing capabilities

### 📈 Reports & Analytics
- Multiple chart types (bar, line, pie, doughnut)
- Financial insights and trends
- Export functionality for reports

### 🎯 Budget Management
- Create and manage budget categories
- Track spending against budgets
- Set and monitor financial goals
- Visual progress indicators

### 👤 User Profile
- Personal information management
- Security settings (password, 2FA)
- Preferences (currency, language, theme)
- Account statistics and data export

## Project Structure

```
BBD2/
├── create account/
│   ├── create.html          # Login/Signup page
│   ├── create.css           # Login styles
│   ├── create.js            # Login functionality
│   ├── forgot-password.html # Password recovery
│   ├── forgot-password.css  # Recovery styles
│   └── forgot-password.js   # Recovery logic
├── main-page/
│   ├── index.html           # Main dashboard
│   ├── index.css            # Dashboard styles
│   └── index.js             # Dashboard functionality
├── add transaction/
│   ├── add.html             # Add transaction page
│   ├── add.css              # Add transaction styles
│   └── add.js               # Add transaction logic
├── view transaction/
│   ├── view.html            # View transactions page
│   ├── view.css             # View transactions styles
│   └── view.js              # View transactions logic
├── report/
│   ├── report.html          # Reports page
│   ├── report.css           # Reports styles
│   └── report.js            # Reports functionality
├── manage budget/
│   ├── manage.html          # Budget management page
│   ├── manage.css           # Budget management styles
│   └── manage.js            # Budget management logic
├── profile/
│   ├── profile.html         # User profile page
│   ├── profile.css          # Profile styles
│   └── profile.js           # Profile functionality
└── README.md                # This file
```

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **JavaScript (ES6+)**: Interactive functionality and DOM manipulation
- **Chart.js**: Data visualization and charts
- **Google Fonts**: Poppins typography
- **Font Awesome**: Icons and visual elements
- **LocalStorage**: Client-side data persistence

## Design Features

- **Dark Theme**: Modern black and gray gradient design
- **Responsive**: Mobile-first approach with breakpoints
- **Consistent Headers**: Unified navigation across all pages
- **Interactive Elements**: Hover effects, transitions, and animations
- **Modal System**: Clean popup interfaces for forms and actions
- **Form Validation**: Real-time validation with user feedback

## Navigation

All pages feature a consistent header with:
- **Logo**: Links to dashboard
- **+ Button**: Quick access to add transaction page
- **Menu Button**: Dropdown with all main sections
- **Profile Button**: Access to user profile

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation
1. Clone or download the project files
2. Open any HTML file in your web browser
3. Start with `create account/create.html` for login

### Usage
1. **First Time**: Create an account or login
2. **Dashboard**: View your financial overview
3. **Add Transactions**: Record income and expenses
4. **View Transactions**: Browse and filter your transaction history
5. **Reports**: Analyze your spending patterns
6. **Manage Budget**: Set up categories and goals
7. **Profile**: Customize your account settings

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Data Storage

The application uses browser LocalStorage for data persistence:
- User profile information
- Transaction records
- Budget categories and goals
- Application preferences

**Note**: Data is stored locally and will persist between sessions but is not synced across devices.

## Development Notes

### Code Organization
- Modular JavaScript with clear separation of concerns
- Consistent CSS architecture with reusable classes
- Semantic HTML structure
- Event-driven programming

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Color Scheme
- Primary: Dark gradients (#1a1d23, #2e3035, #0f1115)
- Accent: Blue (#007bff)
- Success: Green (#28a745)
- Warning: Orange/Yellow
- Error: Red (#dc3545)

## Future Enhancements

Potential improvements for production:
- Backend API integration
- User authentication with secure tokens
- Database storage (MongoDB, PostgreSQL)
- Data export/import functionality
- Multi-currency support
- Recurring transactions
- Budget alerts and notifications
- Mobile app version
- Cloud sync capabilities

## Contributing

This is a demonstration project. For production use, consider:
- Security audits
- Performance optimization
- Accessibility compliance (WCAG 2.1)
- Cross-browser testing
- Code minification and bundling

## License

This project is for educational and demonstration purposes.

---

**Budget Buddy** - Take control of your finances with style and ease.