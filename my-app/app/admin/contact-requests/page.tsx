"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, User, Clock, CheckCircle, RefreshCw } from "lucide-react"

interface ContactRequest {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded';
  createdAt: string;
  updatedAt: string;
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contact');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }
      
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <User className="h-4 w-4" />;
      case 'responded': return <CheckCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Requests</h1>
          <p className="mt-2 text-gray-600">Dashboard access requests from users</p>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {requests.filter(r => r.status === 'pending').length} Pending
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {requests.filter(r => r.status === 'reviewed').length} Reviewed
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {requests.filter(r => r.status === 'responded').length} Responded
              </Badge>
            </div>
            
            <Button onClick={fetchRequests} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">Loading contact requests...</p>
          </div>
        )}

        {/* Contact Requests List */}
        {!loading && !error && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No contact requests</h3>
                  <p className="mt-2 text-gray-500">No users have submitted access requests yet.</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{request.name}</CardTitle>
                          <CardDescription>
                            <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                              {request.email}
                            </a>
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                          {request.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                        <span>Request ID: {request._id}</span>
                        <span>Submitted: {new Date(request.createdAt).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => window.open(`mailto:${request.email}?subject=Dashboard Access Approved&body=Hello ${request.name},%0D%0A%0D%0AYour access request has been approved. Here are your login credentials:%0D%0A%0D%0AEmail: ${request.email}%0D%0APassword: [SET_PASSWORD]%0D%0A%0D%0APlease visit: http://localhost:3000/login%0D%0A%0D%0ABest regards,%0D%0ASingapore Pallet Works Team`)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
