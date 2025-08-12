"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Users, ShoppingBag, DollarSign } from "lucide-react";
import axios from "axios";
interface DashboardSummary {
  totalSales: number;
  totalUsers: number;
  totalProducts: number;
  recentSales: Array<{
    id: number;
    amount: number;
    createdAt: string;
    user: {
      fullName: string;
    } | null;
  }>;
  recentOrders: Array<{
    id: number;
    invoiceId: number;
    invoiceStatus: string;
    userName: string;
    productName: string;
    quantity: number;
    price: number;
    date: string;
    sizeId: number;
    sizeLabel: string;
  }>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Error",
          description: "Session expired. Please login again.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchSummary();
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchData();

    // Add polling for summary
    const summaryInterval = setInterval(() => {
      fetchSummary();
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(summaryInterval);
    };
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalSales || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalProducts || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary?.recentSales?.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">
                      {sale.user?.fullName || "Anonymous User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="font-medium text-green-600">
                    +{formatCurrency(sale.amount)}
                  </div>
                </div>
              ))}
              {(!summary?.recentSales || summary.recentSales.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent sales
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary?.recentOrders?.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">{order.userName}</p>
                    <p className="text-sm font-medium">
                      {order.productName}
                      {order.sizeLabel && <span> ({order.sizeLabel})</span>}
                      <span> ({order.quantity}x)</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-right">
                      {formatCurrency(order.price)}
                    </p>
                    <p
                      className={`text-sm text-right ${
                        order.invoiceStatus === "SETTLEMENT"
                          ? "text-green-600"
                          : order.invoiceStatus === "PENDING"
                            ? "text-yellow-600"
                            : order.invoiceStatus === "DELIVERED"
                              ? "text-green-600"
                              : order.invoiceStatus === "SHIPPED"
                                ? "text-yellow-600"
                                : order.invoiceStatus === "PENDING"
                                  ? "text-yellow-600"
                                  : order.invoiceStatus === "PROCESSING"
                                    ? "text-blue-600"
                                    : order.invoiceStatus === "expire"
                                      ? "text-gray-600"
                                      : order.invoiceStatus === "deny"
                                        ? "text-red-600"
                                        : order.invoiceStatus === "cancel"
                                          ? "text-orange-600"
                                          : "text-red-600"
                      }`}
                    >
                      {order.invoiceStatus}
                    </p>
                  </div>
                </div>
              ))}
              {(!summary?.recentOrders ||
                summary.recentOrders.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent orders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
