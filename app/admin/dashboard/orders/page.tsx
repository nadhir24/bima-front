"use client";

import { useEffect, useState, useCallback } from "react"; // Import useCallback
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import Button from "@/components/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import React from "react";

// Define possible fulfillment statuses
const FULFILLMENT_STATUSES = {
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  PENDING: "PENDING",
  SETTLEMENT: "SETTLEMENT",
} as const;

type FulfillmentStatus = keyof typeof FULFILLMENT_STATUSES;

interface Order {
  id: number;
  midtransOrderId: string;
  amount: number;
  status: FulfillmentStatus;
  paymentStatus?: string;
  createdAt: string;
  paymentUrl: string;
  midtransInvoicePdfUrl?: string;
  // Add Shipping Fields (make optional for backward compatibility)
  shippingFirstName?: string | null;
  shippingLastName?: string | null;
  shippingEmail?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingDistrict?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  shippingPostalCode?: string | null;
  shippingCountryCode?: string | null;
  user: {
    fullName: string;
    email: string;
  } | null;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    sizeId?: number;
    sizeInfo?: {
      id: number;
      size: string;
      price: string;
      qty: number;
      catalogId: number;
    } | null;
  }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updateLoading, setUpdateLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | "all">(
    "all"
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // Sonner toast is imported from "sonner"

  // Debounce timeout reference
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(
    async (resetPage = false, isDebouncedSearch = false) => {
      try {
        if (resetPage) {
          setCurrentPage(1);
        }

        const page = resetPage ? 1 : currentPage;
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });

        // Add search query if present
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        // Add status filter if not 'all'
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        if (startDate && endDate) {
          params.append("startDate", startDate);
          params.append("endDate", endDate);
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payment/invoice/admin?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch orders");
        }

        const data = await response.json();

        const fetchedOrders = data.data || [];
        const paginationData = data.pagination || {};

        setOrders(fetchedOrders);
        setTotalPages(paginationData.totalPages || 1); 

     
        if (resetPage && !isDebouncedSearch) {
          setCurrentPage(1);
        }
      } catch (error) {
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to load orders data",
        });
        setOrders([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
      // Include dependencies for useCallback
    },
    [currentPage, searchQuery, statusFilter, startDate, endDate]
  );

  // Effect for fetching orders when page changes
  useEffect(() => {
    // Avoid fetching if searchQuery is being debounced
    if (!debounceTimeoutRef.current) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Only trigger on currentPage change

  // Effect for debounced search, status filter, and date changes
  useEffect(() => {
    // Clear existing timeout if parameters change
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Skip immediate search on component mount
    if (document.readyState !== "loading") {
      // Set a new timeout to fetch orders after 500ms of inactivity
      debounceTimeoutRef.current = setTimeout(() => {
        fetchOrders(true, true); // Reset page to 1 for new search/filter, indicate it's debounced
        debounceTimeoutRef.current = null; // Clear ref after execution
      }, 500); // 500ms debounce delay
    }

    // Cleanup function to clear timeout if component unmounts or dependencies change again
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
    // Trigger debounce on changes to search, filter, or dates
  }, [searchQuery, statusFilter, startDate, endDate, fetchOrders]);

  // Handle manual search button click (optional, could be removed)

  const handleClearFilters = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current); // Clear debounce
      debounceTimeoutRef.current = null;
    }
    setSearchQuery("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    // fetchOrders(true) will be called by the useEffect due to state changes
  };

  const updateOrderStatus = async (
    orderId: number,
    newStatus: FulfillmentStatus
  ) => {
    const orderToUpdate = orders.find((o) => o.id === orderId);
    if (!orderToUpdate) {
      toast.error("Error", { description: "Order not found locally." });
      return;
    }
    setUpdateLoading(orderToUpdate.id);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}/status`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update order status (HTTP ${response.status})`
        );
      }

      const updatedData = await response.json();

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success("Success", { description: `Order status updated to ${newStatus}` });
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      });
    } finally {
      setUpdateLoading(null);
    }
  };

  // Pagination controls
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case FULFILLMENT_STATUSES.PROCESSING:
        return "bg-blue-100 text-blue-700";
      case FULFILLMENT_STATUSES.SHIPPED:
        return "bg-yellow-100 text-yellow-700";
      case FULFILLMENT_STATUSES.DELIVERED:
        return "bg-green-100 text-green-700";
      case FULFILLMENT_STATUSES.CANCELLED:
        return "bg-red-100 text-red-700";
      case FULFILLMENT_STATUSES.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case FULFILLMENT_STATUSES.SETTLEMENT:
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="searchQuery"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <Input
                id="searchQuery"
                type="text"
                placeholder="Search by order ID, customer name, or item name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="w-full md:w-[180px]">
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as FulfillmentStatus | "all");
                }}
              >
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(FULFILLMENT_STATUSES).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[180px]">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="w-full md:w-[180px]">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button
              variant="bordered"
              onPress={handleClearFilters}
              className="h-10"
            >
              Clear Filters
            </Button>
          </div>

          {/* Add wrapper for horizontal scroll */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="min-w-[150px]">Recipient</TableHead>
                  <TableHead className="min-w-[200px]">Address</TableHead>
                  <TableHead className="min-w-[150px]">Region</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders
                  .filter(
                    (order) =>
                      statusFilter === "all" || order.status === statusFilter
                  )
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.midtransOrderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.user?.fullName || "Anonymous User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.user?.email || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-sm">
                              {item.name}
                              {item.sizeInfo && (
                                <span> ({item.sizeInfo.size})</span>
                              )}
                              <span className="ml-1">({item.quantity}x)</span>
                              <span className="ml-1 text-muted-foreground">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {`${order.shippingFirstName || ""} ${order.shippingLastName || ""}`.trim() ||
                              order.user?.fullName ||
                              "N/A"}
                          </p>
                          <p className="text-muted-foreground">
                            {order.shippingPhone || "No phone"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {order.shippingAddress || "No address"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {`${order.shippingDistrict || ""}${order.shippingDistrict && order.shippingCity ? ", " : ""}${order.shippingCity || ""}`}
                          </p>
                          <p className="text-muted-foreground">
                            {`${order.shippingProvince || ""}${order.shippingProvince && order.shippingPostalCode ? " " : ""}${order.shippingPostalCode || ""}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{formatCurrency(order.amount)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {[
                            "SETTLEMENT",
                            "PROCESSING",
                            "SHIPPED",
                            "DELIVERED",
                          ].includes(order.status) &&
                            order.midtransInvoicePdfUrl && (
                              <Button
                                variant="bordered"
                                size="sm"
                                onPress={() =>
                                  window.open(
                                    order.midtransInvoicePdfUrl,
                                    "_blank"
                                  )
                                }
                              >
                                PDF
                              </Button>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  FULFILLMENT_STATUSES.PROCESSING
                                )
                              }
                              disabled={
                                order.status ===
                                  FULFILLMENT_STATUSES.PROCESSING ||
                                updateLoading === order.id
                              }
                            >
                              Set as Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  FULFILLMENT_STATUSES.SHIPPED
                                )
                              }
                              disabled={
                                order.status === FULFILLMENT_STATUSES.SHIPPED ||
                                updateLoading === order.id
                              }
                            >
                              Set as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  FULFILLMENT_STATUSES.DELIVERED
                                )
                              }
                              disabled={
                                order.status ===
                                  FULFILLMENT_STATUSES.DELIVERED ||
                                updateLoading === order.id
                              }
                            >
                              Set as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  FULFILLMENT_STATUSES.CANCELLED
                                )
                              }
                              disabled={
                                order.status ===
                                  FULFILLMENT_STATUSES.CANCELLED ||
                                updateLoading === order.id
                              }
                              className="text-red-600"
                            >
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePrevPage}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show current page, first and last pages, and pages around current page
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={handleNextPage}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
