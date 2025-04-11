"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const pathname = usePathname();
  const { navigation, logoText } = useSidebar();

  return (
    <div className="flex h-full flex-col bg-[#F7F8F9] border-r border-[#DCE0E6] w-16">
      <div className="flex h-16 shrink-0 items-center justify-center">
        <Link href="/" className="flex items-center justify-center">
          <div className="text-blue-600 font-bold text-lg">{logoText}</div>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center py-4">
        <ul className="space-y-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-center w-10 h-10 rounded-md ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900"
                  }`}
                  title={item.name}
                >
                  {/* Apply icon color based on active state */}
                  <div className={isActive ? "text-blue-600" : "text-[#1F2328]"}>
                    {item.icon}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="py-4 flex justify-center">
      <Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>

      </div>
    </div>
  );
}