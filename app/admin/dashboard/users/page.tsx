"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

interface User {
  id: number;
  email: string;
  fullName: string;
  photoProfile: string | null;
  userRoles: Array<{ userId: number; roleId: number }>;
  createdAt: string;
  roleName: string;
  roleId?: number;
}

const ROLES = {
  ADMIN: { id: 1, name: "Admin" },
  GUEST: { id: 2, name: "Guest" },
  USER: { id: 3, name: "User" },
} as const;

export default function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async (page: number, search: string = "") => {
    try {
      setIsLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      // Only add search param if it's not empty
      if (search.trim()) {
        params.append("search", search.trim());
      }

      // Get the token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Log the API URL being used
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users?${params.toString()}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Modify these options for better compatibility
        mode: "cors",
        credentials: "same-origin",
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch users";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          try {
            errorMessage = (await response.text()) || errorMessage;
          } catch (textError) {
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      let usersArray;
      let paginationData;

      if (Array.isArray(data)) {
        // Handle array response
        usersArray = data;
        paginationData = {
          totalItems: data.length,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: data.length,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      } else if (data && data.users && Array.isArray(data.users)) {
        // Handle object with users array and pagination
        usersArray = data.users;
        paginationData = data.pagination || {
          totalItems: data.users.length,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: data.users.length,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      } else {
        throw new Error("Invalid data format received from API");
      }

      // Map the data to match our interface
      const formattedUsers = usersArray.map((user: any) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        photoProfile: user.photoProfile || null,
        userRoles: user.userRoles || [],
        createdAt: user.createdAt,
        roleName: user.roleName || "No Role",
        roleId: user.roleId,
      }));

      setUsers(formattedUsers);
      setTotalPages(paginationData.totalPages);
      setCurrentPage(paginationData.currentPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users data");
      setUsers([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Debounce search with minimum length
  useEffect(() => {
    if (searchQuery.length === 0 || searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchUsers(1, searchQuery);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, fetchUsers]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle page changes
  useEffect(() => {
    if (searchQuery === "") {
      fetchUsers(currentPage);
    } else {
      fetchUsers(currentPage, searchQuery);
    }
  }, [currentPage, searchQuery, fetchUsers]);

  // Add function to get current user's ID
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<{ id: number }>(token);
        setCurrentUserId(decoded.id);
      } catch (error) {
        // Error handling without console.log
      }
    }
  }, []);

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    const promise = async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user-role/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            newRoleId: newRoleId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      // Parse response to get new token
      const responseData = await response.json();

      // Update token in localStorage if it's the current user
      const isChangingOwnRole = userId === currentUserId;
      if (isChangingOwnRole && responseData.token) {
        localStorage.setItem("token", responseData.token);

        // Also update user object if needed
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          try {
            const userObj = JSON.parse(currentUser);
            userObj.roleId = [{ userId: userId, roleId: newRoleId }];
            localStorage.setItem("user", JSON.stringify(userObj));
          } catch (e) {
            // Error handling without console.log
          }
        }
      }

      toast.success(`Role updated to ${newRoleId === 1 ? "Admin" : "User"}`);
    };

    toast.promise(promise(), {
      loading: "Updating role...",
      error: (err) => err.message,
    });
  };

  const handleDeleteUser = (user: User) => {
    const promise = async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/delete/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete user' }));
        throw new Error(errorData.message);
      }
    };

    toast.error(`Are you sure you want to delete ${user.fullName}?`, {
      action: {
        label: "Delete",
        onClick: () => {
          toast.promise(promise(), {
            loading: `Deleting ${user.fullName}...`,
            success: (data) => {
              fetchUsers(currentPage, searchQuery);
              return "User deleted successfully!";
            },
            error: (err) => err.message,
          });
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      No users found
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={
                          user.photoProfile
                            ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/users/${user.photoProfile}`
                            : undefined
                        }
                        alt={user.fullName}
                      />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {user.fullName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={String(user.userRoles[0]?.roleId || "")}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role">
                          {user.roleName === "admin" ? "Admin" : "User"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(ROLES.USER.id)}>
                          User
                        </SelectItem>
                        <SelectItem value={String(ROLES.ADMIN.id)}>
                          Admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
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
                          onSelect={(e) => e.preventDefault()}
                          className="p-0"
                        >
                          <Select
                            value={String(user.userRoles[0]?.roleId || "")}
                            onValueChange={(value) =>
                              handleRoleChange(user.id, parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select role">
                                {user.roleName === "admin" ? "Admin" : "User"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={String(ROLES.USER.id)}>
                                User
                              </SelectItem>
                              <SelectItem value={String(ROLES.ADMIN.id)}>
                                Admin
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center mt-4 gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Previous
        </Button>
        <span className="flex items-center">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages || isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Next
        </Button>
      </div>
    </div>
  );
}
