import {createFileRoute,Link} from '@tanstack/react-router';
import {useT} from '@/lib/i18n';
import {copy,pageHead} from '@/lib/service-copy';
import {Button} from '@/components/ui/button';
export const Route=createFileRoute('/portfolio')({head:()=>pageHead('Portfolio','Digital work by iBuzz.wtf. Discuss your website or application project.'),component:Portfolio});
function Portfolio(){const {lang}=useT();return <div className="mx-auto max-w-6xl px-5 py-14"><p className="text-primary-soft">iBuzz.wtf Digital</p><h1 className="mt-3 text-4xl font-bold">{copy(lang,'portfolio')}</h1><p className="mt-4 text-muted-foreground">{copy(lang,'portfolioLead')}</p><p className="my-12 border-y py-10 text-muted-foreground">{copy(lang,'portfolioEmpty')}</p><Button asChild variant="glow"><Link to="/digital">{copy(lang,'quote')}</Link></Button></div>}
