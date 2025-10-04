import { Menu, EllipsisVertical, RefreshCw, Info } from "lucide-react";

interface AndroidHeaderProps {
  title: string;
  onMenuClick: () => void;
  onRefresh?: () => void;
}

export function AndroidHeader({ title, onMenuClick, onRefresh }: AndroidHeaderProps) {
  return (
    <>
      <header className="bg-primary text-primary-foreground material-shadow-2 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <button 
              className="ripple p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
              onClick={onMenuClick}
              data-testid="button-menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-medium" data-testid="text-page-title">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button 
                className="ripple p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={onRefresh}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-6 h-6 text-white" />
              </button>
            )}
            <button 
              className="ripple p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
              data-testid="button-notifications"
            >
              <Info className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
