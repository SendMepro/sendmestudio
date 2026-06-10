"use client";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
};

export default function Skeleton({
  width = "100%",
  height = "10px",
  borderRadius = "6px",
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(110deg, rgba(200, 190, 220, 0.20) 30%, rgba(220, 210, 245, 0.40) 50%, rgba(200, 190, 220, 0.20) 70%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
