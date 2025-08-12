import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion"; // Import necessary hooks
import { Card as NextUICard, CardHeader, CardBody } from "@heroui/card";
import type { StaticImageData } from "next/image";
import { Image } from "@heroui/image";
import { Divider } from "@heroui/divider";
import { title, subtitle } from "@/components/primitives";

interface KartuProps {
  logoSrc: string | StaticImageData;
  title: string;
  subTitle: string;
  description: string;
  fullWidth?: boolean;
  textAlign?: "justify" | "left" | "right" | "center";
  logoClassName?: string;
  height?: number;
  width?: number;
  imageRadius?: "none" | "sm" | "md" | "lg" | "full";
  titleColor?: keyof typeof title.variants.color;
  titleSize?: keyof typeof title.variants.size;
}

const Kartu: React.FC<KartuProps> = ({
  logoSrc,
  title: titleText,
  subTitle,
  description,
  fullWidth = false,
  textAlign = "left",
  logoClassName = "",
  height = 40,
  width = 40,
  imageRadius = "none",
  titleColor = "blue",
  titleSize = "md",
}) => {
  const textAlignClass = `text-${textAlign}`;
  const [isZoomed, setIsZoomed] = useState(false);

  const { scrollY } = useScroll(); // Get scroll position
  const scale = useTransform(scrollY, [0, 300], [1, 1.05]); // Scale based on scroll

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const imageSrc = typeof logoSrc === "string" ? logoSrc : logoSrc?.src || "";

  return (
    <motion.div style={{ scale }} className={`transition-all duration-300`}>
      <NextUICard
        className={`max-w-[400px] ${
          fullWidth ? "w-full" : ""
        } overflow-hidden animate-scaleBounce`} // Add animation class here
        style={{
          animationDuration: "2s",
          animationTimingFunction: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
        }} // Bounce effect>
      >
        <CardHeader className="flex gap-3">
          <motion.div
            className={`relative ${logoClassName} overflow-hidden ${radiusClasses[imageRadius]}`}
            style={{ height, width, minWidth: width }}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            initial={{ scale: 1 }} // Initial scale
            animate={{ scale: isZoomed ? 1.1 : 1 }} // Animate scale on hover
            transition={{ duration: 0.3 }} // Transition duration
          >
            <Image
              alt={titleText} // Use titleText as alt for accessibility
              src={imageSrc}
              width={width}
              height={height}
              className={`transition-transform duration-75 absolute`} // Remove zoom scaling here
            />
          </motion.div>
          <div className="flex flex-col">
            <motion.div
              className={title({
                color: titleColor,
                size: titleSize,
                fullWidth,
              })}
              initial={{ opacity: 0, y: -10 }} // Fade in from above
              animate={{ opacity: 1, y: 0 }} // Animate to normal position
              transition={{ duration: 0.3 }}
            >
              {titleText}
            </motion.div>
            <motion.div
              className={subtitle()}
              initial={{ opacity: 0, y: -10 }} // Fade in from above
              animate={{ opacity: 1, y: 0 }} // Animate to normal position
              transition={{ duration: 0.3, delay: 0.1 }} // Slight delay for subtitle
            >
              {subTitle}
            </motion.div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className={textAlignClass}>
          <motion.div
            className="text-black-500 capitalize font-semibold tracking-tight"
            initial={{ opacity: 0 }} // Fade in
            animate={{ opacity: 1 }} // Animate to visible
            transition={{ duration: 0.3, delay: 0.2 }} // Delay for description
          >
            {description}
          </motion.div>
        </CardBody>
        <Divider />
      </NextUICard>
    </motion.div>
  );
};

export default Kartu;
