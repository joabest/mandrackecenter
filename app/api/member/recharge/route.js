import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {verifyMember} from '../../../../lib/member-session';
import {db} from '../../../../lib/members';
export const runtime='nodejs';
export async function POST(req){
 const id=await verifyMember((await cookies()).get('mandracke_member')?.value,process.env.SESSION_SECRET);
 if(!id)return NextResponse.json({error:'Não autenticado'},{status:401});
 let credits;try{({credits}=await req.json())}catch{}
 if(!Number.isSafeInteger(credits)||credits<1||credits>100000)return NextResponse.json({error:'Quantidade inválida'},{status:400});
 try{
  await db('mc_recharges',{method:'POST',body:{telegram_id:id,credits_requested:credits,status:'pending'},prefer:'return=minimal'});
  return NextResponse.json({ok:true,message:'Solicitação registrada. Créditos só entram após aprovação administrativa.'});
 }catch(e){console.error('Recharge',String(e));return NextResponse.json({error:'Não foi possível registrar'},{status:503})}
}
