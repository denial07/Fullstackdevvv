# Ng Guan Seng - Management System

A comprehensive business management system built with Next.js, featuring shipment tracking, inventory management, order processing, and employee directory functionality.

## 🌟 Key Features

### 📋 Employee Directory System *(NEW)*
- **Role-Based Access Control**: Managers see their department, Admins see everyone
- **Advanced Search & Filtering**: Search by name, department, status, job title
- **PDF Export**: Professional reports with company branding and applied filters
- **Real-time Data**: Live employee information with pagination and sorting

### 🚢 Shipment Management
- Track incoming and outgoing shipments
- Real-time status updates
- Shipment analytics and reporting

### 📦 Inventory Management
- Stock level monitoring
- Low stock alerts
- Inventory analytics

### 🛒 Order Processing
- Order tracking and management
- Status updates and notifications
- Order analytics

### 💬 Communication
- Built-in inbox system
- AI-powered chatbot assistance
- Contact request management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- JWT secret for authentication

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd my-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and JWT secret

# Seed the database
npm run seed:company
npm run seed:users
npm run seed:employees
npm run seed:shipments
npm run seed:orders
npm run seed:inventory

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Employee Directory Usage

### For Administrators
1. Navigate to `/employees` or click "Employees" in the navigation
2. View all employees across all departments
3. Use filters to find specific employees
4. Export comprehensive PDF reports

### For Managers
1. Access the same employee directory
2. View only employees in your department
3. Export department-specific reports
4. Filter and search within your team

### Quick Start
```bash
# Seed sample employee data
npm run seed:employees

# The system creates 12 sample employees across different departments
# Login with Manager or Administrator role to access the directory
```

## 🔧 Environment Configuration

Create a `.env.local` file with:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## 📱 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: JWT with secure session management
- **PDF Generation**: jsPDF with autoTable
- **Charts**: Recharts for analytics
- **AI Integration**: Google Gemini for chatbot

## 🗂️ Project Structure

```
my-app/
├── app/
│   ├── employees/          # Employee directory page
│   ├── api/employees/      # Employee API endpoints
│   ├── shipments/          # Shipment management
│   ├── inventory/          # Inventory management
│   └── orders/             # Order management
├── components/
│   ├── ui/                 # Reusable UI components
│   └── navbar.tsx          # Navigation with employee link
├── lib/
│   ├── models/
│   │   ├── Employee.ts     # Employee data model
│   │   └── User.ts         # User authentication model
│   └── mongodb.ts          # Database connection
└── scripts/
    └── seed-employees.ts   # Employee data seeding
```

## 🎯 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database seeding
npm run seed:employees   # Seed employee data
npm run seed:users      # Seed user accounts
npm run seed:company    # Seed company data
npm run seed:shipments  # Seed shipment data
npm run seed:orders     # Seed order data
npm run seed:inventory  # Seed inventory data
```

## 📋 User Roles & Permissions

### Administrator
- Full access to all features
- Can create, edit, delete employees
- Export company-wide reports
- Manage all departments

### Manager  
- Access to employee directory (own department only)
- Export department reports
- View team information
- Limited to assigned department

### Employee
- Basic system access
- No employee directory access
- Personal dashboard features

## 📄 API Documentation

### Employee Endpoints
- `GET /api/employees` - List employees (with role-based filtering)
- `POST /api/employees` - Create employee (Admin only)
- `GET /api/employees/[id]` - Get single employee
- `PUT /api/employees/[id]` - Update employee (Admin only)
- `DELETE /api/employees/[id]` - Delete employee (Admin only)
- `POST /api/employees/export` - Export PDF report

See [EMPLOYEE_DIRECTORY.md](./EMPLOYEE_DIRECTORY.md) for detailed API documentation.

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Session management with timeout
- Input validation and sanitization
- Department-level data isolation
- Secure PDF generation

## 📈 Performance Features

- Database indexing for fast queries
- Pagination for large datasets
- Optimized MongoDB queries
- Client-side caching
- Lazy loading components

## 🐛 Troubleshooting

### Common Issues

1. **Employee directory not loading**
   - Check user role in database
   - Ensure MongoDB connection
   - Run employee seed script

2. **PDF export failing**
   - Verify jsPDF installation
   - Check browser popup settings
   - Ensure sufficient server memory

3. **Access denied errors**
   - Verify JWT token validity
   - Check user role assignment
   - Ensure department matching

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
- Set `MONGODB_URI` to production database
- Generate secure `JWT_SECRET`
- Configure `NEXTAUTH_URL` for your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For technical support or feature requests:
- Check the documentation in `EMPLOYEE_DIRECTORY.md`
- Review troubleshooting guide above
- Contact the development team

---

Built with ❤️ using Next.js, MongoDB, and TypeScript
