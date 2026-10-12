import { MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SHOP_CONTACT, lineLink, whatsappLink, type Product } from "@/lib/shop";

export function ContactButtons({ product }: { product?: Product }) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button asChild variant="whatsapp" size="lg" disabled={!SHOP_CONTACT.whatsappNumber}>
        <a href={whatsappLink(product, product ? t("wa.product") : t("wa.general"))} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
      </Button>
      <Button asChild variant="line" size="lg" disabled={!SHOP_CONTACT.lineId}>
        <a href={lineLink()} target="_blank" rel="noreferrer"><MessageCircle /> LINE</a>
      </Button>
    </div>
  );
}
