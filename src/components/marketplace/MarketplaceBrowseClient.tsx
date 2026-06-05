"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingBag, Plus, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";
import type { MarketplaceCategory } from "@/lib/db/schema";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
  categoryName: string;
  categorySlug: string;
  sellerName: string | null;
  sellerEmail: string;
  sellerAvatar: string | null;
  imageUrl: string | null;
}

interface MarketplaceBrowseClientProps {
  listings: Listing[];
  categories: MarketplaceCategory[];
  isLoggedIn: boolean;
}

export function MarketplaceBrowseClient({
  listings,
  categories,
  isLoggedIn,
}: MarketplaceBrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchVal });
  };

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    startTransition(() => {
      router.push(`/marketplace?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header section with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-on-surface sm:text-4xl">
            Community Marketplace
          </h1>
          <p className="text-sm text-on-surface-variant/70 mt-1">
            Browse goods, services, and gear listed by the Lodus community.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/marketplace/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface transition-all duration-300 hover:bg-white/10"
              >
                <LayoutDashboard className="h-4 w-4" />
                My Dashboard
              </Link>
              <Link
                href="/marketplace/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Create Listing
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary shadow-md transition-all duration-300 hover:brightness-110"
            >
              Sign In to Sell
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            placeholder="Search listings by title or description..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant/50" />
          {searchVal && (
            <button
              type="button"
              onClick={() => {
                setSearchVal("");
                updateQuery({ search: null });
              }}
              className="absolute right-3 top-2.5 text-xs font-bold text-on-surface-variant/60 hover:text-on-surface"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-outline-variant rounded-lg px-3 py-2 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-on-surface-variant" />
            <span className="font-bold text-on-surface-variant uppercase tracking-wider">Sort:</span>
            <select
              value={currentSort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="bg-transparent border-0 text-on-surface focus:ring-0 p-0 text-xs font-bold cursor-pointer"
              style={{ border: "none", outline: "none", boxShadow: "none", backgroundColor: "transparent" }}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Browse Layout */}
      <div className="grid gap-8 lg:grid-cols-[200px_1fr] items-start">
        {/* Sidebar categories */}
        <aside className="space-y-4">
          <div className="border-b border-outline-variant pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Categories
            </h3>
          </div>
          <nav className="flex flex-row overflow-x-auto gap-2 scrollbar-none pb-2 lg:flex-col lg:pb-0 lg:overflow-x-visible">
            <button
              onClick={() => updateQuery({ category: null })}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
                currentCategory === ""
                  ? "bg-primary text-on-primary font-bold"
                  : "bg-white/5 text-on-surface-variant/80 hover:bg-white/10 hover:text-on-surface"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateQuery({ category: cat.slug })}
                className={`shrink-0 rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
                  currentCategory === cat.slug
                    ? "bg-primary text-on-primary font-bold"
                    : "bg-white/5 text-on-surface-variant/80 hover:bg-white/10 hover:text-on-surface"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Listings Grid */}
        <main className={`flex-1 transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
          {listings.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center text-center p-12 rounded-xl min-h-[300px]">
              <ShoppingBag className="h-12 w-12 text-on-surface-variant/20 mb-4" />
              <p className="text-base font-bold text-on-surface">No listings found</p>
              <p className="text-sm text-on-surface-variant/60 mt-1 max-w-sm">
                Try adjusting your search query, selecting another category, or list a new item!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className="glass-card group overflow-hidden rounded-xl flex flex-col h-full hover:border-primary/30"
                >
                  <div className="relative aspect-video w-full bg-white/5">
                    {item.imageUrl ? (
                      <SafeDisplayImage
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                        <ShoppingBag className="h-10 w-10 text-on-surface-variant/20" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-primary shadow-sm">
                      ₹{item.price}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-4 justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                        {item.categoryName}
                      </span>
                      <h3 className="font-bold text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant/70 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/30">
                      {item.sellerAvatar ? (
                        <img
                          src={item.sellerAvatar}
                          alt={item.sellerName ?? "Seller"}
                          className="h-6 w-6 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                          {(item.sellerName ?? item.sellerEmail)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-on-surface-variant">
                        Seller: {item.sellerName ?? item.sellerEmail.split("@")[0]}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
