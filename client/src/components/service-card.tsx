import { MaterialButton } from "./material-button";
import type { Service } from "../types";

interface ServiceCardProps {
  service: Service;
  onOrder: (serviceId: number) => void;
}

export function ServiceCard({ service, onOrder }: ServiceCardProps) {
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('instagram')) return { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', label: 'IG' };
    if (cat.includes('youtube')) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'YT' };
    if (cat.includes('facebook')) return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'FB' };
    if (cat.includes('twitter')) return { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', label: 'TW' };
    if (cat.includes('tiktok')) return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400', label: 'TK' };
    return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400', label: 'SM' };
  };

  const categoryIcon = getCategoryIcon(service.category);
  const ratePerUnit = parseFloat(service.rate);
  const ratePerThousand = (ratePerUnit * 1000).toFixed(2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group border border-gray-200 dark:border-gray-700" data-testid={`card-service-${service.id}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className={`w-12 h-12 ${categoryIcon.bg} rounded-xl flex items-center justify-center shadow-md` }>
              <span className={`text-lg font-bold ${categoryIcon.text}` }>
                {categoryIcon.label}
              </span>
            </span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white leading-tight" data-testid={`text-service-name-${service.id}`}>
                {service.name}
              </h4>
              <span className="inline-block text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium mt-2">
                {service.category}
              </span>
            </div>
          </div>
        </div>
        
        {service.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-grow" data-testid={`text-service-description-${service.id}`}>
            {service.description}
          </p>
        )}
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <span className="text-gray-500 dark:text-gray-400 block">Min</span>
              <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-service-min-${service.id}`}>
                {service.min.toLocaleString()}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <span className="text-gray-500 dark:text-gray-400 block">Max</span>
              <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-service-max-${service.id}`}>
                {service.max.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Price</span>
            <span className="font-bold text-lg text-green-600 dark:text-green-400" data-testid={`text-service-rate-${service.id}`}>
              ৳{ratePerThousand}/1k
            </span>
          </div>
        </div>
        
        <MaterialButton 
          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg group-hover:scale-105 transition-all duration-200 shadow-lg"
          onClick={() => onOrder(service.id)}
          data-testid={`button-order-service-${service.id}`}
        >
          Order Now
        </MaterialButton>
      </div>
    </div>
  );
}
