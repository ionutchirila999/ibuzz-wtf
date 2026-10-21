import { MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SHOP_CONTACT, type Product } from "@/lib/shop";

export function ContactButtons({ product: _product, disabled }: { product?: Product; disabled?: boolean }) {
  if (disabled) {
    return (
      <Button
        variant="line"
        size="lg"
        disabled
        className="w-full justify-center gap-1.5 px-3 text-sm"
      >
        <MessageCircle /> LINE · {SHOP_CONTACT.lineLabel}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="line"
      size="lg"
      disabled={!SHOP_CONTACT.lineId}
      className="w-full justify-center gap-1.5 px-3 text-sm"
    >
      <a
        href="https://line.me/ti/p/CcGd-nkSXZ"
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle /> LINE · {SHOP_CONTACT.lineLabel}
      </a>
    </Button>
  );
}
