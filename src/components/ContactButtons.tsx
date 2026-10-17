import { MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SHOP_CONTACT, lineLink, whatsappLink, type Product } from "@/lib/shop";

export function ContactButtons({ product }: { product?: Product }) {
  const { t } = useT();
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button asChild variant="whatsapp" size="lg" disabled={!SHOP_CONTACT.whatsappNumber} className="justify-center gap-1.5 px-3 text-sm">
        <a href={whatsappLink(product, product ? t("wa.product") : t("wa.general"))} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
      </Button>
      <Button asChild variant="line" size="lg" disabled={!SHOP_CONTACT.lineId} className="justify-center gap-1.5 px-3 text-sm">
        <a href="https://line.me/ti/p/CcGd-nkSXZ" target="_blank" rel="noreferrer"><MessageCircle /> LINE · {SHOP_CONTACT.lineLabel}</a>
      </Button>
    </div>
  );
}
