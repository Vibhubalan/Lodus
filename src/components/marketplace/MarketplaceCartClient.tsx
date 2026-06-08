"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowLeft, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";

interface CartItem {
  cartItemId: number;
  listingId: number;
  title: string;
  price: number;
  description: string;
  status: string;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  imageUrl: string | null;
}

export function MarketplaceCartClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "review" | "success">("cart");

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setError("Failed to load cart items.");
      }
    } catch (err) {
      setError("Failed to load cart items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const removeItem = async (listingId: number) => {
    try {
      const res = await fetch(`/api/marketplace/cart?listingId=${listingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.listingId !== listingId));
        // Sync navbar count
        window.dispatchEvent(new CustomEvent("cart-updated"));
      } else {
        alert("Failed to remove item.");
      }
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch("/api/marketplace/cart?all=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setItems([]);
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  // Group items by seller for review and mail checkout
  const groupedBySeller = items.reduce((acc, item) => {
    if (!acc[item.sellerEmail]) {
      acc[item.sellerEmail] = {
        name: item.sellerName,
        email: item.sellerEmail,
        items: [],
      };
    }
    acc[item.sellerEmail].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; email: string; items: CartItem[] }>);

  const handleCheckoutComplete = async () => {
    await clearCart();
    setCheckoutStep("success");
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="text-xs uppercase tracking-widest text-on-surface-variant/70 animate-pulse">
          Loading Shopping Cart...
        </div>
      </div>
    );
  }

  if (checkoutStep === "success") {
    return (
      <div className="glass-card max-w-md mx-auto p-8 rounded-xl border border-outline-variant text-center space-y-5 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-on-surface">
            Order Submitted!
          </h1>
          <p className="text-xs text-on-surface-variant/85 leading-relaxed">
            Your cart has been cleared. Please follow up with the sellers directly via email or Discord to arrange payment and coordinates.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/marketplace"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-3 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 shadow-md transition-all"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (checkoutStep === "review") {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setCheckoutStep("cart")}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>
        </div>

        <div className="glass-card p-6 rounded-xl border border-outline-variant space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-wide text-on-surface">
              Order Review
            </h1>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Since online checkout is peer-to-peer, you will need to contact the sellers to complete your purchase.
            </p>
          </div>

          <div className="space-y-5">
            {Object.values(groupedBySeller).map((seller) => {
              const mailBody = `Hi ${seller.name},\n\nI'm interested in purchasing the following item(s) from your Lodus Marketplace listings:\n\n${seller.items.map((i) => `- ${i.title} (₹${i.price})`).join("\n")}\n\nPlease let me know how you'd like to arrange payment and handoff.\n\nThanks!`;
              const mailToUrl = `mailto:${seller.email}?subject=${encodeURIComponent("Inquiry regarding Lodus Listing(s)")}&body=${encodeURIComponent(mailBody)}`;

              return (
                <div key={seller.email} className="p-4 rounded-lg bg-white/5 border border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Seller: {seller.name}
                    </span>
                    <a
                      href={mailToUrl}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-all"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email Seller
                    </a>
                  </div>

                  <div className="space-y-2">
                    {seller.items.map((item) => (
                      <div key={item.listingId} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant">{item.title}</span>
                        <span className="font-bold text-on-surface">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-outline-variant/50 pt-4 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Total Price:
            </span>
            <span className="text-2xl font-black text-primary">₹{subtotal}</span>
          </div>

          <button
            onClick={handleCheckoutComplete}
            className="w-full rounded-lg bg-primary py-3.5 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 transition-all shadow-md text-center"
          >
            Complete Order & Clear Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      <div className="glass-card p-6 rounded-xl border border-outline-variant space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-on-surface">
            Shopping Cart
          </h1>
          <p className="text-xs text-on-surface-variant/70 mt-1">
            Manage your items before coordinating purchases with the sellers.
          </p>
        </div>

        {error && <p className="text-xs text-primary font-bold">{error}</p>}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-on-surface-variant/20 mb-3" />
            <span className="text-sm font-bold text-on-surface">Your cart is empty</span>
            <span className="text-xs text-on-surface-variant/50 mt-1">
              Add products or services from the marketplace to check them out.
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items List */}
            <div className="divide-y divide-outline-variant/40">
              {items.map((item) => (
                <div key={item.listingId} className="flex py-4 gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-outline-variant bg-white/5 shrink-0">
                      {item.imageUrl ? (
                        <SafeDisplayImage src={item.imageUrl} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                          <ShoppingBag className="h-6 w-6 text-on-surface-variant/20" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface leading-snug line-clamp-1">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-primary uppercase font-bold tracking-wider mt-0.5 block">
                        Seller: {item.sellerName}
                      </span>
                      {item.status === "sold" && (
                        <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-widest text-primary border border-primary/20 bg-primary/10 rounded px-1">
                          Sold Out
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm text-on-surface shrink-0">₹{item.price}</span>
                    <button
                      onClick={() => removeItem(item.listingId)}
                      className="p-2 text-on-surface-variant/50 hover:text-primary transition-colors rounded-lg"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Checkout */}
            <div className="border-t border-outline-variant/50 pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-widest block">
                  Subtotal
                </span>
                <span className="text-2xl font-black text-primary">₹{subtotal}</span>
              </div>

              <button
                onClick={() => setCheckoutStep("review")}
                className="w-full sm:w-auto rounded-lg bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 transition-all shadow-md text-center"
              >
                Checkout (Contact Sellers)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
