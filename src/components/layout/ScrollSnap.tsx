"use client";

import React, { useEffect, useRef, useState } from "react";

export function ScrollSnapContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
      {children}
    </div>
  );
}

interface ScrollSnapSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function ScrollSnapSection({ children, id, className = "" }: ScrollSnapSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      {
        threshold: 0.25, // Active when at least 25% of the section is visible
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    const currentEl = ref.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
      observer.disconnect();
    };
  }, []);

  // Determine if a custom height is already specified in className
  const hasHeight = className.includes("h-") || className.includes("min-h-");
  const heightClass = hasHeight ? "" : "h-screen overflow-hidden";

  return (
    <section
      id={id}
      ref={ref}
      className={`snap-start w-full flex flex-col justify-center items-center transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${heightClass} ${
        isActive 
          ? "opacity-100 scale-100 translate-y-0 filter blur-0" 
          : "opacity-0 scale-90 translate-y-12 filter blur-md"
      } ${className}`}
    >
      <div className="w-full max-w-[1200px] px-6">
        {children}
      </div>
    </section>
  );
}
