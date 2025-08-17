import { connectToDatabase } from "../lib/mongodb";
import Employee from "../lib/models/Employee";

const sampleEmployees = [
  {
    employeeId: "EMP001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@company.com",
    phone: "+65 9123 4567",
    department: "IT",
    jobTitle: "Senior Software Engineer",
    manager: "Jane Doe",
    status: "active",
    dateOfJoining: new Date("2022-01-15"),
    salary: 75000,
    address: {
      street: "123 Tech Street",
      city: "Singapore",
      zipCode: "123456",
      country: "Singapore"
    },
    emergencyContact: {
      name: "Mary Smith",
      relationship: "Spouse",
      phone: "+65 9234 5678"
    }
  },
  {
    employeeId: "EMP002",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@company.com",
    phone: "+65 9234 5678",
    department: "Sales",
    jobTitle: "Sales Manager",
    manager: "Mike Wilson",
    status: "active",
    dateOfJoining: new Date("2021-06-01"),
    salary: 65000,
    address: {
      street: "456 Business Ave",
      city: "Singapore",
      zipCode: "234567",
      country: "Singapore"
    }
  },
  {
    employeeId: "EMP003",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@company.com",
    phone: "+65 9345 6789",
    department: "Finance",
    jobTitle: "Financial Analyst",
    manager: "Lisa Chen",
    status: "active",
    dateOfJoining: new Date("2023-03-10"),
    salary: 55000
  },
  {
    employeeId: "EMP004",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@company.com",
    phone: "+65 9456 7890",
    department: "HR",
    jobTitle: "HR Specialist",
    manager: "David Kim",
    status: "active",
    dateOfJoining: new Date("2022-09-20"),
    salary: 50000
  },
  {
    employeeId: "EMP005",
    firstName: "Robert",
    lastName: "Wilson",
    email: "robert.wilson@company.com",
    phone: "+65 9567 8901",
    department: "Operations",
    jobTitle: "Operations Coordinator",
    manager: "Anna Lee",
    status: "active",
    dateOfJoining: new Date("2021-11-05"),
    salary: 45000
  },
  {
    employeeId: "EMP006",
    firstName: "Jessica",
    lastName: "Taylor",
    email: "jessica.taylor@company.com",
    phone: "+65 9678 9012",
    department: "Logistics",
    jobTitle: "Logistics Manager",
    manager: "Tom Anderson",
    status: "active",
    dateOfJoining: new Date("2020-08-15"),
    salary: 60000
  },
  {
    employeeId: "EMP007",
    firstName: "Daniel",
    lastName: "Martinez",
    email: "daniel.martinez@company.com",
    phone: "+65 9789 0123",
    department: "IT",
    jobTitle: "DevOps Engineer",
    manager: "Jane Doe",
    status: "active",
    dateOfJoining: new Date("2023-01-20"),
    salary: 70000
  },
  {
    employeeId: "EMP008",
    firstName: "Lisa",
    lastName: "Anderson",
    email: "lisa.anderson@company.com",
    phone: "+65 9890 1234",
    department: "Sales",
    jobTitle: "Sales Representative",
    manager: "Sarah Johnson",
    status: "active",
    dateOfJoining: new Date("2022-12-01"),
    salary: 40000
  },
  {
    employeeId: "EMP009",
    firstName: "Kevin",
    lastName: "White",
    email: "kevin.white@company.com",
    phone: "+65 9901 2345",
    department: "Finance",
    jobTitle: "Accountant",
    manager: "Lisa Chen",
    status: "inactive",
    dateOfJoining: new Date("2021-04-10"),
    salary: 48000
  },
  {
    employeeId: "EMP010",
    firstName: "Amanda",
    lastName: "Clark",
    email: "amanda.clark@company.com",
    phone: "+65 9012 3456",
    department: "Management",
    jobTitle: "General Manager",
    status: "active",
    dateOfJoining: new Date("2019-01-01"),
    salary: 120000
  },
  {
    employeeId: "EMP011",
    firstName: "James",
    lastName: "Rodriguez",
    email: "james.rodriguez@company.com",
    phone: "+65 9123 4567",
    department: "Operations",
    jobTitle: "Warehouse Supervisor",
    manager: "Anna Lee",
    status: "active",
    dateOfJoining: new Date("2022-05-15"),
    salary: 42000
  },
  {
    employeeId: "EMP012",
    firstName: "Michelle",
    lastName: "Lewis",
    email: "michelle.lewis@company.com",
    phone: "+65 9234 5678",
    department: "HR",
    jobTitle: "HR Manager",
    manager: "Amanda Clark",
    status: "active",
    dateOfJoining: new Date("2020-03-01"),
    salary: 65000
  }
];

async function seedEmployees() {
  try {
    await connectToDatabase();
    
    // Clear existing employees
    await Employee.deleteMany({});
    console.log("Cleared existing employees");
    
    // Insert sample employees
    const insertedEmployees = await Employee.insertMany(sampleEmployees);
    console.log(`Successfully inserted ${insertedEmployees.length} employees`);
    
    // Display the seeded employees
    console.log("\nSeeded Employees:");
    insertedEmployees.forEach(emp => {
      console.log(`- ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (${emp.department} - ${emp.jobTitle})`);
    });
    
  } catch (error) {
    console.error("Error seeding employees:", error);
  } finally {
    process.exit(0);
  }
}

seedEmployees();
