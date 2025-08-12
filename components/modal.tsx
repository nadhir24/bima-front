"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { MailIcon } from "./MailIcon";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { useAuth } from "@/context/AuthContext";
import { title } from "@/components/primitives";
import { Eye, EyeOff } from "lucide-react";

// Custom hook to detect screen size (simple example) - copied from HoverCartModal
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

export default function Modall() {
  const router = useRouter();
  const { user, login, logout, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const {
    isOpen: loginIsOpen,
    onOpen: openLogin,
    onClose: closeLogin,
    onOpenChange,
  } = useDisclosure();

  const {
    isOpen: registerIsOpen,
    onOpen: openRegister,
    onClose: closeRegister,
  } = useDisclosure();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Effect to load remembered email when modal opens
  useEffect(() => {
    if (loginIsOpen) {
      const rememberedEmail = localStorage.getItem("rememberedEmail");
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      } else {
        // Ensure fields are clear if nothing is remembered
        // setEmail(""); // Keep existing email if user typed before opening?
        setRememberMe(false);
      }
    }
  }, [loginIsOpen]); // Rerun when modal open state changes

  const handleLogin = async () => {
    try {
      setIsFormLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Throw error based on backend message if available, otherwise generic message
        throw new Error(
          data?.message || `HTTP error! Status: ${response.status}`
        );
      }

      // ** Stricter Success Check **
      // Check if the necessary data (token, loginData) exists in the response
      if (!data || !data.token || !data.loginData) {
        throw new Error("Login failed: Invalid response from server.");
      }

      // Store token first
      localStorage.setItem("token", data.token);

      // Store user data and update context
      const userData = {
        ...data.loginData,
        token: data.token,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      login(userData);

      toast({
        // Success toast
        title: "Login successful!",
        variant: "default", // Keep success default
      });

      // Remember me logic
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      closeLogin();

      // Don't clear email if remembered, but clear password
      setPassword("");
    } catch (error: any) {
      toast({
        // Failure toast
        title: "Login Gagal",
        // Use the specific error message thrown or a default
        description: "Email atau password yang anda masukan salah.",
        variant: "default", // Use destructive variant for errors
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  // Wrapper function for form submission
  const handleSubmitWrapper = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default page reload on form submission
    if (!isFormLoading) {
      // Prevent submission if already loading
      handleLogin();
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully!",
    });
    router.push("/");
  };

  const handleOpenRegister = () => {
    closeLogin();
    openRegister();
  };

  const handleOpenLogin = () => {
    closeRegister();
    openLogin();
  };

  const handleSignup = async () => {
    setIsFormLoading(true);
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
      // Ensure the number starts with +62 for backend validation
      let formattedPhoneNumber = cleanPhoneNumber;
      if (formattedPhoneNumber.startsWith("62")) {
        formattedPhoneNumber = `+${formattedPhoneNumber}`;
      } else if (!formattedPhoneNumber.startsWith("+62")) {
        // Assuming input is like 08... or 8...
        // Remove leading 0 if present
        if (formattedPhoneNumber.startsWith("0")) {
          formattedPhoneNumber = formattedPhoneNumber.substring(1);
        }
        formattedPhoneNumber = `+62${formattedPhoneNumber}`;
      }

      const createUserDto = {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: formattedPhoneNumber, // Use the +62 format
        password,
      };

      // Basic frontend check for password match
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "default",
        }); // Use default
        setIsFormLoading(false);
        return;
      }

      // If axios.post does not throw, assume success (2xx status)
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
        createUserDto,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      closeRegister();
      openLogin();
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPassword("");
      toast({
        title: "Registrasi berhasil!",
        description: "Silakan login.",
      });
    } catch (error: any) {
      // This block now only catches actual HTTP errors (4xx, 5xx) or network errors
      const errorMessage =
        error.response?.data?.message || error.message || "Registrasi gagal";
      toast({
        title: "Registrasi gagal",
        description: errorMessage,
        variant: "default", // Use default for actual errors
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  // Construct the absolute image URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const imageName = user?.photoProfile?.split("/").pop() || ""; // Get only filename
  const userImageUrl =
    user?.photoProfile && imageName
      ? `${apiBaseUrl}/uploads/users/${imageName}`
      : "/defaultpp.svg"; // Use a local default image

  const isMobile = useMediaQuery("(max-width: 640px)"); // Check for mobile

  return (
    <>
      {isLoggedIn ? (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar src={userImageUrl} size="lg" isBordered />
              <span>{user?.fullName}</span>
            </div>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            {/* Role-based Dashboard Link */}
            {(() => {
              let dashboardHref = "#"; // Default fallback
              let isDashboardDisabled = true;
              let userRole = null;

              if (user && user.roleId && user.roleId.length > 0) {
                userRole = user.roleId[0].roleId; // Assuming roleId is in an array

                // Lihat roleId dan tentukan link yang tepat
                if (userRole === 1) {
                  // Role 1: Admin
                  dashboardHref = "/admin/dashboard";
                  isDashboardDisabled = false;
                } else if (userRole === 3) {
                  // Role 3: Regular User
                  dashboardHref = "/dashboard";
                  isDashboardDisabled = false;
                }
                // Role 2 (Guest) akan disabled
              }

              // Render the item only if the user is logged in
              if (isLoggedIn) {
                return (
                  <DropdownItem
                    key="dashboard"
                    href={isDashboardDisabled ? undefined : dashboardHref}
                    as={isDashboardDisabled ? undefined : Link} // Only use Link if not disabled
                    isDisabled={isDashboardDisabled}
                    aria-disabled={isDashboardDisabled}
                    className={
                      isDashboardDisabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "font-bold"
                    } // Style disabled state
                    textValue="My Dashboard" // Add textValue for accessibility
                  >
                    My Dashboard {isDashboardDisabled ? "(Disabled)" : ""}
                  </DropdownItem>
                );
              }
              return null; // Don't render if not logged in (handled by outer check anyway)
            })()}
            <DropdownItem
              key="logout"
              color="danger"
              onPress={handleLogout}
              textValue="Log Out"
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ) : (
        <Button
          onPress={() => {
            setIsButtonLoading(true);
            setTimeout(() => {
              openLogin();
              setIsButtonLoading(false);
            }, 300);
          }}
          color="default"
          isLoading={isButtonLoading}
          disabled={isButtonLoading}
        >
          Login
        </Button>
      )}
      <Modal
        isOpen={loginIsOpen}
        onClose={closeLogin}
        onOpenChange={onOpenChange}
        placement={isMobile ? "bottom" : "center"}
        backdrop="blur"
        classNames={{
          base: isMobile ? "m-0 rounded-b-none" : "",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h1 className={title({ color: "red", size: "sm" })}>
                  {isLoggedIn ? "Logout" : "Login"}
                </h1>
              </ModalHeader>
              <ModalBody>
                {isLoggedIn ? (
                  <p>Are you sure you want to logout?</p>
                ) : (
                  <div className="relative">
                    {isFormLoading && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center z-10 rounded-lg">
                        <Spinner size="lg" />
                      </div>
                    )}
                    <form onSubmit={handleSubmitWrapper} className="space-y-4">
                      <Input
                        autoFocus
                        label="Email"
                        placeholder="Enter your email"
                        variant="bordered"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isFormLoading}
                        endContent={
                          <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                        }
                        type="email"
                        autoComplete="email"
                      />

                      <Input
                        label="Password"
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        variant="bordered"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isFormLoading}
                        endContent={
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="focus:outline-none"
                          >
                            {showPassword ? (
                              <EyeOff className="text-2xl text-default-400" />
                            ) : (
                              <Eye className="text-2xl text-default-400" />
                            )}
                          </button>
                        }
                        autoComplete="current-password"
                      />

                      <div className="flex py-2 px-1 justify-between">
                        <Checkbox
                          isSelected={rememberMe}
                          onValueChange={setRememberMe}
                          classNames={{ label: "text-small" }}
                          isDisabled={isFormLoading}
                        >
                          Remember me
                        </Checkbox>

                        <button
                          type="button"
                          onClick={handleOpenRegister}
                          disabled={isFormLoading}
                          className={
                            "text-sm text-primary hover:underline " +
                            (isFormLoading ? "text-default-400 cursor-not-allowed" : "cursor-pointer")
                          }
                        >
                          Don&apos;t have an account? Sign up
                        </button>
                      </div>

                      {/* Add a hidden submit button to enable Enter key submission */}
                      <button
                        type="submit"
                        style={{ display: "none" }}
                        aria-hidden="true"
                      />
                    </form>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={closeLogin}
                  isDisabled={isFormLoading}
                >
                  Close
                </Button>
                {/* This button remains outside the form, triggers login on click */}
                <Button
                  color="primary"
                  onPress={isLoggedIn ? handleLogout : handleLogin}
                  isDisabled={isFormLoading}
                >
                  {isLoggedIn ? "Logout" : "Login"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={registerIsOpen}
        onClose={closeRegister}
        placement="top-center"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Register
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  variant="bordered"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isFormLoading}
                />
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  variant="bordered"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isFormLoading}
                />
                <div className="flex items-center">
                  <span className="px-2 py-2 bg-gray-200 rounded-l-md border border-gray-300 text-gray-700">
                    +62
                  </span>

                  <Input
                    placeholder="8xxxxxxxxxx"
                    variant="bordered"
                    value={phoneNumber}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/[^0-9]/g, "");
                      setPhoneNumber(inputValue);
                    }}
                    disabled={isFormLoading}
                  />
                </div>
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  variant="bordered"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isFormLoading}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="text-2xl text-default-400" />
                      ) : (
                        <Eye className="text-2xl text-default-400" />
                      )}
                    </button>
                  }
                />

                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  variant="bordered"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isFormLoading}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="text-2xl text-default-400" />
                      ) : (
                        <Eye className="text-2xl text-default-400" />
                      )}
                    </button>
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Link
                  color="primary"
                  onPress={handleOpenLogin}
                  size="sm"
                  className={
                    isFormLoading ? "pointer-events-none text-default-400" : ""
                  }
                >
                  Already have an account? Login
                </Link>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={closeRegister}
                  isDisabled={isFormLoading}
                >
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={handleSignup}
                  isDisabled={isFormLoading}
                  isLoading={isFormLoading}
                >
                  Sign up
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
