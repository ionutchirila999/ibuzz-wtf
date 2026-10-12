import { createServerFn } from '@tanstack/react-start';
import { enquirySchema } from './enquiry-schema';
import { cooldownDecision, createChallenge, hashVisitor, verifyChallenge } from './form-guard';

export const getHumanCheck = createServerFn({method:'POST'}).handler(async () => createChallenge(process.env['SUPABASE_SERVICE_ROLE_KEY']!));

export const submitEnquiry = createServerFn({method:'POST'}).inputValidator((input: unknown) => enquirySchema.parse(input)).handler(async ({data}) => {
 const secret = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
 if (data.website) return {saved:true as const, status:'ok' as const}; // honeypot: silently drop bots
 if (!(await verifyChallenge(secret, data.checkToken, data.checkAnswer))) return {saved:false as const, status:'human' as const};
 const {getRequest} = await import('@tanstack/react-start/server');
 const req = getRequest();
 const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
 const visitor = await hashVisitor(secret, ip);
 const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
 const since = new Date(Date.now() - 3600_000).toISOString();
 const {data:recent} = await supabaseAdmin.from('enquiry_rate_limits').select('created_at').eq('visitor_hash', visitor).gte('created_at', since);
 if (cooldownDecision((recent ?? []).map(r => new Date(r.created_at).getTime())) === 'cooldown') return {saved:false as const, status:'cooldown' as const};
 const paths:string[] = [];
 try {
  for(const photo of data.photos) {
   const bytes = Uint8Array.from(atob(photo.data), c => c.charCodeAt(0));
   const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
   const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
   const webp = String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
   if (!(photo.mime === 'image/jpeg' ? jpeg : photo.mime === 'image/png' ? png : webp) || bytes.length > 1000000) throw new Error('Invalid photo');
   const path = `${crypto.randomUUID()}.${photo.mime === 'image/jpeg' ? 'jpg' : photo.mime === 'image/png' ? 'png' : 'webp'}`;
   const {error} = await supabaseAdmin.storage.from('enquiry-photos').upload(path, bytes, {contentType:photo.mime});
   if(error) throw error;
   paths.push(path);
  }
  const result = data.kind === 'sell'
   ? await supabaseAdmin.from('resale_offers').insert({name:data.name,contact:data.contact,category:'technology',item_description:data.description,condition_notes:data.description,device_type:data.service,brand:data.brand,model:data.model,device_condition:data.deviceCondition,asking_price:data.price,photos:paths})
   : await supabaseAdmin.from('service_enquiries').insert({kind:data.kind,name:data.name,contact:data.contact,service:data.service,description:data.description,photos:paths});
  if(result.error) throw result.error;
  await supabaseAdmin.from('enquiry_rate_limits').insert({visitor_hash: visitor});
  await supabaseAdmin.from('enquiry_rate_limits').delete().lt('created_at', new Date(Date.now() - 86400_000).toISOString());
  return {saved:true as const, status:'ok' as const};
 } catch(error) { if(paths.length) await supabaseAdmin.storage.from('enquiry-photos').remove(paths); throw new Error('Could not save request'); }
});
