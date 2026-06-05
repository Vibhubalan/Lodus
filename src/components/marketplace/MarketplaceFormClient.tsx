"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import type { MarketplaceCategory } from "@/lib/db/schema";

interface ExistingImage {
  id: number;
  url: string;
}

interface InitialData {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
}

interface MarketplaceFormClientProps {
  categories: MarketplaceCategory[];
  initialData?: InitialData;
  existingImages?: ExistingImage[];
  isEditMode?: boolean;
}

export function MarketplaceFormClient({
  categories,
  initialData,
  existingImages = [],
  isEditMode = false,
}: MarketplaceFormClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price !== undefined ? String(initialData.price) : "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId !== undefined ? String(initialData.categoryId) : "");
  
  // Image states
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [activeExistingImages, setActiveExistingImages] = useState<ExistingImage[]>(existingImages);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Validate file sizes and types
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Images must be under 5MB.");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        setError("Use JPG, PNG, WebP, or GIF.");
        return;
      }
    }

    setNewImages((prev) => [...prev, ...files]);
    setError("");

    // Create object URLs for preview
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const removeNewImage = (idx: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[idx]);
    
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (id: number) => {
    setActiveExistingImages((prev) => prev.filter((img) => img.id !== id));
    setDeletedImageIds((prev) => [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !categoryId) {
      setError("Please fill out all fields.");
      return;
    }

    const priceVal = parseInt(price, 10);
    if (isNaN(priceVal) || priceVal < 0) {
      setError("Price must be a valid positive integer.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("price", String(priceVal));
    formData.append("categoryId", categoryId);

    // Append new images
    newImages.forEach((file) => {
      formData.append("images", file);
    });

    // Append deleted image IDs (for edit mode)
    if (isEditMode && deletedImageIds.length > 0) {
      formData.append("deletedImageIds", deletedImageIds.join(","));
    }

    const endpoint = isEditMode ? `/api/marketplace/${initialData?.id}` : "/api/marketplace";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save listing.");
      } else {
        // Redirect to detail page or browse page
        const redirectUrl = isEditMode ? `/marketplace/${initialData?.id}` : "/marketplace";
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={isEditMode ? `/marketplace/${initialData?.id}` : "/marketplace"}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>
      </div>

      <div className="glass-card p-6 rounded-xl border border-outline-variant space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-on-surface">
            {isEditMode ? "Edit Listing" : "Create New Listing"}
          </h1>
          <p className="text-xs text-on-surface-variant/70 mt-1">
            Fill out the details below to publish your item or service to the community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block">
              Listing Title
            </label>
            <input
              type="text"
              placeholder="e.g. RTX 4070 Graphics Card, Next.js Consultation, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-sm p-3 rounded-lg"
            />
          </div>

          {/* Grid for Price and Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block">
                Price (INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                required
                className="w-full text-sm p-3 rounded-lg"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full text-sm p-3 rounded-lg cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block">
              Description
            </label>
            <textarea
              placeholder="Describe the item condition, service scope, details, delivery time, etc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full text-sm p-3 rounded-lg min-h-[140px]"
            />
          </div>

          {/* Images Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block">
              Product Images
            </label>

            {/* Existing Images (Edit mode only) */}
            {isEditMode && activeExistingImages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant/60 block">
                  Current Images
                </span>
                <div className="flex flex-wrap gap-3">
                  {activeExistingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-20 w-20 rounded-lg overflow-hidden border border-outline-variant group bg-white/5"
                    >
                      <img src={img.url} alt="Current listing product" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-primary transition-opacity duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Previews */}
            {newPreviews.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant/60 block">
                  New Previews
                </span>
                <div className="flex flex-wrap gap-3">
                  {newPreviews.map((url, idx) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 rounded-lg overflow-hidden border border-outline-variant group bg-white/5"
                    >
                      <img src={url} alt="New upload preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-primary transition-opacity duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Zone */}
            <div className="relative border border-dashed border-outline-variant rounded-lg p-6 bg-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
              <Upload className="h-8 w-8 text-on-surface-variant/40 mb-2" />
              <span className="text-xs font-bold text-on-surface tracking-wide uppercase">
                Choose Images
              </span>
              <span className="text-[10px] text-on-surface-variant/50 mt-1">
                JPG, PNG, WebP or GIF up to 5MB (Max 3-5 images recommended)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>

          {error && <p className="text-xs text-primary font-bold">{error}</p>}

          {/* Action buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary py-3 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? "Saving Listing..." : isEditMode ? "Save Changes" : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
