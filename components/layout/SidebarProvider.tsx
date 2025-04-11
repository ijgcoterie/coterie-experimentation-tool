"use client";

import { createContext, useContext, ReactNode } from 'react';
import { 
  HomeIcon,
  BeakerIcon, 
  Cog6ToothIcon,
  UserCircleIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

// Define the navigation item structure
export interface NavigationItem {
  name: string;
  href: string;
  icon: ReactNode;
}

// Default navigation items
const defaultNavigation: NavigationItem[] = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: <HomeIcon className="w-5 h-5" /> 
  },
  { 
    name: "Experiments", 
    href: "/experiments", 
    icon: <BeakerIcon className="w-5 h-5" /> 
  },
  { 
    name: "Analytics", 
    href: "/analytics", 
    icon: <ChartBarIcon className="w-5 h-5" /> 
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: <Cog6ToothIcon className="w-5 h-5" /> 
  },
];

// Default profile icon
const defaultProfileIcon = <UserCircleIcon className="w-6 h-6" />;

// Define the context structure
interface SidebarContextType {
  navigation: NavigationItem[];
  profileIcon: ReactNode;
  logoText: string;
}

// Create the context with default values
const SidebarContext = createContext<SidebarContextType>({
  navigation: defaultNavigation,
  profileIcon: defaultProfileIcon,
  logoText: 'CSE',
});

// Provider props
interface SidebarProviderProps {
  children: ReactNode;
  navigation?: NavigationItem[];
  profileIcon?: ReactNode;
  logoText?: string;
}

// Create the provider component
export function SidebarProvider({ 
  children, 
  navigation = defaultNavigation,
  profileIcon = defaultProfileIcon,
  logoText = 'CSE'
}: SidebarProviderProps) {
  return (
    <SidebarContext.Provider value={{ navigation, profileIcon, logoText }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook to use the sidebar context
export function useSidebar() {
  return useContext(SidebarContext);
}