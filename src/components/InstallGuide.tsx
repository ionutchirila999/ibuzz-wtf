import { useEffect, useState } from 'react';
import { MonitorSmartphone, Smartphone, Tablet, Monitor, CheckCircle2 } from 'lucide-react';
import { homeCopy } from '@/lib/home-copy';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Platform = 'android' | 'ios' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const stepKey = { android: 'installStepsAndroid', ios: 'installStepsIos', desktop: 'installStepsDesktop' } as const;
const tabKey = { android: 'installAndroid', ios: 'installIos', desktop: 'installDesktop' } as const;

export function InstallGuide() {
  const { lang } = useT();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit">
          <MonitorSmartphone className="h-4 w-4" />
          {homeCopy(lang, 'installButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{homeCopy(lang, 'installTitle')}</DialogTitle>
          <DialogDescription>{homeCopy(lang, 'installLead')}</DialogDescription>
        </DialogHeader>
        {installed ? (
          <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-azure" aria-hidden />
            <p className="text-sm text-foreground">{homeCopy(lang, 'installed')}</p>
          </div>
        ) : (
          <Tabs defaultValue={platform ?? 'desktop'}>
            <TabsList className="w-full">
              <TabsTrigger value="android" className="flex-1 gap-1.5"><Smartphone className="h-4 w-4" aria-hidden />{homeCopy(lang, 'installAndroid')}</TabsTrigger>
              <TabsTrigger value="ios" className="flex-1 gap-1.5"><Tablet className="h-4 w-4" aria-hidden />{homeCopy(lang, 'installIos')}</TabsTrigger>
              <TabsTrigger value="desktop" className="flex-1 gap-1.5"><Monitor className="h-4 w-4" aria-hidden />{homeCopy(lang, 'installDesktop')}</TabsTrigger>
            </TabsList>
            {(Object.keys(stepKey) as Platform[]).map((p) => (
              <TabsContent key={p} value={p} className="mt-4">
                <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>{homeCopy(lang, stepKey[p])}</li>
                </ol>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
