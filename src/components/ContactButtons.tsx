import { MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SHOP_CONTACT, type Product } from "@/lib/shop";
import { trackEvent } from "@/lib/analytics";

export function ContactButtons({
  product,
  disabled,
}: {
  product?: Product;
  disabled?: boolean;
}) {
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
        onClick={() => trackEvent("contact_line", { placement: "product", product_id: product?.id, item_name: product?.title })}
      >
        <MessageCircle /> LINE · {SHOP_CONTACT.lineLabel}
      </a>
    </Button>
  );
}
