import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface MaterialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const MaterialButton = forwardRef<HTMLButtonElement, MaterialButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseClasses = "material-button font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
      primary: "material-button-primary",
      secondary: "material-button-secondary", 
      outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
    };

    const sizeClasses = {
      sm: "py-2 px-4 text-sm",
      md: "py-3 px-6",
      lg: "py-4 px-8 text-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MaterialButton.displayName = "MaterialButton";
