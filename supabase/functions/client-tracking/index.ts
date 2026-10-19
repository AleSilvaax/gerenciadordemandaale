import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
const schema = z.object({ token: z.string().uuid(), action: z.enum(['read', 'feedback']).default('read'), rating: z.number().int().min(1).max(5).optional(), comment: z.string().max(2000).optional() });
Deno.serve(async (req) => {
 const reply = (data: unknown, status=200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type':'application/json', 'Cache-Control':'no-store' } });
 if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST') return reply({error:'Método inválido'},405);
 try {
  const input=schema.parse(await req.json());
  const db=createClient(Deno.env.get('SUPABASE_URL') ?? '',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const {data:link,error:linkError}=await db.from('service_tracking_links').select('service_id').eq('token',input.token).maybeSingle();
  if(linkError) throw linkError;
  if(!link) return reply({error:'Link inválido. Solicite um novo link à equipe.'},404);
  if(input.action==='feedback') {
   if(input.rating===undefined) return reply({error:'Escolha uma nota.'},400);
   const {error}=await db.rpc('submit_tracking_feedback',{p_token:input.token,p_rating:input.rating,p_comment:input.comment ?? ''});
   if(error) return reply({error:'Não foi possível avaliar este atendimento.'},400);
  }
  const {data:s,error}=await db.from('services').select('id,title,status,location,number,client,address,city,created_at,due_date,date,service_type,priority,description,custom_fields,photos,photo_titles,signatures,feedback').eq('id',link.service_id).single();
  if(error) throw error;
  const {data:photos,error:photoError}=await db.from('service_photos').select('photo_url,title').eq('service_id',s.id).order('created_at');
  const {data:assignments,error:techError}=await db.from('service_technicians').select('profiles(id,name,avatar)').eq('service_id',s.id);
  const {data:usage,error:usageError}=await db.from('service_material_usage').select('planned_quantity,used_quantity,materials(name,unit,cost_per_unit)').eq('service_id',s.id);
  if(photoError || techError || usageError) throw photoError || techError || usageError;
  const entries = new Map<string,{path:string,title:string}>();
  function add(raw:string,title:string) {
   let path=raw;
   if(/^https?:/.test(raw)) { const u=new URL(raw); if(u.origin!==new URL(Deno.env.get('SUPABASE_URL') ?? '').origin) return; const match=u.pathname.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/service-photos\/(.+)$/); if(!match) return; path=decodeURIComponent(match[1]); }
   else path=decodeURIComponent(raw.split('?')[0].replace(/^service-photos\//,''));
   if(!entries.has(path) || title) entries.set(path,{path,title});
  }
  (s.photos ?? []).forEach((p:string,i:number)=>add(p,s.photo_titles?.[i] ?? ''));
  (photos ?? []).forEach(p=>add(p.photo_url,p.title ?? ''));
  const signed=await Promise.all([...entries.values()].map(async(p,i)=>{ const {data,error}=await db.storage.from('service-photos').createSignedUrl(p.path,3600); if(error) throw error; return {url:data.signedUrl,title:p.title || `Registro fotográfico ${i+1}`}; }));
  const parse = (value: unknown) => { if (typeof value === 'string') { try { return JSON.parse(value); } catch { return {}; } } return value ?? {}; };
  const feedback=parse(s.feedback);
  const signatures=parse(s.signatures);
  const fields=parse(s.custom_fields);
  return reply({service:{...s,creationDate:s.created_at,dueDate:s.due_date,serviceType:s.service_type,customFields:Array.isArray(fields) ? fields : [],signatures,photoTitles:signed.map(p=>p.title),photos:signed.map(p=>p.url),technicians:(assignments ?? []).flatMap(a=>a.profiles ? [{...a.profiles,role:'tecnico'}] : []),feedback:{clientRating:feedback.clientRating,clientComment:feedback.clientComment}},materials:usage ?? []});
 } catch(err) { if(err instanceof z.ZodError) return reply({error:'Dados inválidos.'},400); console.error('client-tracking request failed'); return reply({error:'Não foi possível carregar o atendimento. Tente novamente.'},500); }
});
