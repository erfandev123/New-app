import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { OrderCard } from "../components/order-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Filter, Calendar, TrendingUp, Clock } from "lucide-react";
import type { Order, Service } from "../types";
import { Link } from "wouter";

export default function OrderHistory() {
  const [filterStatus, setFilterStatus] = useState("All");

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["/api/orders"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 5 * 60 * 1000,
  });

  // Get unique statuses for filter
  const statuses = ["All", ...Array.from(new Set((orders as Order[]).map((order: Order) => order.status)))];

  // Filter orders based on status
  const filteredOrders = (orders as Order[]).filter((order: Order) => {
    return filterStatus === "All" || order.status === filterStatus;
  });

  // Sort orders by creation date (newest first)
  const sortedOrders = filteredOrders.sort((a: Order, b: Order) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="material-card p-6 text-center">
          <h2 className="text-lg font-medium text-destructive mb-2">Error Loading Orders</h2>
          <p className="text-sm text-muted-foreground">
            Failed to load order history. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Calculate order stats
  const ordersArray = orders as Order[];
  const totalOrders = ordersArray.length;
  const completedOrders = ordersArray.filter((order: Order) => order.status === "Completed").length;
  const pendingOrders = ordersArray.filter((order: Order) => order.status === "Pending").length;
  const totalSpent = ordersArray.reduce((sum: number, order: Order) => sum + parseFloat(order.charge || "0"), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 pb-20">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 rounded-b-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-blue-100">Track your order history</p>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-200" />
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="text-sm text-blue-100">Total Orders</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-green-200" />
            <div className="text-2xl font-bold">{completedOrders}</div>
            <div className="text-sm text-green-100">Completed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-yellow-200" />
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <div className="text-sm text-yellow-100">Pending</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-200" />
            <div className="text-2xl font-bold">৳{totalSpent.toFixed(2)}</div>
            <div className="text-sm text-purple-100">Total Spent</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/50 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Filter Orders</h3>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
              {statuses.map((status) => {
                const getStatusColor = (status: string) => {
                  switch (status.toLowerCase()) {
                    case 'completed': return 'from-green-500 to-emerald-600';
                    case 'pending': return 'from-yellow-500 to-orange-600';
                    case 'in progress': return 'from-blue-500 to-cyan-600';
                    case 'cancelled': return 'from-red-500 to-pink-600';
                    default: return 'from-purple-500 to-indigo-600';
                  }
                };
                
                return (
                  <button
                    key={status}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      filterStatus === status
                        ? `bg-gradient-to-r ${getStatusColor(status)} text-white shadow-lg scale-105`
                        : "bg-white/80 text-gray-600 hover:bg-purple-100 border border-gray-200"
                    }`}
                    onClick={() => setFilterStatus(status)}
                    data-testid={`button-filter-${status.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            <Link href="/status">
              <button className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white whitespace-nowrap hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg">
                Check Status
              </button>
            </Link>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : sortedOrders.length > 0 ? (
          <div className="space-y-4" data-testid="list-orders">
            {sortedOrders.map((order: Order) => {
              const service = (services as Service[]).find((s: Service) => s.id === order.service);
              return (
                <div key={order.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 hover:shadow-lg transition-all duration-300">
                  <OrderCard 
                    order={order} 
                    service={service}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="text-no-orders">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              {filterStatus === "All" ? "No orders yet" : `No ${filterStatus.toLowerCase()} orders`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === "All" 
                ? "Start by placing your first order from the services page."
                : `You don't have any orders with status "${filterStatus}".`
              }
            </p>
            <Link href="/services">
              <button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg">
                Browse Services
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
