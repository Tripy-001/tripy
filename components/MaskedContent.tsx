"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { usePurchaseStatus } from "./ExploreTripContent";

type MaskedContentProps = {
  children: ReactNode;
  previewText?: string;
};

export default function MaskedContent({ children, previewText }: MaskedContentProps) {
  const { hasPurchased, isChecking, isPaid } = usePurchaseStatus();
  
  // Show content if checking, free trip, or purchased
  if (isChecking || !isPaid || hasPurchased) {
    return <>{children}</>;
  }

  // Mask content for unpaid trips
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm opacity-50 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
        <div className="text-center p-6">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">
            {previewText || "Purchase this trip to unlock full content"}
          </p>
        </div>
      </div>
    </div>
  );
}

