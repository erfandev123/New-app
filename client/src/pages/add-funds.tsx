import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../lib/api";
import { MaterialButton } from "../components/material-button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, MessageCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const paymentFormSchema = z.object({
  amount: z.number().min(20, "Amount must be at least ৳20"),
  method: z.enum(["bkash", "nagad", "rocket", "whatsapp"]),
  transaction_id: z.string().min(1, "Transaction ID is required"),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function AddFunds() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 20,
      method: "bkash",
      transaction_id: "",
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: api.addPayment,
    onSuccess: (data) => {
      toast({
        title: "Payment Submitted!",
        description: `Payment #${data.paymentId} has been submitted for verification.`,
      });
      
      // Invalidate balance cache
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    addPaymentMutation.mutate(data);
  };

  const handleBack = () => {
    // Try to go back in history, fallback to dashboard
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/dashboard");
    }
  };

  const paymentMethods = [
    {
      value: "bkash",
      label: "bKash",
      icon: Smartphone,
      number: "01774633714",
      description: "Send money to this bKash number",
    },
    {
      value: "nagad",
      label: "Nagad",
      icon: CreditCard,
      number: "01774633714",
      description: "Send money to this Nagad number",
    },
    {
      value: "whatsapp",
      label: "WhatsApp Contact",
      icon: MessageCircle,
      number: "01774633714",
      description: "Contact via WhatsApp for manual payment",
    },
    {
      value: "rocket",
      label: "Rocket",
      icon: CreditCard,
      number: "01724169982",
      description: "Send money to this Rocket number",
    },
  ];

  const selectedMethod = paymentMethods.find(m => m.value === form.watch("method"));

  return (
    <div className="pb-20 p-4">
      <div className="material-card p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 mr-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-medium">Add Funds</h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Amount (৳)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="20"
                      className="material-input text-lg font-semibold"
                      min="20"
                      step="1"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500 mt-1">Minimum amount: ৳20</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Payment Method</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="material-input text-lg">
                        <SelectValue placeholder="Choose payment method..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value} className="text-lg">
                            <div className="flex items-center gap-3">
                              <method.icon className="w-5 h-5" />
                              {method.label}
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

            {selectedMethod && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <selectedMethod.icon className="w-4 h-4" />
                    {selectedMethod.label} Payment Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedMethod.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-background rounded-lg p-3 border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Number:</span>
                      <span className="text-sm font-mono">{selectedMethod.number}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium">Amount:</span>
                      <span className="text-sm font-mono">৳{form.watch("amount")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="transaction_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter transaction ID from payment app"
                      className="material-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <MaterialButton
              type="submit"
              className="w-full"
              disabled={addPaymentMutation.isPending}
            >
              {addPaymentMutation.isPending ? "Submitting..." : "Submit Payment"}
            </MaterialButton>
          </form>
        </Form>
      </div>
    </div>
  );
} 