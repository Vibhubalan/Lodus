"use client";

import { getImageProps, type ImageProps } from "next/image";

type SafeDisplayImageProps = Omit<ImageProps, "draggable" | "alt"> & {
  alt: string;
  wrapperClassName?: string;
};

/** Map Next/Image object-* classes to background-* utilities. */
function backgroundClasses(className: string): string {
  const parts = ["bg-no-repeat"];
  if (className.includes("object-contain")) parts.push("bg-contain");
  else parts.push("bg-cover");
  if (className.includes("object-top")) parts.push("bg-top");
  else if (className.includes("object-bottom")) parts.push("bg-bottom");
  else if (className.includes("object-left")) parts.push("bg-left");
  else if (className.includes("object-right")) parts.push("bg-right");
  else parts.push("bg-center");
  return parts.join(" ");
}

/**
 * Public photos rendered as CSS backgrounds (not &lt;img&gt;) so browsers
 * do not attach Google Lens / Edge visual-search icons on hover.
 */
export function SafeDisplayImage({
  wrapperClassName = "",
  className = "",
  alt,
  src,
  fill,
  ...rest
}: SafeDisplayImageProps) {
  const { props: optimized } = getImageProps({
    ...rest,
    src,
    alt,
    fill,
  });
  const bgUrl = optimized.src;
  const bgClass = backgroundClasses(className);

  const shield = (
    <div
      className="public-display-image-shield absolute inset-0 z-1"
      aria-hidden
      onContextMenu={(e) => e.preventDefault()}
    />
  );

  if (fill) {
    return (
      <div
        className={`public-display-image absolute inset-0 select-none overflow-hidden ${wrapperClassName}`}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          role="img"
          aria-label={alt}
          className={`absolute inset-0 ${bgClass}`}
          style={{ backgroundImage: `url("${bgUrl}")` }}
        />
        {shield}
      </div>
    );
  }

  const positionClass = "h-full w-full min-h-[1px] min-w-[1px]";

  return (
    <div
      className={`public-display-image relative select-none overflow-hidden ${wrapperClassName}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        role="img"
        aria-label={alt}
        className={`${positionClass} ${bgClass}`}
        style={{ backgroundImage: `url("${bgUrl}")` }}
      />
      {shield}
    </div>
  );
}
