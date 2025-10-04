import { Link, useLocation } from "wouter";
import { memo } from "react";
import { 
  Home, 
  Grid3X3, 
  Music, 
  Gamepad2
} from "lucide-react";

const BottomNavigationComponent = memo(() => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home", testId: "nav-dashboard" },
    { path: "/services", icon: Grid3X3, label: "Services", testId: "nav-services" },
    { path: "/tiktok", icon: Music, label: "TikTok", testId: "nav-tiktok" },
    { path: "/free-fire", icon: Gamepad2, label: "Free Fire", testId: "nav-freefire" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30" 
         style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label, testId }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
              data-testid={testId}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-slide-down" />
              )}
              
              {/* Simplified icon for better performance */}
              <div className={`relative p-2 rounded-xl transition-colors duration-200 ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-500 dark:text-gray-400 group-hover:text-primary"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Simplified label */}
              <span className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                isActive 
                  ? "text-primary font-semibold" 
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Bottom safe area for modern phones */}
      <div className="h-safe-area-inset-bottom bg-white dark:bg-gray-900" />
    </nav>
  );
});

BottomNavigationComponent.displayName = 'BottomNavigation';

export const BottomNavigation = BottomNavigationComponent;
