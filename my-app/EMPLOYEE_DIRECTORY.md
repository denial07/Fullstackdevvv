# Employee Directory System Documentation

## Overview

The Employee Directory System is a role-based web application that allows Managers and Administrators to view, search, filter, and export employee information. The system integrates with MongoDB and provides PDF export functionality.

## Features

### 🔐 Role-Based Access Control
- **Administrators**: Can view all employees across all departments
- **Managers**: Can only view employees within their own department
- **Employees**: Have no access to the directory

### 🔍 Search & Filter Capabilities
- **Text Search**: Search by name, employee ID, or email
- **Department Filter**: Filter by specific departments
- **Status Filter**: Filter by employee status (Active, Inactive, Terminated)
- **Job Title Filter**: Filter by job titles
- **Combined Filters**: Use multiple filters simultaneously

### 📄 PDF Export
- **Role-Specific Exports**: 
  - Admins can export all employees
  - Managers can only export their department's employees
- **Filtered Exports**: Export respects current search/filter criteria
- **Professional Format**: Includes company branding, filters applied, timestamps, and user info

### 📊 Pagination & Sorting
- **Pagination**: Navigate through large employee datasets
- **Sorting**: Sort by various columns (name, department, join date, etc.)
- **Performance**: Optimized queries for large datasets

## Access URLs

- **Employee Directory**: `/employees`
- **API Endpoints**:
  - `GET /api/employees` - List employees
  - `POST /api/employees` - Create employee (Admin only)
  - `GET /api/employees/[id]` - Get single employee
  - `PUT /api/employees/[id]` - Update employee (Admin only)
  - `DELETE /api/employees/[id]` - Delete employee (Admin only)
  - `POST /api/employees/export` - Export to PDF

## Database Schema

### Employee Model
```typescript
{
  employeeId: string (unique, required)
  firstName: string (required)
  lastName: string (required)
  email: string (unique, required)
  phone?: string
  department: string (required) // Operations, Logistics, Sales, Finance, HR, IT, Management, Other
  jobTitle: string (required)
  manager?: string
  status: 'active' | 'inactive' | 'terminated'
  dateOfJoining: Date (required)
  dateOfLeaving?: Date
  salary?: number
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  emergencyContact?: {
    name?: string
    relationship?: string
    phone?: string
  }
  notes?: string
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install jspdf jspdf-autotable jsonwebtoken @types/jsonwebtoken
```

### 2. Seed Sample Data
```bash
npm run seed:employees
```

### 3. Environment Variables
Ensure these are set in your `.env.local`:
```
JWT_SECRET=your-jwt-secret
MONGODB_URI=your-mongodb-connection-string
```

### 4. User Permissions Setup
Make sure your users have the correct role and department assigned:
- `role`: "Administrator" | "Manager" | "Employee"
- `department`: Must match the department values in Employee model

## User Interface

### Navigation
- Access via the "Employees" button in the main navigation bar
- Only visible to users with Manager or Administrator roles

### Search & Filters
- **Search Box**: Real-time search across name, ID, and email fields
- **Department Dropdown**: Shows departments relevant to user's permissions
- **Status Dropdown**: Active, Inactive, Terminated
- **Job Title Dropdown**: Auto-populated from existing job titles
- **Clear Filters Button**: Reset all filters at once

### Employee Table
- **Sortable Columns**: Click headers to sort
- **Responsive Design**: Adapts to different screen sizes
- **Status Badges**: Color-coded status indicators
- **Contact Information**: Email and phone display
- **Pagination Controls**: Navigate through multiple pages

### Export Functionality
- **PDF Generation**: Click "Export PDF" button
- **Automatic Download**: PDF downloads automatically
- **Filename Convention**: `employee-directory-YYYY-MM-DD.pdf`
- **Content Includes**:
  - Company header
  - Applied filters
  - Employee data table
  - Generation timestamp and user info
  - Page numbers and total count

## Security Features

### Authentication
- JWT token validation on all API routes
- Session management with automatic logout on unauthorized access
- Role-based endpoint protection

### Data Protection
- Managers cannot access other departments' data
- Sensitive fields (salary) are included but can be controlled via permissions
- Audit trail through timestamps

### Input Validation
- Server-side validation using Mongoose schemas
- Client-side form validation
- Sanitized search queries to prevent injection attacks

## Performance Optimizations

### Database
- Indexed fields for fast searching (department, status, name)
- Pagination to handle large datasets
- Optimized queries with field selection

### Frontend
- Debounced search to reduce API calls
- Lazy loading with pagination
- Efficient state management

### API
- Response caching where appropriate
- Compressed JSON responses
- Error handling with proper HTTP status codes

## Error Handling

### Client-Side
- User-friendly error messages
- Loading states during API calls
- Graceful fallbacks for missing data

### Server-Side
- Comprehensive error logging
- Proper HTTP status codes
- Detailed error responses for debugging

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Check user role in database
   - Ensure JWT token is valid
   - Verify department assignments

2. **PDF Export Fails**
   - Check jsPDF installation
   - Verify server memory for large exports
   - Check browser popup blockers

3. **No Employees Showing**
   - Run seed script: `npm run seed:employees`
   - Check database connection
   - Verify user department matches employee departments

4. **Search Not Working**
   - Check MongoDB indexes
   - Verify search query encoding
   - Test API endpoints directly

### Logs & Debugging
- Server logs available in terminal/console
- Client-side errors in browser console
- MongoDB query logs for database debugging

## Future Enhancements

### Planned Features
- **Employee Photos**: Profile picture upload
- **Advanced Filters**: Date ranges, salary ranges
- **Bulk Operations**: Import/export CSV
- **Employee Details Page**: Detailed view with edit capabilities
- **Reporting**: Advanced analytics and reports
- **Mobile App**: React Native companion app

### Integration Possibilities
- **Email Notifications**: Welcome emails, birthday reminders
- **Calendar Integration**: Leave tracking, events
- **Performance Reviews**: Annual review system
- **Time Tracking**: Attendance and hours
- **Payroll Integration**: Salary and benefits management

## Support

For technical support or feature requests, please refer to the development team or create an issue in the project repository.
