"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function MarketplaceCartButton() {
  const [count, setCount] = useState(0);

  const fetchCartCount = async () => {
    try {
      const res = await fetch("/api/marketplace/cart");
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setCount(data.items.length);
        }
      }
    } catch (err) {
      console.error("Failed to fetch cart count for button:", err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCartCount();

    // Listen for custom event triggers
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  return (
    <Link
      href="/marketplace/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container-high/80 text-on-surface-variant transition-all duration-200 hover:border-primary/40 hover:bg-surface-container-highest hover:text-primary"
      aria-label="View shopping cart"
    >
      <ShoppingBag className="h-4.5 w-4.5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-on-primary shadow-sm animate-bounce-short">
          {count}
        </span>
      )}
    </Link>
  );
}
