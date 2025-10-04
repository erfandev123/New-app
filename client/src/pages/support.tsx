import { useState } from "react";
import { useLocation } from "wouter";
import { MaterialButton } from "@/components/material-button";
import { ArrowLeft, HelpCircle, Mail, Phone, MessageCircle, FileText, Users, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function Support() {
  const [, setLocation] = useLocation();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleBack = () => {
    // Try to go back in history, fallback to dashboard
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/dashboard");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Contact form submitted:", contactForm);
  };

  const faqItems = [
    {
      question: "How do I place an order?",
      answer: "Go to Services page, select your desired platform, choose a service, and click 'Order Now'. Fill in the required details and confirm your order.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept bKash, Nagad, and Rocket payments. Minimum amount is ৳20.",
    },
    {
      question: "How long does it take to complete an order?",
      answer: "Order completion time varies by service. Most orders start within 1-2 hours and complete within 24-48 hours.",
    },
    {
      question: "Can I cancel an order?",
      answer: "Orders can only be cancelled within 30 minutes of placement if they haven't started processing yet.",
    },
    {
      question: "How do I check my order status?",
      answer: "Go to 'Order Status' page and enter your order ID to check the current status.",
    },
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "+880 1724-169982",
      action: "Call Now",
      color: "bg-green-500",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@socialsphere.com",
      action: "Send Email",
      color: "bg-blue-500",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Available 24/7",
      action: "Start Chat",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="pb-20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 mr-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Support & Help</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Contact Us
                </CardTitle>
                <CardDescription>
                  Get in touch with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center text-white`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{method.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{method.description}</p>
                      </div>
                    </div>
                    <MaterialButton variant="outline" size="sm">
                      {method.action}
                    </MaterialButton>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Message
                </CardTitle>
                <CardDescription>
                  Send us a message and we'll get back to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="What's this about?"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      rows={4}
                      required
                    />
                  </div>
                  <MaterialButton type="submit" className="w-full">
                    Send Message
                  </MaterialButton>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Find answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {item.question}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Why Choose SocialSphere?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">100%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Secure</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Fast</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Delivery</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">500+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Services</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 