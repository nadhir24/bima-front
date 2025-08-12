"use client";
import { usePathname } from 'next/navigation';

export function useDynamicNavigation() {
  const pathname = usePathname(); // Mendapatkan path saat ini

  // Navigasi untuk User Management
  const usersNavigation = [
    {
      title: "User Management",
      items: [
        { title: "All Users", url: "/admin/users" },
        { title: "Add User", url: "/admin/users/add" },
        { title: "Edit Users", url: "/admin/users/edit" },
        { title: "Roles User", url: "/admin/users/roles" },
      ],
    },
  ];

  // Update navigasi berdasarkan path saat ini
  const updatedNavigation = usersNavigation.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      isActive: pathname === item.url, // Menandai sebagai aktif jika URL cocok
    })),
  }));

  return updatedNavigation;
}
