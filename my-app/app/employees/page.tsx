"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download, Users, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  manager?: string;
  status: "active" | "inactive" | "terminated";
  dateOfJoining: string;
  createdAt: string;
}

interface EmployeeData {
  employees: Employee[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    departments: string[];
    roles: string[];
    statuses: string[];
  };
  userRole: string;
  userDepartment?: string;
}

export default function EmployeeDirectory() {
  const router = useRouter();
  const [data, setData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all-departments");
  const [status, setStatus] = useState("all-statuses");
  const [role, setRole] = useState("all-roles");
  const [dateSort, setDateSort] = useState("all-dates"); // "earliest", "latest", "all-dates"
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch employees
  const fetchEmployees = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      // Get user data from localStorage to check auth and get token
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("auth-token");
      
      if (!userData) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData);
      
      // Debug: Check what role we have
      console.log("🔍 Employee Directory - User role check:", { 
        role: user.role, 
        roleLowercase: user.role?.toLowerCase(),
        hasAccess: ['manager', 'administrator'].includes(user.role?.toLowerCase())
      });
      
      // Check if user has proper role
      if (!['manager', 'administrator'].includes(user.role?.toLowerCase())) {
        setError("Access denied. Managers and administrators only.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(department && department !== "all-departments" && { department }),
        ...(status && status !== "all-statuses" && { status }),
        ...(role && role !== "all-roles" && { role }),
        ...(dateSort && dateSort !== "all-dates" && { dateSort }),
      });

      const response = await fetch(`/api/employee-list?${params}`, {
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch employees");
      }

      setData(result.data);
      setCurrentPage(page);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("Access denied")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [search, department, status, role, dateSort, router]);

  // Export to PDF
  const exportToPDF = async () => {
    try {
      setExporting(true);
      
      // Get user data from localStorage to check auth
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("auth-token");
      
      if (!userData) {
        router.push("/login");
        return;
      }
      
      const exportData = {
        filters: {
          ...(search && { search }),
          ...(department && department !== "all-departments" && { department }),
          ...(status && status !== "all-statuses" && { status }),
          ...(role && role !== "all-roles" && { role }),
          ...(dateSort && dateSort !== "all-dates" && { dateSort }),
        },
        includeFields: [
          "employeeId",
          "fullName", 
          "department",
          "role",
          "status",
          "dateOfJoining",
          "email"
        ]
      };

      const response = await fetch("/api/employee-list/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export employees");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employee-directory-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setExporting(true);
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("auth-token");
      if (!userData) {
        router.push("/login");
        return;
      }
      // You can add filters here if needed
      const response = await fetch("/api/employee-list/export", {
        method: "GET",
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export Excel");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employee-directory-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setDepartment("all-departments");
    setStatus("all-statuses");
    setRole("all-roles");
    setDateSort("all-dates");
    setCurrentPage(1);
  };

  // Handle search/filter changes
  useEffect(() => {
    fetchEmployees(1);
  }, [fetchEmployees]);

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "terminated":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading employee directory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employee Directory</h1>
        <p className="text-muted-foreground">
          {data?.userRole === "Manager" 
            ? `Manage employees in your ${data?.userDepartment} department`
            : "View and manage all company employees"
          }
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">All Departments</SelectItem>
                {data?.filters.departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">All Statuses</SelectItem>
                {data?.filters.statuses.map((stat) => (
                  <SelectItem key={stat} value={stat}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Job Title Filter */}
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-roles">All Roles</SelectItem>
                {data?.filters.roles?.slice(0, 10).map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Sort Filter */}
            <Select value={dateSort} onValueChange={setDateSort}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-dates">All Dates</SelectItem>
                <SelectItem value="earliest">Earliest First</SelectItem>
                <SelectItem value="latest">Latest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToPDF}
              disabled={exporting || !data?.employees.length}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              disabled={exporting || !data?.employees.length}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {data && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {data.pagination.totalCount} employees found
            </span>
          </div>
          <Badge variant="outline">
            {data.userRole}
          </Badge>
          {data.userDepartment && (
            <Badge variant="secondary">
              {data.userDepartment} Department
            </Badge>
          )}
        </div>
      )}

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Department</th>
                  <th className="text-left p-4 font-medium">Job Title</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Join Date</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading employees...</p>
                    </td>
                  </tr>
                ) : data?.employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <p className="text-muted-foreground">No employees found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  data?.employees.map((employee) => (
                    <tr key={employee._id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-mono text-sm">{employee.employeeId}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </td>
                      <td className="p-4">{employee.department}</td>
                      <td className="p-4">{employee.role}</td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(employee.status)}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(employee.dateOfJoining).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm">
                        {employee.phone || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.currentPage} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmployees(currentPage - 1)}
              disabled={!data.pagination.hasPrevPage || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmployees(currentPage + 1)}
              disabled={!data.pagination.hasNextPage || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      {/* Back to Dashboard Button at bottom left */}
      <div className="mt-10 flex justify-start">
        <Button className="bg-black text-white hover:bg-gray-800" onClick={() => router.push("/")}>Back to Dashboard</Button>
      </div>
    </div>
  );
}
