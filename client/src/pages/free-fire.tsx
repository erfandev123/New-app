import { useQuery } from "@tanstack/react-query";
import { ServiceCard } from "@/components/service-card";
import type { Service } from "@/types";
import { useLocation } from "wouter";

export default function FreeFire() {
  const [, setLocation] = useLocation();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const freeFireServices = (services as Service[]).filter((s) =>
    s.category.toLowerCase().includes("free fire") || s.category.toLowerCase().includes("freefire")
  );

  const handleServiceOrder = (serviceId: number) => {
    setLocation(`/place-order?service=${serviceId}`);
  };

  return (
    <div className="px-4 pb-20">
      <div className="py-4">
        <h2 className="text-xl font-semibold mb-2">Free Fire Top Up & Services</h2>
        <p className="text-sm text-muted-foreground">All Free Fire top up and related services in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="material-card p-6 h-40 animate-pulse" />
          ))
        ) : (
          freeFireServices.map((service) => (
            <ServiceCard key={service.id} service={service} onOrder={handleServiceOrder} />
          ))
        )}
      </div>
    </div>
  );
}

