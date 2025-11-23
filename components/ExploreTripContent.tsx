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
      if (!isPaid || !firebaseUser) {
        setHasPurchased(true); // Free trips or not logged in - show content
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/public_trips/purchases', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setHasPurchased(data.trip_ids?.includes(tripId) ?? false);
        } else {
          setHasPurchased(false);
        }
      } catch (e) {
        console.error('Failed to check purchase status:', e);
        setHasPurchased(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPurchase();
  }, [tripId, isPaid, firebaseUser]);

  return (
    <PurchaseContext.Provider value={{ hasPurchased, isChecking, isPaid }}>
      {children}
    </PurchaseContext.Provider>
  );
}

