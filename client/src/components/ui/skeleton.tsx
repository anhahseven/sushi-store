import React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Base Shimmer Overlay CSS
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/10 before:to-transparent";

export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${shimmerClass} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ count?: number; heightClass?: string }> = ({
  count = 1,
  heightClass = "h-64 lg:h-[450px]"
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full rounded-2xl lg:rounded-[2.5rem] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 lg:p-6 flex flex-col justify-end gap-3 ${heightClass} ${shimmerClass}`}
        >
          {/* Top category label placeholder */}
          <SkeletonPulse className="w-1/3 h-4 rounded-full" />
          
          {/* Title placeholder */}
          <SkeletonPulse className="w-3/4 h-8 rounded-lg" />
          
          {/* Description placeholder */}
          <div className="hidden lg:flex flex-col gap-2">
            <SkeletonPulse className="w-full h-4 rounded" />
            <SkeletonPulse className="w-5/6 h-4 rounded" />
          </div>

          {/* Footer controls placeholder */}
          <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <SkeletonPulse className="w-10 h-3 rounded" />
              <SkeletonPulse className="w-20 h-6 rounded" />
            </div>
            <SkeletonPulse className="w-8 h-8 lg:w-16 lg:h-16 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
};

export const CategorySkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="flex flex-nowrap gap-3 justify-start md:justify-center px-4 py-2">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonPulse
          key={idx}
          className="w-24 h-10 sm:w-28 sm:h-11 md:w-32 md:h-12 rounded-full flex-shrink-0"
        />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 7
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-gray-100 dark:border-gray-700">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-5">
              {cIdx === cols - 1 ? (
                <div className="flex justify-end">
                  <SkeletonPulse className="w-24 h-8 rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <SkeletonPulse
                    className={`${
                      cIdx === 0 ? "w-12" : cIdx === 4 ? "w-16 font-bold" : "w-32"
                    } h-5 rounded`}
                  />
                  {cIdx === 1 && <SkeletonPulse className="w-16 h-3 rounded" />}
                </div>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const OfferBannerSkeleton: React.FC = () => {
  return (
    <div className={`relative w-full h-64 md:h-80 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center px-8 md:px-16 ${shimmerClass}`}>
      <div className="flex flex-col gap-4 max-w-lg w-full">
        <SkeletonPulse className="w-3/4 h-10 rounded-lg" />
        <SkeletonPulse className="w-full h-4 rounded" />
        <SkeletonPulse className="w-5/6 h-4 rounded" />
        <SkeletonPulse className="w-32 h-12 rounded-full mt-2" />
      </div>
    </div>
  );
};

export { Skeleton }
