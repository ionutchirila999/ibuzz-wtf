import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n';
import { copy } from '@/lib/service-copy';
import { suggestRepair, type RepairSuggestion } from '@/lib/repair-assistant.functions';

const T = {
  title: ['ไม่แน่ใจว่าต้องซ่อมแบบไหน?', 'Not sure which repair you need?', 'Nu știi ce reparație îți trebuie?'],
  lead: ['อธิบายปัญหาของอุปกรณ์ แล้ว AI จะแนะนำบริการและข้อมูลที่ควรใส่ในคำขอ', 'Describe the problem and our AI assistant suggests a service and what to include in your enquiry.', 'Descrie problema, iar asistentul AI îți sugerează serviciul și ce detalii să incluzi.'],
  placeholder: ['เช่น โทรศัพท์ตกน้ำแล้วเปิดไม่ติด', 'e.g. My phone fell in water and won\u2019t turn on', 'ex. Telefonul a căzut în apă și nu pornește'],
  ask: ['ขอคำแนะนำ', 'Get suggestion', 'Primește sugestie'],
  thinking: ['กำลังวิเคราะห์…', 'Thinking…', 'Se analizează…'],
  include: ['ข้อมูลที่ควรใส่', 'Useful details to include', 'Detalii utile de inclus'],
  go: ['ขอใบเสนอราคา', 'Request a quote', 'Cere o ofertă'],
  note: ['คำแนะนำจาก AI ไม่ใช่การวินิจฉัย ราคาจะแจ้งหลังตรวจสอบ', 'AI suggestion only — not a diagnosis. Prices are given after inspection.', 'Doar o sugestie AI, nu un diagnostic. Prețul se stabilește după inspecție.'],
  error: ['ขออภัย ไม่สามารถให้คำแนะนำได้ตอนนี้ กรุณาลองใหม่ภายหลัง', 'Sorry, we couldn\u2019t get a suggestion right now. Please try again later.', 'Ne pare rău, nu am putut genera o sugestie acum. Încearcă mai târziu.'],
} as const;

export function RepairAssistant() {
  const { lang } = useT();
  const i = lang === 'th' ? 0 : lang === 'en' ? 1 : 2;
  const t = (k: keyof typeof T) => T[k][i];
  const ask = useServerFn(suggestRepair);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RepairSuggestion | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (problem.trim().length < 5) return;
    setBusy(true); setError(''); setResult(null);
    try { const r = await ask({ data: { problem, lang } }); if (r.ok) setResult(r.suggestion); else setError(t('error')); }
    catch { setError(t('error')); } finally { setBusy(false); }
  }
  return <section className="service-card mb-12 rounded-lg border border-border/40 p-6" aria-labelledby="assistant-title">
    <h2 id="assistant-title" className="flex items-center gap-2 text-xl font-bold"><Sparkles className="h-5 w-5 text-azure" />{t('title')}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{t('lead')}</p>
    <form onSubmit={submit} className="mt-4 space-y-3">
      <Textarea aria-label={t('title')} value={problem} onChange={e => setProblem(e.target.value)} placeholder={t('placeholder')} maxLength={1000} rows={3} />
      <Button type="submit" variant="glow" disabled={busy || problem.trim().length < 5}>{busy ? t('thinking') : t('ask')}</Button>
    </form>
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    {result && <div role="status" className="mt-5 border-t border-border/30 pt-5">
      <p className="text-lg font-bold">{copy(lang, result.service)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{result.reason}</p>
      {result.details.length > 0 && <><p className="mt-4 text-sm font-semibold">{t('include')}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.details.map((d, n) => <li key={n}>{d}</li>)}</ul></>}
      <Button asChild variant="secondary" className="mt-5"><Link to="/repair/$service" params={{ service: result.service }}>{t('go')}<ArrowUpRight /></Link></Button>
      <p className="mt-3 text-xs text-muted-foreground">{t('note')}</p>
    </div>}
  </section>;
}
