"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";

export interface MarketplaceListingPreview {
  id: number;
  title: string;
  price: number;
  categoryName: string;
  sellerName: string;
  sellerAvatar: string | null;
  imageUrl: string | null;
}

interface ServicesSectionProps {
  recentListings: MarketplaceListingPreview[];
}

export function ServicesSection({ recentListings }: ServicesSectionProps) {
  return (
    <section id="services" className="scroll-mt-6 space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold uppercase tracking-wide text-on-surface sm:text-4xl">
          Our Services
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-on-surface-variant/70">
          Tools, services, and gear powered by the Lodus community.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr] items-start">
        {/* Marketplace CMS Highlight Card */}
        <div className="glass-card flex flex-col justify-between p-6 h-full min-h-[320px] rounded-xl">
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface">
              Community Marketplace
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant/80">
              Browse, buy, and sell gaming gear, developer services, coaching sessions, and custom merchandise. Keep it in the group or find deals from friends.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              Browse Marketplace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Live/Recent listings preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Recently Listed Items
            </span>
            <Link
              href="/marketplace"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-xl min-h-[220px]">
              <p className="text-sm text-on-surface-variant/60">
                No items listed at the moment.
              </p>
              <p className="text-xs text-on-surface-variant/40 mt-1">
                Be the first to list an item by signing in!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="glass-card group overflow-hidden rounded-xl flex flex-col h-full hover:border-primary/30"
                >
                  <div className="relative aspect-video w-full bg-white/5">
                    {listing.imageUrl ? (
                      <SafeDisplayImage
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                        <ShoppingBag className="h-8 w-8 text-on-surface-variant/20" />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-primary">
                      ₹{listing.price}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-3.5 justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                        {listing.categoryName}
                      </span>
                      <h4 className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
                      {listing.sellerAvatar ? (
                        <img
                          src={listing.sellerAvatar}
                          alt={listing.sellerName}
                          className="h-5 w-5 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                          {listing.sellerName[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] text-on-surface-variant">
                        Seller: {listing.sellerName}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
