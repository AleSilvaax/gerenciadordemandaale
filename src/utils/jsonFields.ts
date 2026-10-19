import type { Json } from '@/integrations/supabase/types';
/** Serialize as a JSON value, not a JSON string stored inside JSONB. */
export function toJsonValue(value: unknown): Json {
 return JSON.parse(JSON.stringify(value)) as Json;
}
export function parseJsonValue<T>(value: unknown, fallback:T): T {
 if(typeof value==='string') {try{return JSON.parse(value) as T;}catch{return fallback;}}
 return value === null || value === undefined ? fallback : value as T;
}
