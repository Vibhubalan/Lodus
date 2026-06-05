"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Heart, Trash2, Edit, ShoppingBag, Eye, LayoutDashboard } from "lucide-react";
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";

interface MyListing {
  id: number;
  title: string;
  price: number;
  categoryName: string;
  imageUrl: string | null;
}

interface FavoriteListing {
  id: number;
  title: string;
  price: number;
  categoryName: string;
  imageUrl: string | null;
  sellerName: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  reviewerAvatar: string | null;
  createdAt: Date;
}

interface MarketplaceDashboardClientProps {
  myListings: MyListing[];
  favorites: FavoriteListing[];
  reviews: Review[];
  averageRating: number;
}

type TabName = "listings" | "favorites" | "reviews";

export function MarketplaceDashboardClient({
  myListings,
  favorites,
  reviews,
  averageRating,
}: MarketplaceDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabName>("listings");
  const [localListings, setLocalListings] = useState<MyListing[]>(myListings);

  const handleDeleteListing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLocalListings((prev) => prev.filter((l) => l.id !== id));
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete listing.");
      }
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  const renderStars = (score: number) => {
    const starArr = [];
    for (let i = 1; i <= 5; i++) {
      starArr.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= Math.round(score)
              ? "fill-accent-warm text-accent-warm"
              : "text-on-surface-variant/20"
          }`}
        />
      );
    }
    return starArr;
  };

  return (
    <div className="space-y-6">
      {/* Back and title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant pb-6">
        <div className="space-y-1">
          <Link
            href="/marketplace"
            className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Back to Marketplace
          </Link>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-on-surface mt-2 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            Marketplace Dashboard
          </h1>
        </div>

        <div>
          <Link
            href="/marketplace/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            Create Listing
          </Link>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant/60">
        <button
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-widest relative ${
            activeTab === "listings" ? "text-on-surface" : "text-on-surface-variant/50 hover:text-on-surface"
          }`}
        >
          My Listings ({localListings.length})
          {activeTab === "listings" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-widest relative ${
            activeTab === "favorites" ? "text-on-surface" : "text-on-surface-variant/50 hover:text-on-surface"
          }`}
        >
          Favorites ({favorites.length})
          {activeTab === "favorites" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-widest relative ${
            activeTab === "reviews" ? "text-on-surface" : "text-on-surface-variant/50 hover:text-on-surface"
          }`}
        >
          My Seller Reviews ({reviews.length})
          {activeTab === "reviews" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            {localListings.length === 0 ? (
              <div className="glass-card text-center p-12 rounded-xl">
                <ShoppingBag className="h-10 w-10 text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-sm font-bold text-on-surface">No active listings</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">
                  You haven't listed any items for sale yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {localListings.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card rounded-xl overflow-hidden flex flex-col justify-between border border-outline-variant h-full"
                  >
                    <div className="relative aspect-video w-full bg-white/5">
                      {item.imageUrl ? (
                        <SafeDisplayImage src={item.imageUrl} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                          <ShoppingBag className="h-8 w-8 text-on-surface-variant/20" />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-primary">
                        ₹{item.price}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-primary/80 block">
                          {item.categoryName}
                        </span>
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1">
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-outline-variant/30">
                        <Link
                          href={`/marketplace/${item.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-white/5 border border-outline-variant py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface hover:bg-white/10"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
                        <Link
                          href={`/marketplace/${item.id}/edit`}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-white/5 border border-outline-variant py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface hover:bg-white/10"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteListing(item.id)}
                          className="inline-flex items-center justify-center rounded bg-primary/10 border border-primary/20 p-1.5 text-primary hover:bg-primary/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div className="space-y-4">
            {favorites.length === 0 ? (
              <div className="glass-card text-center p-12 rounded-xl">
                <Heart className="h-10 w-10 text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-sm font-bold text-on-surface">No favorites yet</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">
                  Browse the marketplace and favorite items you're interested in!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {favorites.map((item) => (
                  <Link
                    key={item.id}
                    href={`/marketplace/${item.id}`}
                    className="glass-card rounded-xl overflow-hidden flex flex-col justify-between border border-outline-variant h-full hover:border-primary/20 group"
                  >
                    <div className="relative aspect-video w-full bg-white/5">
                      {item.imageUrl ? (
                        <SafeDisplayImage src={item.imageUrl} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                          <ShoppingBag className="h-8 w-8 text-on-surface-variant/20" />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-primary">
                        ₹{item.price}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-primary/80 block">
                          {item.categoryName}
                        </span>
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>

                      <div className="text-[10px] text-on-surface-variant/70 pt-2 border-t border-outline-variant/30">
                        Seller: {item.sellerName}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Average Seller Rating Summary */}
            <div className="glass-card border border-outline-variant rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 max-w-md">
              <div className="text-center">
                <span className="text-5xl font-black text-primary">{averageRating || "—"}</span>
                <span className="text-xs text-on-surface-variant/60 block mt-1">Average Score</span>
              </div>
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex justify-center sm:justify-start gap-1">
                  {renderStars(averageRating)}
                </div>
                <p className="text-xs text-on-surface-variant/80">
                  Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""} left by other users in the Lodus portal.
                </p>
              </div>
            </div>

            {/* List of reviews */}
            {reviews.length === 0 ? (
              <div className="glass-card text-center p-10 rounded-xl">
                <p className="text-xs text-on-surface-variant/60">
                  You haven't received any reviews as a seller yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="glass-card p-4 rounded-xl space-y-2 border border-outline-variant/40 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rev.reviewerAvatar ? (
                          <img
                            src={rev.reviewerAvatar}
                            alt={rev.reviewerName}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                            {rev.reviewerName[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-on-surface">{rev.reviewerName}</span>
                      </div>

                      <div className="flex gap-0.5">
                        {renderStars(rev.rating)}
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-on-surface-variant/90 leading-relaxed pl-1">
                        {rev.comment}
                      </p>
                    )}

                    <div className="text-[9px] text-on-surface-variant/40 text-right">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
