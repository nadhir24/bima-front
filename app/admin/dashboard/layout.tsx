import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const navigationData = [
  {
    title: "list",
    items: [
      { title: "Dashboard", url: "/admin/dashboard" },
      { title: "Users", url: "/admin/dashboard/users" },
      { title: "Products", url: "/admin/dashboard/products" },
      { title: "Orders", url: "/admin/dashboard/orders" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* Sidebar */}
      <SidebarProvider>
        <AppSidebar
          navigationData={navigationData}
          className="w-[250px] md:w-[300px] lg:w-[350px]"        />
        <SidebarTrigger className="-ml-1" />
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </SidebarProvider>
    </div>
  );
}