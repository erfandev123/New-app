import { Link } from "wouter";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "@/services/firebase";
import { 
  LayoutDashboard, 
  List, 
  ShoppingCart, 
  TrainTrack, 
  HandHelping, 
  Settings,
  User,
  Shield
} from "lucide-react";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const auth = getAuth(app);
  const [user, setUser] = useState(auth.currentUser);
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, [auth]);
  const menuItems = [
    { href: "/", icon: LayoutDashboard, label: "LayoutDashboard", primary: true },
    { href: "/services", icon: List, label: "Services" },
    { href: "/orders", icon: ShoppingCart, label: "My Orders" },
    { href: "/status", icon: TrainTrack, label: "Order Status" },
  ];

  const secondaryItems = [
    { href: "/support", icon: HandHelping, label: "Support" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 sm:w-80 bg-white dark:bg-gray-900 shadow-2xl animate-slide-up overflow-y-auto">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate" data-testid="text-user-name">{user?.displayName || "Guest"}</h3>
              <p className="text-xs sm:text-sm opacity-90 truncate" data-testid="text-user-email">{user?.email || "Not signed in"}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
          {menuItems.map(({ href, icon: Icon, label, primary }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center space-x-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ripple group ${
                primary ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={onClose}
              data-testid={`link-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                primary ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600"
              }`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-semibold text-sm sm:text-base truncate">{label}</span>
            </Link>
          ))}
          
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-6" />
          
          {secondaryItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ripple text-gray-600 dark:text-gray-400 group"
              onClick={onClose}
              data-testid={`link-${label.toLowerCase()}`}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-medium text-sm sm:text-base truncate">{label}</span>
            </Link>
          ))}

          {!user ? (
            <>
              <Link
                href="/login"
                className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white ripple shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={onClose}
              >
                <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-lg">🔐</span>
                </div>
                <span className="font-semibold">Login</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ripple text-gray-700 dark:text-gray-300 group border border-gray-200 dark:border-gray-600"
                onClick={onClose}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600">
                  <span className="text-lg">👤</span>
                </div>
                <span className="font-semibold">Create Account</span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                signOut(auth).then(() => {
                  localStorage.removeItem('socialSphere_user');
                  onClose();
                  window.location.href = '/login';
                });
              }}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white ripple shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-4"
            >
              <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-lg">🚪</span>
              </div>
              <span className="font-semibold">Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
