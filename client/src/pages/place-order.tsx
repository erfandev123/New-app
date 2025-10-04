import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../lib/api";
import { MaterialButton } from "../components/material-button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Wallet, Calculator, CheckCircle, AlertCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Service, Balance } from "../types";

const orderFormSchema = z.object({
  service: z.string().min(1, "Please select a service"),
  link: z.string().url("Please enter a valid URL"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function PlaceOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Get service ID from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedServiceId = searchParams.get("service");

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Load user balance with immediate fetch and caching
  const { data: balanceData, isLoading: balanceLoading } = useQuery<Balance>({
    queryKey: ["/api/balance"],
    staleTime: 5 * 1000, // Cache for 5 seconds only
    refetchInterval: 15 * 1000, // Check every 15 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
    retry: 3, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      service: preselectedServiceId || "",
      link: "",
      quantity: 1000,
    },
  });

  const watchedService = form.watch("service");
  const watchedQuantity = form.watch("quantity");

  // Update selected service when form value changes
  useEffect(() => {
    if (watchedService && (services as Service[]).length > 0) {
      const service = (services as Service[]).find((s: Service) => s.id?.toString() === watchedService);
      setSelectedService(service || null);
      
      // Update quantity constraints
      if (service) {
        const currentQuantity = form.getValues("quantity");
        if (currentQuantity < service.min) {
          form.setValue("quantity", service.min);
        } else if (currentQuantity > service.max) {
          form.setValue("quantity", service.max);
        }
      }
    }
  }, [watchedService, services, form]);

  const placeOrderMutation = useMutation({
    mutationFn: api.placeOrder,
    onSuccess: (data) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${data.orderId} has been created. Charge: ৳${parseFloat(data.charge).toFixed(2)}`,
      });
      
      // Invalidate orders cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      
      // Navigate to order status page
      setLocation(`/status?order=${data.orderId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Place Order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderFormData) => {
    if (!selectedService) {
      toast({
        title: "Service Required",
        description: "Please select a service before placing the order.",
        variant: "destructive",
      });
      return;
    }

    placeOrderMutation.mutate({
      service: parseInt(data.service),
      link: data.link,
      quantity: data.quantity,
    });
  };

  const totalCost = useMemo(() => {
    if (!selectedService || !watchedQuantity) return 0;
    const ratePerUnit = parseFloat(selectedService.rate || "0");
    // Calculate total cost in BDT
    const total = ratePerUnit * watchedQuantity;
    return Number.isFinite(total) ? total : 0;
  }, [selectedService, watchedQuantity]);

  const formattedTotal = useMemo(() => totalCost.toFixed(2), [totalCost]);
  const numericBalance = useMemo(() => parseFloat(balanceData?.balance ?? "0"), [balanceData]);
  const hasInsufficientBalance = useMemo(() => totalCost > numericBalance, [totalCost, numericBalance]);

  const handleBack = () => {
    // Try to go back in history, fallback to services page
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/services");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Place Order</h1>
              <p className="text-green-100">Create your new order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Balance & Total Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-200/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <div className="text-sm text-gray-600">Current Balance</div>
            </div>
            {balanceLoading ? (
              <div className="text-2xl font-bold text-gray-400">Loading...</div>
            ) : (
              <div className="text-2xl font-bold text-green-600">৳{numericBalance.toFixed(2)}</div>
            )}
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div className="text-sm text-gray-600">Estimated Total</div>
            </div>
            <div className={`text-2xl font-bold ${hasInsufficientBalance ? "text-red-600" : "text-blue-600"}`}>৳{formattedTotal}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              {hasInsufficientBalance ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <div className="text-sm text-gray-600">Status</div>
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-medium ${hasInsufficientBalance ? "text-red-600" : "text-green-600"}`}>
                {hasInsufficientBalance ? "Insufficient Balance" : "Ready to Order"}
              </div>
              <button
                onClick={() => setLocation("/add-funds")}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs hover:from-purple-600 hover:to-indigo-700 transition-all duration-300"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>
        
        {/* Order Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Order Details
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Select Service</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={servicesLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-400 bg-white/80" data-testid="select-service">
                          <SelectValue placeholder="Choose a service..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {(services as Service[]).filter(service => service.id).map((service: Service) => (
                            <SelectItem 
                              key={service.id} 
                              value={service.id?.toString() || ""}
                              data-testid={`option-service-${service.id}`}
                              className="rounded-lg"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{service.name}</span>
                                <span className="text-sm text-gray-500">৳{parseFloat(service.rate || "0").toFixed(4)}/unit</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      {selectedService?.category?.toLowerCase().includes('free fire') ? 'FF UID' : 'Profile/Video URL'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type={selectedService?.category?.toLowerCase().includes('free fire') ? "text" : "url"}
                        placeholder={
                          selectedService?.category?.toLowerCase().includes('free fire') 
                            ? "Enter your Free Fire UID" 
                            : "https://instagram.com/username"
                        }
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-400 bg-white/80"
                        data-testid="input-link"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Quantity</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="1000"
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-400 bg-white/80"
                        min={selectedService?.min || 1}
                        max={selectedService?.max || 100000}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    {selectedService && (
                      <p className="text-sm text-gray-500 mt-1">
                        Min: {selectedService.min.toLocaleString()}, Max: {selectedService.max.toLocaleString()}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={placeOrderMutation.isPending || !selectedService || hasInsufficientBalance}
                className={`w-full h-12 rounded-xl font-semibold transition-all duration-300 ${
                  placeOrderMutation.isPending || !selectedService || hasInsufficientBalance
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
                data-testid="button-place-order"
              >
                {placeOrderMutation.isPending ? "Placing Order..." : hasInsufficientBalance ? "Insufficient Balance" : "Place Order"}
              </button>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        {selectedService && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg" data-testid="order-summary">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-green-600" />
              Order Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-800" data-testid="text-summary-service">
                  {selectedService.name}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-800" data-testid="text-summary-quantity">
                  {watchedQuantity?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Rate:</span>
                <span className="font-medium text-gray-800" data-testid="text-summary-rate">
                  {selectedService.category?.toLowerCase().includes('free fire') 
                    ? `${watchedQuantity} diamonds` 
                    : `৳${parseFloat(selectedService.rate).toFixed(4)}/unit`
                  }
                </span>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600" data-testid="text-summary-total">
                    ৳{formattedTotal}
                  </span>
                </div>
                {hasInsufficientBalance && (
                  <div className="text-sm text-red-600 mt-3 p-3 bg-red-50 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    You don't have enough balance to place this order.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
