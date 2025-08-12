"use client";
import React from "react";
import { Button as NextUIButton } from "@heroui/button";

interface TombolProps {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  fullWidth?: boolean;
  isIconOnly?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  label?: string;
  onPress?: (e: any) => void;
}

const Tombol: React.FC<TombolProps> = ({ label, children, ...rest }) => {
  return (
    <NextUIButton {...rest}>
      {label || children || "Tombol"}
    </NextUIButton>
  );
};

export default Tombol;
