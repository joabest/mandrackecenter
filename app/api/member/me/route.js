import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {verifyMember} from '../../../../lib/member-session';
import {db,safeUser} from '../../../../lib/members';
export const runtime='nodejs';
export async function GET(){
 const id=await verifyMember((await cookies()).get('mandracke_member')?.value,process.env.SESSION_SECRET);
 if(!id)return NextResponse.json({error:'Não autenticado'},{status:401});
 try{
  const rows=await db('mc_users?telegram_id=eq.'+id+'&select=telegram_id,username,first_name,credits,created_at,plan,promo_pro_until,enabled');
  if(!rows?.length||rows[0].enabled===false)return NextResponse.json({error:'Conta não encontrada'},{status:404});
  const recharge=await db('mc_recharges?telegram_id=eq.'+id+'&select=id,credits_requested,status,created_at&order=created_at.desc&limit=20');
  return NextResponse.json({user:safeUser(rows[0]),recharges:recharge,bot:process.env.TELEGRAM_BOT_USERNAME||null,group:process.env.CENTRAL_GROUP_URL||null,support:'https://t.me/mandracke'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Member data',String(e));return NextResponse.json({error:'Banco indisponível'},{status:503})}
}
