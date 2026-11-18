import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const runtime='nodejs';
export async function GET(){
 const html=await readFile(join(process.cwd(),'legacy','mandracke.html'),'utf-8');
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
