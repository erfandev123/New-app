import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../lib/api";
import { MaterialButton } from "../components/material-button";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, Target, TrendingUp, Clock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { OrderStatus, Service } from "../types";

const statusFormSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

type StatusFormData = z.infer<typeof statusFormSchema>;

export default function OrderStatusPage() {
  const { toast } = useToast();
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Get order ID from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const prefilledOrderId = searchParams.get("order");

  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      orderId: prefilledOrderId || "",
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 5 * 60 * 1000,
  });

  // Auto-check if order ID is prefilled
  useEffect(() => {
    if (prefilledOrderId) {
      handleCheckStatus({ orderId: prefilledOrderId });
    }
  }, [prefilledOrderId]);

  const handleCheckStatus = async (data: StatusFormData) => {
    setIsChecking(true);
    try {
      const status = await api.getOrderStatus(data.orderId);
      setOrderStatus(status);
      
      toast({
        title: "Status Retrieved",
        description: `Order #${data.orderId} status: ${status.status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check order status",
        variant: "destructive",
      });
      setOrderStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  const onSubmit = (data: StatusFormData) => {
    handleCheckStatus(data);
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'text-muted-foreground';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed')) return 'text-green-600 dark:text-green-400';
    if (statusLower.includes('progress') || statusLower.includes('pending')) return 'text-blue-600 dark:text-blue-400';
    if (statusLower.includes('partial')) return 'text-orange-600 dark:text-orange-400';
    if (statusLower.includes('canceled') || statusLower.includes('cancelled')) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getStatusChip = (status: string) => {
    if (!status) return 'status-chip-pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('pending')) {
      return 'status-chip-progress';
    }
    if (statusLower.includes('completed')) {
      return 'status-chip-completed';
    }
    if (statusLower.includes('partial')) {
      return 'status-chip-partial';
    }
    if (statusLower.includes('canceled') || statusLower.includes('cancelled')) {
      return 'status-chip-canceled';
    }
    return 'status-chip-pending';
  };

  const getProgress = () => {
    if (!orderStatus || !orderStatus.remains) return 100;
    // Assuming we need to calculate delivered based on start_count and remains
    // Since we don't have quantity in status response, we'll use remains as reference
    return Math.max(0, 100 - (orderStatus.remains / (orderStatus.start_count || 1)) * 100);
  };

  const getServiceName = (serviceId?: number) => {
    if (!serviceId) return "Unknown Service";
    const service = (services as Service[]).find((s: Service) => s.id === serviceId);
    return service?.name || `Service #${serviceId}`;
  };

  return (
    <div className="pb-20 p-4">
      <div className="material-card p-6 mb-4">
        <h2 className="text-xl font-medium mb-6" data-testid="text-page-title">Check Order Status</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter order ID (e.g. 23501)"
                      className="material-input"
                      data-testid="input-order-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <MaterialButton 
              type="submit" 
              className="w-full"
              disabled={isChecking}
              data-testid="button-check-status"
            >
              {isChecking ? "Checking..." : "Check Status"}
            </MaterialButton>
          </form>
        </Form>
      </div>

      {/* Order Details */}
      {orderStatus && (
        <div className="material-card p-6" data-testid="order-details">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium" data-testid="text-order-number">
              Order #{orderStatus.order}
            </h3>
            <span 
              className={getStatusChip(orderStatus.status)}
              data-testid="status-chip"
            >
              {orderStatus.status}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium" data-testid="text-service-name">
                    {getServiceName()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Count</p>
                  <p className="font-medium" data-testid="text-start-count">
                    {orderStatus.start_count?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="font-medium" data-testid="text-remaining">
                    {orderStatus.remains?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {orderStatus.charge && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">৳</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Charge</p>
                    <p className="font-medium" data-testid="text-charge">
                      ৳{parseFloat(orderStatus.charge).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span data-testid="text-progress-percentage">{Math.round(getProgress())}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    getProgress() === 100 ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{ width: `${getProgress()}%` }}
                  data-testid="progress-bar"
                />
              </div>
            </div>

            {/* Status Details */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Status Details</h4>
              <p className={`text-sm ${getStatusColor(orderStatus.status)}`} data-testid="text-status-details">
                {orderStatus.status === 'Completed' && 'Your order has been completed successfully!'}
                {orderStatus.status === 'In progress' && 'Your order is currently being processed.'}
                {orderStatus.status === 'Pending' && 'Your order is in queue and will be processed soon.'}
                {orderStatus.status === 'Partial' && 'Your order has been partially completed.'}
                {(orderStatus.status === 'Canceled' || orderStatus.status === 'Cancelled') && 'Your order has been canceled.'}
                {!['Completed', 'In progress', 'Pending', 'Partial', 'Canceled', 'Cancelled'].includes(orderStatus.status) && 
                 `Current status: ${orderStatus.status}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
