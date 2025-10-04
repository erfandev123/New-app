import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ServiceCard } from "@/components/service-card";
import { Input } from "@/components/ui/input";
import { Search, Music, TrendingUp, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TikTok() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => api.getServices(),
  });

  // Filter TikTok services
  const tiktokServices = services.filter(service => 
    service.name.toLowerCase().includes("tiktok") ||
    service.category.toLowerCase().includes("tiktok")
  );

  // Get unique TikTok categories
  const tiktokCategories = Array.from(
    new Set(tiktokServices.map(service => service.category))
  );

  // Filter services based on search and category
  const filteredServices = tiktokServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.toLowerCase().includes("follower")) return Users;
    if (serviceName.toLowerCase().includes("like")) return Heart;
    if (serviceName.toLowerCase().includes("view")) return TrendingUp;
    return Music;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:from-gray-900">
      {/* Simplified Header */}
      <div className="bg-pink-500 text-white p-4">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">TikTok Services</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search TikTok services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-2 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm"
          />
        </div>

        {/* Simplified Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              selectedCategory === "all" 
                ? "bg-pink-500 text-white" 
                : "bg-white text-gray-600 border"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            All
          </button>
          {tiktokCategories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                selectedCategory === category 
                  ? "bg-pink-500 text-white" 
                  : "bg-white text-gray-600 border"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.replace("TikTok", "").trim() || category}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-white/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => window.location.href = `/place-order?service=${service.id}`}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                data-testid={`service-card-${service.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                      {service.name?.replace(/^TikTok\s*/i, '') || 'Unknown Service'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Min: {service.min?.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">Max: {service.max?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ৳{parseFloat(service.rate || "0").toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500">per unit</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-2 py-1 rounded-lg font-medium text-xs pointer-events-none">
                    Order
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No TikTok Services Found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20" />
    </div>
  );
}
