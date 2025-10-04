import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { Link } from "wouter";
import { ShoppingCart, TrainTrack, Wallet, Plus } from "lucide-react";
import { MaterialButton } from "../components/material-button";
import { OrderCard } from "../components/order-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Order, Service } from "../types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: balance, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ["/api/balance"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get recent orders (last 3)
  const recentOrders = (orders as Order[])
    .sort((a: Order, b: Order) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 3);

  const handleAddFunds = () => {
    setLocation("/add-funds");
  };

  const handleWithdraw = () => {
    toast({
      title: "Withdraw",
      description: "Withdrawal feature will be implemented soon.",
    });
  };

  if (balanceError) {
    const errorMessage = (balanceError as any)?.message || "Failed to load account information";
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("No token");
    
    if (isAuthError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="material-card p-6 text-center">
            <h2 className="text-lg font-medium text-destructive mb-2">
              Authentication Required
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Please login to access your dashboard.
            </p>
            <Link href="/login">
              <MaterialButton>
                Login
              </MaterialButton>
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="material-card p-6 text-center">
          <h2 className="text-lg font-medium text-destructive mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 animate-fade-in">
      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-primary to-primary-variant text-primary-foreground rounded-2xl p-6 material-shadow-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              {balanceLoading ? (
                <Skeleton className="h-8 w-24 mt-1 bg-white/20" />
              ) : (
                <h2 className="text-3xl font-light" data-testid="text-balance">
                  ৳{(balance as any)?.balance ? parseFloat((balance as any).balance).toFixed(2) : '0.00'}
                </h2>
              )}
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-4">
            <MaterialButton 
              variant="secondary"
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
              onClick={handleAddFunds}
              data-testid="button-add-funds"
            >
              Add Funds
            </MaterialButton>
            <MaterialButton 
              variant="secondary"
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
              onClick={handleWithdraw}
              data-testid="button-withdraw"
            >
              Withdraw
            </MaterialButton>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/services">
            <div className="material-card p-4 cursor-pointer" data-testid="card-place-order">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-foreground">Place Order</span>
              </div>
            </div>
          </Link>
          
          <Link href="/status">
            <div className="material-card p-4 cursor-pointer" data-testid="card-check-status">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrainTrack className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-foreground">Check Status</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-4">
        <div className="material-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium" data-testid="text-recent-orders-title">Recent Orders</h3>
            <Link href="/orders">
              <button className="text-primary font-medium text-sm" data-testid="button-view-all-orders">
                View All
              </button>
            </Link>
          </div>
          
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full mt-3" />
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3" data-testid="list-recent-orders">
              {recentOrders.map((order: Order) => {
                const service = (services as Service[]).find((s: Service) => s.id === order.service);
                return (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    service={service}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="text-no-orders">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Link href="/services">
                <MaterialButton data-testid="button-place-first-order">
                  <Plus className="w-4 h-4 mr-2" />
                  Place Your First Order
                </MaterialButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
