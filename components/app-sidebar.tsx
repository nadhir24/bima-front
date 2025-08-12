"use client";
import * as React from "react";
import { usePathname } from "next/navigation";

import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  isActive?: boolean;
};

type SidebarGroupProps = {
  title: string;
  items: NavItem[];
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  navigationData: SidebarGroupProps[];
};

function SidebarGroupComponent({ title, items }: SidebarGroupProps) {
  const pathname = usePathname(); // Mendapatkan URL saat ini

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {/* Tentukan apakah item aktif berdasarkan URL */}
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <a href={item.url}>{item.title}</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ navigationData, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props} className="pt-16 fixed top-0 left-0 h-screen z-50">
      <SidebarHeader>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {navigationData.map((group) => (
          <SidebarGroupComponent
            key={group.title}
            title={group.title}
            items={group.items}
          />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
