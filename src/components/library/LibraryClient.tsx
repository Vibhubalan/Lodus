"use client";

import { useMemo, useState } from "react";
import type { Resource } from "@/lib/db/schema";
import { RESOURCE_CATEGORIES } from "@/lib/constants";
import { ExternalLink } from "lucide-react";

export function LibraryClient({ resources }: { resources: Resource[] }) {
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    if (category === "All") return resources;
    return resources.filter((r) => r.category === category);
  }, [resources, category]);

  const categories = useMemo(() => {
    const fromData = [...new Set(resources.map((r) => r.category))];
    return ["All", ...fromData.sort()];
  }, [resources]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(categories.length > 1 ? categories : RESOURCE_CATEGORIES).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-on-primary"
                : "glass-card text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="glass-card overflow-hidden rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-outline-variant/40 bg-surface-container/50">
            <tr>
              <th className="px-6 py-3 font-medium text-on-surface-variant">Title</th>
              <th className="px-6 py-3 font-medium text-on-surface-variant">Category</th>
              <th className="px-6 py-3 font-medium text-on-surface-variant">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant">
                  No resources in this category.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-outline-variant/20 last:border-0 hover:bg-primary-container/20"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-on-surface">{r.title}</div>
                    {r.description && (
                      <div className="mt-0.5 text-xs text-on-surface-variant">{r.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{r.category}</td>
                  <td className="px-6 py-4">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
