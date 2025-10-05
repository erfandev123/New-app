import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AndroidHeader } from "./components/android-header";
import { BottomNavigation } from "./components/bottom-navigation";
import { NavigationDrawer } from "./components/navigation-drawer";
import Dashboard from "@/pages/dashboard";
import Services from "@/pages/services";
import PlaceOrder from "@/pages/place-order";
import OrderStatus from "@/pages/order-status";
import FreeFire from "@/pages/free-fire";
import TikTok from "@/pages/tiktok";
import OrderHistory from "@/pages/order-history";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AddFunds from "@/pages/add-funds";
import AdminServices from "@/pages/admin-services";
import Settings from "@/pages/settings";
import Support from "@/pages/support";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/services/firebase";
import { api } from "./lib/api";

function Router() {
  const [location] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth(app);
    
    // Create a demo user if no auth is available
    const createDemoUser = () => {
      const demoUser = {
        uid: 'demo-user-' + Date.now(),
        email: 'demo@socialsphere.com',
        displayName: 'Demo User'
      };
      setUser(demoUser);
      localStorage.setItem('socialSphere_user', JSON.stringify(demoUser));
      return demoUser;
    };
    
    // Check for saved user session
    const savedUser = localStorage.getItem('socialSphere_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('socialSphere_user');
        createDemoUser();
      }
    } else {
      // Create demo user if no saved session
      createDemoUser();
    }
    
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Save user session
          localStorage.setItem('socialSphere_user', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          }));
          await api.syncUser(firebaseUser);
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }
      // Don't clear user on logout - keep demo user
    });
  }, []);

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/": return "Dashboard";
      case "/services": return "Services";
      case "/place-order": return "Place Order";
      case "/orders": return "My Orders";
      case "/tiktok": return "TikTok Services";
      case "/status": return "Order Status";
      case "/add-funds": return "Add Funds";
      case "/admin-services": return "Admin Panel";
      case "/login": return "Login";
      case "/signup": return "Sign Up";
      case "/settings": return "Settings";
      case "/support": return "Support";
      default: return "BDClick24";
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const handleQuickOrder = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    window.location.href = "/services";
  };

  // Don't show header for auth pages
  const isAuthPage = location === "/login" || location === "/signup";

  return (
    <>
      {!isAuthPage && (
        <AndroidHeader 
          title={getPageTitle(location)}
          onMenuClick={() => setIsDrawerOpen(true)}
          onRefresh={handleRefresh}
        />
      )}
      
      <NavigationDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main className={`min-h-screen ${!isAuthPage ? 'pt-20' : ''}`} style={{ backgroundColor: "var(--background-gray)" }}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/services" component={Services} />
          <Route path="/place-order" component={PlaceOrder} />
          <Route path="/orders" component={OrderHistory} />
          <Route path="/tiktok" component={TikTok} />
          <Route path="/status" component={OrderStatus} />
          <Route path="/free-fire" component={FreeFire} />
          <Route path="/add-funds" component={AddFunds} />
          <Route path="/admin-services" component={AdminServices} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/settings" component={Settings} />
          <Route path="/support" component={Support} />
          <Route component={NotFound} />
        </Switch>
      </main>

      {!isAuthPage && <BottomNavigation />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
