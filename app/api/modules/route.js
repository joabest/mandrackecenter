import {NextResponse} from 'next/server';
import {db} from '../../../lib/members';
export const runtime='nodejs';
export async function GET(){
 try{
  const data=await db('mc_module_settings?select=module_id,enabled,off_message');
  return NextResponse.json({modules:data},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Module status',String(e));return NextResponse.json({error:'Status indisponível'},{status:503})}
}
