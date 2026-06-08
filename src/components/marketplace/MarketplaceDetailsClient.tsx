"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Heart, Trash2, Edit, ArrowLeft, ShoppingBag } from "lucide-react";
import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  reviewerAvatar: string | null;
  createdAt: Date;
}

interface Image {
  id: number;
  url: string;
}

interface ListingDetails {
  id: number;
  title: string;
  description: string;
  price: number;
  createdAt: Date;
  sellerId: number;
  sellerName: string;
  sellerAvatar: string | null;
  sellerEmail: string;
  categoryName: string;
  status: string;
}

interface MarketplaceDetailsClientProps {
  listing: ListingDetails;
  images: Image[];
  reviews: Review[];
  averageRating: number;
  initialWishlisted: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  currentUserId: number | null;
  sellerDiscord: string | null;
}

export function MarketplaceDetailsClient({
  listing,
  images,
  reviews,
  averageRating,
  initialWishlisted,
  isOwner,
  isLoggedIn,
  currentUserId,
  sellerDiscord,
}: MarketplaceDetailsClientProps) {
  const router = useRouter();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Status and Cart states
  const [status, setStatus] = useState(listing.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  // Review states
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);
  const [localAvgRating, setLocalAvgRating] = useState(averageRating);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Deletion states
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Check if item is already in user's cart
  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/marketplace/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.items) {
            const found = data.items.some((item: any) => item.listingId === listing.id);
            setInCart(found);
          }
        })
        .catch((err) => console.error("Error fetching cart for detail check:", err));
    }
  }, [isLoggedIn, listing.id]);

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await fetch("/api/marketplace/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsWishlisted(data.favorited);
      }
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const toggleSoldStatus = async () => {
    setStatusLoading(true);
    const newStatus = status === "sold" ? "active" : "sold";
    try {
      const res = await fetch(`/api/marketplace/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to update status.");
      }
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const addToCart = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setCartLoading(true);
    try {
      const res = await fetch("/api/marketplace/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (res.ok) {
        setInCart(true);
        setCartSuccess(true);
        // Trigger cart count badge updates
        window.dispatchEvent(new CustomEvent("cart-updated"));
        setTimeout(() => setCartSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to add to cart.");
      }
    } catch (err) {
      alert("Failed to add to cart.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setReviewLoading(true);
    setReviewError("");
    setReviewSuccess(false);

    try {
      const res = await fetch("/api/marketplace/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: listing.sellerId, rating, comment }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReviewError(data.error ?? "Failed to submit review.");
      } else {
        setReviewSuccess(true);
        setComment("");
        // Reload page to fetch newly inserted review
        router.refresh();
        // Optimistic local add so they see it instantly
        const newReview: Review = {
          id: Math.random(),
          rating,
          comment: comment.trim() || null,
          reviewerName: "You",
          reviewerAvatar: null,
          createdAt: new Date(),
        };
        const updatedReviews = [newReview, ...localReviews];
        setLocalReviews(updatedReviews);
        
        // Recalculate average
        const total = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        setLocalAvgRating(parseFloat((total / updatedReviews.length).toFixed(1)));
      }
    } catch (err) {
      setReviewError("Network error. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/marketplace/${listing.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/marketplace");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete listing.");
      }
    } catch (err) {
      alert("Failed to delete listing.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderStars = (score: number, size = 4) => {
    const starArr = [];
    const sizeClass = size === 3 ? "h-3 w-3" : size === 4 ? "h-4 w-4" : "h-5 w-5";
    for (let i = 1; i <= 5; i++) {
      starArr.push(
        <Star
          key={i}
          className={`${sizeClass} ${
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
      {/* Back navigation */}
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Image Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-outline-variant bg-white/5">
            {images.length > 0 && images[activeImageIdx] ? (
              <SafeDisplayImage
                src={images[activeImageIdx].url}
                alt={listing.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                <ShoppingBag className="h-16 w-16 text-on-surface-variant/20" />
              </div>
            )}
            
            {/* SOLD status banner */}
            {status === "sold" && (
              <div className="absolute top-4 left-4 z-10 bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-on-primary rounded shadow-lg">
                Sold
              </div>
            )}

            {/* Wishlist/Heart float */}
            {!isOwner && (
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-on-surface hover:text-primary transition-colors disabled:opacity-50 shadow-md"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted ? "fill-primary text-primary" : "text-on-surface"
                  }`}
                />
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-white/5 ${
                    idx === activeImageIdx
                      ? "border-primary"
                      : "border-outline-variant hover:border-on-surface/30"
                  }`}
                >
                  <SafeDisplayImage src={img.url} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Details and Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <span className="inline-block rounded-md bg-white/5 border border-outline-variant px-2.5 py-1 text-xs font-bold text-primary uppercase tracking-widest">
              {listing.categoryName}
            </span>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
              {listing.title}
            </h1>
            <div className="text-3xl font-black text-primary">₹{listing.price}</div>
          </div>

          {/* Add to Cart & Contact Buttons */}
          {!isOwner && (
            <div className="flex flex-col gap-3">
              {status === "sold" ? (
                <button
                  disabled
                  className="w-full rounded-lg bg-white/5 border border-outline-variant py-3.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 cursor-not-allowed text-center"
                >
                  This Item is Sold
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={addToCart}
                    disabled={cartLoading || inCart}
                    className={`flex-1 rounded-lg py-3.5 text-xs font-bold uppercase tracking-widest transition-all shadow-md text-center ${
                      inCart
                        ? "bg-white/5 border border-outline-variant text-on-surface-variant/70 cursor-default"
                        : "bg-primary text-on-primary hover:brightness-110 disabled:opacity-50"
                    }`}
                  >
                    {cartLoading ? "Adding..." : inCart ? "Added to Cart" : "Add to Cart"}
                  </button>
                  <a
                    href={`mailto:${listing.sellerEmail}?subject=Inquiry about your listing: ${encodeURIComponent(listing.title)}`}
                    className="flex-1 rounded-lg bg-white/5 border border-outline-variant py-3.5 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-white/10 transition-colors shadow-md text-center flex items-center justify-center gap-1.5"
                  >
                    Contact Seller
                  </a>
                </div>
              )}
              {cartSuccess && (
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest text-center">
                  Item added to your shopping cart!
                </p>
              )}
            </div>
          )}

          {/* Owner options */}
          {isOwner && (
            <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-outline-variant rounded-xl p-4">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Owner Controls:
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/marketplace/${listing.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-white/10"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={toggleSoldStatus}
                  disabled={statusLoading}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                    status === "sold"
                      ? "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {status === "sold" ? "Mark as Active" : "Mark as Sold"}
                </button>
                {showConfirmDelete ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 disabled:opacity-50"
                    >
                      {deleteLoading ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="rounded-lg border border-outline-variant bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Description
            </h3>
            <p className="text-sm text-on-surface-variant/90 leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Seller Card */}
          <div className="glass-card border border-outline-variant rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Seller Profile
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {listing.sellerAvatar ? (
                  <img
                    src={listing.sellerAvatar}
                    alt={listing.sellerName}
                    className="h-10 w-10 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-on-surface">
                    {listing.sellerName[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{listing.sellerName}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {renderStars(localAvgRating, 3)}
                    <span className="text-[10px] text-on-surface-variant/80 ml-1">
                      ({localAvgRating || "No reviews"})
                    </span>
                  </div>

                  {/* Seller Contact & Discord details */}
                  <div className="mt-2.5 space-y-1">
                    <span className="text-[11px] text-on-surface-variant/80 block select-all">
                      📧 {listing.sellerEmail}
                    </span>
                    {sellerDiscord && (
                      <span className="text-[11px] text-on-surface-variant/80 block select-all">
                        🎮 Discord: {sellerDiscord}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right self-start">
                <span className="text-[10px] text-on-surface-variant/60 block">Listed on</span>
                <span className="text-xs font-bold text-on-surface">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Reviews Section */}
      <div className="border-t border-outline-variant/50 pt-10 grid gap-8 md:grid-cols-12">
        {/* Reviews list (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-on-surface">
            Reviews for {listing.sellerName}
          </h2>

          {localReviews.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm text-on-surface-variant/60 rounded-xl">
              No reviews for this seller yet.
            </div>
          ) : (
            <div className="space-y-4">
              {localReviews.map((rev) => (
                <div key={rev.id} className="glass-card p-4 rounded-xl space-y-2 border border-outline-variant/40">
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
                      {renderStars(rev.rating, 3)}
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

        {/* Submit review form (5 cols) */}
        <div className="md:col-span-5">
          {!isOwner && (
            <div className="glass-card p-5 border border-outline-variant rounded-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">
                Leave a Review
              </h3>

              {!isLoggedIn ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-on-surface-variant/70">
                    You must be signed in to submit seller reviews.
                  </p>
                  <Link
                    href="/login"
                    className="inline-block rounded bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-primary hover:brightness-110"
                  >
                    Log In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Rating Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-on-surface transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating
                                ? "fill-accent-warm text-accent-warm"
                                : "text-on-surface-variant/20"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Comment (Optional)
                    </label>
                    <textarea
                      placeholder="Write your review comments here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full text-xs p-3 rounded-lg min-h-[90px]"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs text-primary font-semibold">{reviewError}</p>
                  )}
                  {reviewSuccess && (
                    <p className="text-xs text-status-success font-semibold">
                      Review submitted successfully!
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full rounded-lg bg-primary py-2 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
