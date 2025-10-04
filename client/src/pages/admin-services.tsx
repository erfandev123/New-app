import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Search, Edit, Save, RefreshCw, DollarSign, Package, Settings } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  category: string;
  rate: string;
  min: number;
  max: number;
  description?: string;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const filterServices = useCallback(() => {
    let filtered = services;
    
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }
    
    setFilteredServices(filtered);
  }, [services, searchTerm, categoryFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchServices();
    }
  }, [isAuthenticated, adminKey]);

  useEffect(() => {
    filterServices();
  }, [filterServices]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/services', {
        headers: {
          'x-admin-key': adminKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      setServices(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [adminKey, toast]);

  const updateService = useCallback(async (serviceId: number, updates: Partial<Service>) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update service');
      }
      
      const updatedService = await response.json();
      setServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));
      
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      
      return updatedService;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive"
      });
      throw error;
    }
  }, [adminKey, toast]);

  const handleSaveService = useCallback(async () => {
    if (!editingService) return;
    
    try {
      const updates: Partial<Service> = {};
      if (editingService.rate !== services.find(s => s.id === editingService.id)?.rate) {
        updates.rate = editingService.rate;
      }
      if (editingService.min !== services.find(s => s.id === editingService.id)?.min) {
        updates.min = editingService.min;
      }
      if (editingService.max !== services.find(s => s.id === editingService.id)?.max) {
        updates.max = editingService.max;
      }
      if (editingService.description !== services.find(s => s.id === editingService.id)?.description) {
        updates.description = editingService.description;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateService(editingService.id, updates);
      }
      
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  }, [editingService, services, updateService]);

  const handleAuthenticate = useCallback(() => {
    if (adminKey.trim()) {
      setIsAuthenticated(true);
      toast({
        title: "Authenticated",
        description: "Admin access granted",
      });
    }
  }, [adminKey, toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">Admin Key</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
              />
            </div>
            <Button onClick={handleAuthenticate} className="w-full">
              Access Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              Service Management
            </h1>
            <p className="text-gray-600 mt-1">Customize service prices and settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchServices}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Services</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {service.name}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {service.category}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Min Quantity</Label>
                      <p className="font-medium">{service.min.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Max Quantity</Label>
                      <p className="font-medium">{service.max.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500">Price per Unit</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-green-600 font-bold">৳</span>
                        <span className="font-bold text-lg text-green-600">
                          {parseFloat(service.rate).toFixed(4)}
                        </span>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setEditingService({ ...service })}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Service: {service.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rate">Price per Unit</Label>
                            <Input
                              id="rate"
                              type="number"
                              step="0.0001"
                              value={editingService?.rate || service.rate}
                              onChange={(e) => setEditingService(prev => prev ? { ...prev, rate: e.target.value } : null)}
                              placeholder="0.0000"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="min">Min Quantity</Label>
                              <Input
                                id="min"
                                type="number"
                                value={editingService?.min || service.min}
                                onChange={(e) => setEditingService(prev => prev ? { ...prev, min: parseInt(e.target.value) } : null)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="max">Max Quantity</Label>
                              <Input
                                id="max"
                                type="number"
                                value={editingService?.max || service.max}
                                onChange={(e) => setEditingService(prev => prev ? { ...prev, max: parseInt(e.target.value) } : null)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={editingService?.description || service.description || ''}
                              onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                              placeholder="Service description..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={handleSaveService}
                              className="flex-1"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingService(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Services Message */}
        {!loading && filteredServices.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No services are currently available'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 