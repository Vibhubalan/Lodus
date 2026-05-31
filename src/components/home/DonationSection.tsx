"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const QR_SIZE = 112;

type SessionResponse = {
  url: string;
  error?: string;
};

export function DonationSection() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCheckout = useCallback(async () => {
    try {
      const res = await fetch("/api/donate/create-session", { method: "POST" });
      const data = (await res.json()) as SessionResponse;
      if (!res.ok) {
        setCheckoutUrl(null);
        return;
      }
      setCheckoutUrl(data.url);
    } catch {
      setCheckoutUrl(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      await refreshCheckout();
      if (active) setLoading(false);
    };

    load();
    const interval = setInterval(refreshCheckout, 15 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshCheckout]);

  return (
    <div
      id="support"
      className="mb-4 flex flex-col items-start"
      style={{ width: QR_SIZE + 20 }}
      aria-labelledby="donation-heading"
    >
      <p
        id="donation-heading"
        className="mb-2 w-full text-center text-[9px] font-semibold leading-tight tracking-wide text-on-surface-variant"
      >
        Show your support with 1$
      </p>
      <div className="rounded-md bg-white p-2.5">
        {loading || !checkoutUrl ? (
          <div
            className="flex items-center justify-center bg-white"
            style={{ width: QR_SIZE, height: QR_SIZE }}
          >
            <Loader2 className="h-5 w-5 animate-spin text-[#0a0507]" />
          </div>
        ) : (
          <QRCodeSVG
            value={checkoutUrl}
            size={QR_SIZE}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a0507"
            includeMargin={false}
          />
        )}
      </div>
    </div>
  );
}
