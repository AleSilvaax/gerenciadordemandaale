import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/serviceTypes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { Download, Loader2, AlertCircle, Star, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ReportMaterial } from '@/utils/pdf/professionalPdfGenerator';

export const ClientTracking: React.FC = () => {
 const { token } = useParams<{token:string}>();
 const [service,setService]=useState<Service|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [saving,setSaving]=useState(false);
 const [rating,setRating]=useState(0);
 const [comment,setComment]=useState('');
 const [saved,setSaved]=useState(false);
 const read = async (extra: Record<string,unknown> = {}) => {
  const {data,error}=await supabase.functions.invoke('client-tracking',{body:{token,...extra}});
  if(error || data?.error || !data?.service) throw new Error(data?.error || 'Não foi possível carregar o atendimento. Solicite um novo link à equipe.');
  return data as {service:Service;materials:ReportMaterial[]};
 };
 const load = async () => {
  setLoading(true);setError('');
  try { const data=await read();setService(data.service);setRating(data.service.feedback?.clientRating || 0);setComment(data.service.feedback?.clientComment || '');setSaved(Boolean(data.service.feedback?.clientRating)); }
  catch(e) {setError(e instanceof Error ? e.message : 'Link indisponível.');}
  finally {setLoading(false);}
 };
 useEffect(()=>{void load();},[token]);
 const download = async () => {
  setBusy(true);
  try {
   const data=await read();setService(data.service);
   const {generateProfessionalServiceReport}=await import('@/utils/pdf/professionalPdfGenerator');
   await generateProfessionalServiceReport(data.service,{preloaded:true,materials:data.materials});
   toast.success('Relatório baixado.');
  } catch(e) {toast.error(e instanceof Error ? e.message : 'Não foi possível baixar o relatório.');}
  finally {setBusy(false);}
 };
 const submit = async (e:React.FormEvent) => {
  e.preventDefault();if(!rating)return;setSaving(true);
  try { const data=await read({action:'feedback',rating,comment});setService(data.service);setSaved(true);toast.success('Avaliação enviada.'); }
  catch {toast.error('Não foi possível enviar a avaliação. Tente novamente.');}
  finally {setSaving(false);}
 };
 if(loading) return <main className="min-h-dvh bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando atendimento" /></main>;
 if(error || !service) return <main className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4 px-6 text-center"><AlertCircle className="h-8 w-8 text-destructive"/><h1 className="text-lg font-semibold">Acompanhamento indisponível</h1><p className="text-sm text-muted-foreground max-w-sm">{error}</p><Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>Tentar novamente</Button></main>;
 const concluded=service.status==='concluido';
 return <main className="min-h-dvh bg-background px-4 py-6 text-foreground"><div className="mx-auto max-w-2xl space-y-6">
  <header className="border-b border-border pb-4"><p className="text-sm font-semibold text-primary">ServiceFlow</p><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">OS #{service.number?.split('-').pop()}</p><h1 className="text-xl font-semibold break-words">{service.title}</h1></div><StatusBadge status={service.status}/></div></header>
  <section className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm"><div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium break-words">{service.client || 'Não informado'}</p></div><div><p className="text-xs text-muted-foreground">Previsão</p><p className="font-medium">{service.dueDate ? new Date(service.dueDate).toLocaleDateString('pt-BR') : 'A definir'}</p></div><div className="col-span-2"><p className="text-xs text-muted-foreground">Local</p><p>{[service.address,service.city].filter(Boolean).join(', ') || service.location}</p></div><div className="col-span-2"><p className="text-xs text-muted-foreground">Equipe responsável</p><p>{service.technicians.map(t=>t.name).join(', ') || 'A definir'}</p></div></section>
  {Boolean(service.photos?.length) && <section className="border-t border-border pt-4"><h2 className="text-base font-semibold mb-3">Fotos do atendimento</h2><div className="grid grid-cols-2 gap-3">{service.photos?.map((url,i)=><figure key={url} className="min-w-0"><a href={url} target="_blank" rel="noreferrer"><img src={url} alt={service.photoTitles?.[i] || 'Foto do atendimento'} className="w-full aspect-[4/3] object-contain bg-muted rounded-md"/></a><figcaption className="text-xs mt-1 break-words">{service.photoTitles?.[i]}</figcaption></figure>)}</div></section>}
  {service.signatures?.client && <section className="border-t border-border pt-4"><h2 className="text-base font-semibold mb-3">Assinatura do cliente</h2><img src={service.signatures.client} alt="Assinatura do cliente" className="w-full h-40 object-contain border border-border rounded-md bg-card"/></section>}
  {concluded && <><section className="border-t border-border pt-4"><Button onClick={download} disabled={busy} className="w-full sm:w-auto">{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Download className="h-4 w-4 mr-2"/>}{busy ? 'Preparando relatório…' : 'Baixar relatório PDF'}</Button></section>
   <form onSubmit={submit} className="border-t border-border pt-4 space-y-3"><h2 className="text-base font-semibold">Avaliação do atendimento</h2><div className="flex gap-1" role="group" aria-label="Nota do atendimento">{[1,2,3,4,5].map(n=><Button key={n} type="button" size="icon" variant="ghost" aria-label={`${n} ${n===1?'estrela':'estrelas'}`} aria-pressed={n===rating} onClick={()=>{setRating(n);setSaved(false);}} className={n<=rating?'text-primary':'text-muted-foreground'}><Star className={`h-6 w-6 ${n<=rating?'fill-current':''}`}/></Button>)}</div><label htmlFor="client-comment" className="block text-sm">Comentário</label><Textarea id="client-comment" value={comment} maxLength={2000} onChange={e=>{setComment(e.target.value);setSaved(false);}}/><div className="flex items-center gap-3"><Button type="submit" disabled={!rating || saving || saved}>{saving?'Enviando…':saved?'Avaliação enviada':'Enviar avaliação'}</Button></div></form></>}
 </div></main>;
};
export default ClientTracking;
