import type { Order, Service } from "../types";

interface OrderCardProps {
  order: Order;
  service?: Service;
}

export function OrderCard({ order, service }: OrderCardProps) {
  const getStatusChip = (status: string) => {
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
    if (!order.remains || !order.quantity) return 0;
    return Math.round(((order.quantity - order.remains) / order.quantity) * 100);
  };

  const progress = getProgress();
  const delivered = order.quantity - (order.remains || 0);

  return (
    <div className="material-card p-4" data-testid={`card-order-${order.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium" data-testid={`text-order-name-${order.id}`}>
            {service?.name || `Service #${order.service}`}
          </h4>
          <p className="text-sm text-muted-foreground" data-testid={`text-order-id-${order.id}`}>
            Order #{order.id}
          </p>
        </div>
        <span 
          className={getStatusChip(order.status)}
          data-testid={`status-order-${order.id}`}
        >
          {order.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="text-muted-foreground">Quantity:</span>
          <span className="font-medium ml-1" data-testid={`text-order-quantity-${order.id}`}>
            {order.quantity.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Delivered:</span>
          <span 
            className="font-medium ml-1 text-green-600 dark:text-green-400"
            data-testid={`text-order-delivered-${order.id}`}
          >
            {delivered.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Cost:</span>
          <span className="font-medium ml-1" data-testid={`text-order-cost-${order.id}`}>
            ৳{parseFloat(order.charge).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium ml-1" data-testid={`text-order-date-${order.id}`}>
            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
      
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-500 ${
            progress === 100 ? 'bg-green-500' : 
            progress > 0 ? 'bg-primary' : 'bg-muted-foreground'
          }`}
          style={{ width: `${progress}%` }}
          data-testid={`progress-order-${order.id}`}
        />
      </div>
      <div className="flex justify-between text-sm text-muted-foreground mt-1">
        <span>Progress</span>
        <span data-testid={`text-order-progress-${order.id}`}>{progress}%</span>
      </div>
    </div>
  );
}
