"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAppStore } from "@/lib/store";

type PurchaseContextType = {
  hasPurchased: boolean;
  isChecking: boolean;
  isPaid: boolean;
};

const PurchaseContext = createContext<PurchaseContextType>({
  hasPurchased: true,
  isChecking: false,
  isPaid: false,
});

export const usePurchaseStatus = () => useContext(PurchaseContext);

type ExploreTripContentProps = {
  tripId: string;
  isPaid: boolean;
  children: ReactNode;
};

export default function ExploreTripContent({ tripId, isPaid, children }: ExploreTripContentProps) {
  const { firebaseUser } = useAppStore();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPurchase = async () => {
      // For explore page, paid trips are always masked (never show full content)
      // So we always set hasPurchased to false for paid trips
      if (!isPaid || !firebaseUser) {
        setHasPurchased(true); // Free trips or not logged in - show content
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      // Always mask paid trips on explore page
      setHasPurchased(false);
      setIsChecking(false);
    };

    checkPurchase();
  }, [tripId, isPaid, firebaseUser]);

  return (
    <PurchaseContext.Provider value={{ hasPurchased, isChecking, isPaid }}>
      {children}
    </PurchaseContext.Provider>
  );
}

