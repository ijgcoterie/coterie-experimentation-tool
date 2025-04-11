"use client";

// Example of how to customize the sidebar
import { 
  HomeIcon,
  BeakerIcon, 
  Cog6ToothIcon,
  UserCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon
} from "@heroicons/react/24/outline";

import { NavigationItem } from "@/app/components/layout/SidebarProvider";

// Custom navigation items
export const customNavigation: NavigationItem[] = [
  { 
    name: "Home", 
    href: "/", 
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
    name: "Documentation", 
    href: "/docs", 
    icon: <DocumentTextIcon className="w-5 h-5" /> 
  },
  { 
    name: "Notifications", 
    href: "/notifications", 
    icon: <BellIcon className="w-5 h-5" /> 
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: <Cog6ToothIcon className="w-5 h-5" /> 
  },
];

// Custom profile icon
export const customProfileIcon = (
  <UserCircleIcon className="w-6 h-6" />
);

// Example usage in a layout file:
/*
import { SidebarProvider } from "@/app/components/layout/SidebarProvider";
import { customNavigation, customProfileIcon } from "@/app/customSidebar";

// ...

<SidebarProvider 
  navigation={customNavigation}
  profileIcon={customProfileIcon}
  logoText="APP"
>
  {children}
</SidebarProvider>
*/