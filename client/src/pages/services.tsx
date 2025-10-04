import { useState, memo, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { ServiceCard } from "../components/service-card";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "../types";

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 15 * 60 * 1000, // Increased to 15 minutes for better performance
    refetchInterval: 10 * 60 * 1000, // Reduced frequency to 10 minutes
    refetchOnWindowFocus: false, // Disable refetch on focus for better performance
  });

  // Debug logging
  console.log('Services received:', services);
  console.log('Services length:', (services as Service[])?.length);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  // Memoized category mapping for better performance
  const getCategoryInfo = useCallback((category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('tiktok')) return { name: 'TikTok', icon: '🎵', color: 'bg-blue-500', textColor: 'text-pink-600' };
    if (cat.includes('instagram')) return { name: 'Instagram', icon: '📸', color: 'bg-purple-500', textColor: 'text-purple-600' };
    if (cat.includes('youtube')) return { name: 'YouTube', icon: '📺', color: 'bg-red-500', textColor: 'text-red-600' };
    if (cat.includes('facebook')) return { name: 'Facebook', icon: '📘', color: 'bg-blue-600', textColor: 'text-blue-600' };
    if (cat.includes('twitter')) return { name: 'Twitter', icon: '🐦', color: 'bg-cyan-500', textColor: 'text-cyan-600' };
    if (cat.includes('telegram')) return { name: 'Telegram', icon: '📱', color: 'bg-blue-400', textColor: 'text-blue-500' };
    if (cat.includes('snapchat')) return { name: 'Snapchat', icon: '👻', color: 'bg-yellow-400', textColor: 'text-yellow-600' };
    if (cat.includes('linkedin')) return { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', textColor: 'text-blue-700' };
    if (cat.includes('twitch')) return { name: 'Twitch', icon: '🎮', color: 'bg-purple-600', textColor: 'text-purple-700' };
    if (cat.includes('spotify')) return { name: 'Spotify', icon: '🎵', color: 'bg-green-500', textColor: 'text-green-600' };
    if (cat.includes('free fire') || cat.includes('freefire')) return { name: 'Free Fire', icon: '🔥', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { name: category, icon: '🌐', color: 'bg-gray-500', textColor: 'text-gray-600' };
  }, []);

  // Get unique platform categories (deduplicated)
  const getPlatformFromCategory = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('tiktok')) return 'TikTok';
    if (cat.includes('instagram')) return 'Instagram';
    if (cat.includes('youtube')) return 'YouTube';
    if (cat.includes('facebook')) return 'Facebook';
    if (cat.includes('twitter')) return 'Twitter';
    if (cat.includes('telegram')) return 'Telegram';
    if (cat.includes('snapchat')) return 'Snapchat';
    if (cat.includes('linkedin')) return 'LinkedIn';
    if (cat.includes('twitch')) return 'Twitch';
    if (cat.includes('spotify')) return 'Spotify';
    if (cat.includes('free fire') || cat.includes('freefire')) return 'Free Fire';
    return category;
  };

  // Memoized platforms calculation
  const platforms = useMemo(() => ["All", ...Array.from(new Set((services as Service[] || [])
    .filter((service: Service) => {
      const isFreeFire = service.category.toLowerCase().includes('free fire') || service.category.toLowerCase().includes('freefire');
      return !isFreeFire;
    })
    .map((service: Service) => getPlatformFromCategory(service.category))
  ))], [services]);

  // Memoized filtered services for better performance with debouncing
  const filteredServices = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    
    const filtered = (services as Service[]).filter((service) => {
      const matchesSearch = !searchQuery || service.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    return filtered;
  }, [services, searchQuery, selectedCategory]);

  const handleServiceOrder = useCallback((serviceId: number) => {
    setLocation(`/place-order?service=${serviceId}`);
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="material-card p-6 text-center">
          <h2 className="text-lg font-medium text-destructive mb-2">Error Loading Services</h2>
          <p className="text-sm text-muted-foreground">
            Failed to load services. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Search and Filter */}
      <div className="p-4 bg-surface dark:bg-card material-shadow-1">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search services..."
            className="material-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-services"
          />
        </div>
        
        {/* Platform Tabs - Horizontal Single Line */}
        <div className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide">
          {platforms.map((platform) => {
            const platformInfo = platform === "All" ? { name: "All", icon: "🌟", color: "bg-purple-500" } : getCategoryInfo(platform);
            return (
              <button
                key={platform}
                className={`px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors duration-200 flex items-center gap-2 flex-shrink-0 ${
                  selectedCategory === platform
                    ? `${platformInfo.color} text-white`
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                }`}
                onClick={() => setSelectedCategory(platform)}
                data-testid={`button-platform-${platform.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-lg">{platformInfo.icon}</span>
                <span>{platformInfo.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services List */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="material-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-20 ml-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="space-y-4" data-testid="list-services">
            {/* Compact Mobile Grid - 2 per row on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredServices.map((service: Service) => (
                <div key={service.id} className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                    {/* Compact Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getCategoryInfo(service.category).color} text-white`}>
                        {getCategoryInfo(service.category).icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight">
                          {service.name}
                        </h4>
                      </div>
                    </div>
                    
                    {/* Simplified Price */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 mb-2">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400 text-center">
                        ৳{(parseFloat(service.rate) * 1000).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 text-center">per 1K</div>
                    </div>
                    
                    {/* Min/Max */}
                    <div className="grid grid-cols-2 gap-1 text-xs mb-3 flex-1">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-1 text-center">
                        <div className="text-gray-500 dark:text-gray-400">Min</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-xs">
                          {service.min > 1000 ? `${(service.min/1000).toFixed(0)}K` : service.min}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-1 text-center">
                        <div className="text-gray-500 dark:text-gray-400">Max</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-xs">
                          {service.max > 1000000 ? `${(service.max/1000000).toFixed(0)}M` : service.max > 1000 ? `${(service.max/1000).toFixed(0)}K` : service.max}
                        </div>
                      </div>
                    </div>
                    
                    {/* Simplified Order Button */}
                    <button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg text-xs transition-colors duration-200"
                      onClick={() => handleServiceOrder(service.id)}
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12" data-testid="text-no-services">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No services found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
