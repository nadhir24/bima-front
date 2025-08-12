// dynamic-image.tsx
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface DynamicImageProps {
  url: string;
  alt: string;
  containerClass?: string;
  width?: number;
  height?: number;
}

const DynamicImage: React.FC<DynamicImageProps> = ({
  url,
  alt,
  containerClass,
  width = 500,
  height = 300,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (url) {
      const loadImage = async () => {
        try {
          // Simulating image loading, replace this with actual image processing if needed
          setImageSrc(url);
          setHasError(false);
        } catch (error) {
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };
      loadImage();
    }
  }, [url]);

  if (isLoading) {
    return <p>Loading image...</p>; // You can replace this with a loading spinner if desired
  }

  if (hasError) {
    return <p>Error loading image.</p>;
  }

  return (
    <div className={`relative ${containerClass}`} style={{ width: '100%', height: 'auto' }}>
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          style={{ 
            objectFit: "cover",
            width: "100%",
            height: "auto"
          }}
          priority={false}
          unoptimized={false}
        />
      )}
    </div>
  );
};

export default DynamicImage;
