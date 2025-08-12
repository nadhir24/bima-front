"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface InvoiceNotification {
  id: string;
  order_id: string;
  invoice_number: string;
  status: "draft" | "pending" | "expired" | "overdue" | "paid" | "voided";
  gross_amount: number;
  pdf_url: string;
  payment_link_url: string;
  created_at: string;
  customer_details: {
    name: string;
    email: string;
    phone: string;
  };
  item_details: Array<{
    item_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export function InvoiceNotification() {
  const [notifications, setNotifications] = useState<InvoiceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/payment/invoice/notifications");
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();
        setNotifications(data.data);
        setUnreadCount(
          data.data.filter((n: InvoiceNotification) => n.status === "pending")
            .length
        );
      } catch (error) {
        toast.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <h4 className="font-semibold">Invoice Notifications</h4>
        </div>
        {notifications.length === 0 ? (
          <DropdownMenuItem className="text-muted-foreground">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link
                href={`/invoice/${notification.id}`}
                className="flex flex-col gap-1 p-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Invoice #{notification.invoice_number}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      notification.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : notification.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : notification.status === "expired"
                            ? "bg-red-100 text-red-800"
                            : notification.status === "overdue"
                              ? "bg-orange-100 text-orange-800"
                              : notification.status === "voided"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {notification.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{formatCurrency(notification.gross_amount)}</span>
                  <span className="text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <DropdownMenuItem asChild>
            <Link
              href="/invoice"
              className="text-center text-sm text-primary hover:underline"
            >
              View All Invoices
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
