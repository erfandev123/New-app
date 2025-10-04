import { useState } from "react";
import { useLocation } from "wouter";
import { MaterialButton } from "@/components/material-button";
import { ArrowLeft, Bell, Shield, Palette, Info, HelpCircle, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleBack = () => {
    // Try to go back in history, fallback to dashboard
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/dashboard");
    }
  };

  const settingsItems = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Get notified about order updates and promotions",
      action: (
        <Switch
          checked={notifications}
          onCheckedChange={setNotifications}
        />
      ),
    },
    {
      icon: Palette,
      title: "Dark Mode",
      description: "Switch between light and dark themes",
      action: (
        <Switch
          checked={darkMode}
          onCheckedChange={setDarkMode}
        />
      ),
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Manage your account security settings",
      action: <MaterialButton variant="outline" size="sm">Configure</MaterialButton>,
    },
  ];

  const supportItems = [
    {
      icon: HelpCircle,
      title: "Help Center",
      description: "Find answers to common questions",
      action: <MaterialButton variant="outline" size="sm">Visit</MaterialButton>,
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@socialsphere.com",
      action: <MaterialButton variant="outline" size="sm">Contact</MaterialButton>,
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+880 1724-169982",
      action: <MaterialButton variant="outline" size="sm">Call</MaterialButton>,
    },
  ];

  return (
    <div className="pb-20 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 mr-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        <div className="space-y-6">
          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                App Settings
              </CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  {item.action}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Support & Help
              </CardTitle>
              <CardDescription>
                Get help when you need it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  {item.action}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                About SocialSphere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Build</span>
                  <span className="font-medium">2024.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Developer</span>
                  <span className="font-medium">SocialSphere Team</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 