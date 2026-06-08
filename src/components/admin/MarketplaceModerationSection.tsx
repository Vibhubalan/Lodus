"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, ShoppingBag, ShieldAlert } from "lucide-react";

interface ListingRow {
  id: number;
  title: string;
  price: number;
  status: string;
  createdAt: Date;
  categoryName: string;
  sellerName: string | null;
  sellerEmail: string;
}

interface MarketplaceModerationSectionProps {
  listings: ListingRow[];
}

export function MarketplaceModerationSection({
  listings: initialListings,
}: MarketplaceModerationSectionProps) {
  const router = useRouter();
  const [listings, setListings] = useState<ListingRow[]>(initialListings);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm("Are you sure you want to permanently delete this listing as an administrator?")) {
      return;
    }

    setDeletingId(listingId);
    try {
      const res = await fetch(`/api/marketplace/${listingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setListings((prev) => prev.filter((item) => item.id !== listingId));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete listing.");
      }
    } catch (err) {
      alert("Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-extrabold uppercase tracking-wider text-on-surface">
            Marketplace Moderation
          </h2>
        </div>
        <p className="text-xs text-on-surface-variant/70">
          Review, flag, and remove listings posted by community members. Deleted items are permanently removed.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center rounded-xl min-h-[200px]">
          <ShoppingBag className="h-10 w-10 text-on-surface-variant/20 mb-3" />
          <span className="text-sm font-bold text-on-surface">No marketplace listings</span>
          <span className="text-xs text-on-surface-variant/50 mt-1">
            There are currently no active or sold listings on the platform.
          </span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-xl border border-outline-variant/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-white/5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/85">
                  <th className="p-4">Listing</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Seller</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Posted</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-xs">
                {listings.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/2 transition-colors duration-150"
                  >
                    <td className="p-4">
                      <div className="font-bold text-on-surface hover:text-primary transition-colors">
                        <a href={`/marketplace/${item.id}`} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                      </div>
                      <div className="text-[10px] text-on-surface-variant/50 mt-0.5">ID: #{item.id}</div>
                    </td>
                    <td className="p-4 uppercase tracking-wider font-semibold text-primary/80">
                      {item.categoryName}
                    </td>
                    <td className="p-4 font-bold text-on-surface">₹{item.price}</td>
                    <td className="p-4">
                      <div className="font-bold">{item.sellerName ?? item.sellerEmail.split("@")[0]}</div>
                      <div className="text-[10px] text-on-surface-variant/60 select-all">{item.sellerEmail}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
                          item.status === "sold"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : item.status === "inactive"
                              ? "bg-white/5 text-on-surface-variant/60 border border-outline-variant"
                              : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        disabled={deletingId === item.id}
                        className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Delete listing permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
