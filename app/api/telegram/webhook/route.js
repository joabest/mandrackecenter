import {NextResponse} from 'next/server';
import {db,generateKey,hashKey} from '../../../../lib/members';
export const runtime='nodejs';
async function reply(chatId,message){
 const r=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text:message,disable_web_page_preview:true}),signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('TELEGRAM_REPLY_FAILED');
}
export async function POST(req){
 const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
 if(!secret||secret.length<16||req.headers.get('x-telegram-bot-api-secret-token')!==secret||!process.env.TELEGRAM_BOT_TOKEN)return NextResponse.json({error:'Forbidden'},{status:403});
 let update;try{update=await req.json()}catch{return NextResponse.json({ok:true})}
 const message=update?.message;
 if(!message||message.chat?.type!=='private'||!String(message.text||'').startsWith('/start'))return NextResponse.json({ok:true});
 const id=message.from?.id;
 if(!Number.isSafeInteger(id)||id<=0)return NextResponse.json({ok:true});
 try{
  const key=generateKey();
  const out=await db('rpc/mc_activate_telegram',{method:'POST',body:{p_telegram_id:id,p_username:String(message.from?.username||'').slice(0,80),p_first_name:String(message.from?.first_name||'').slice(0,100),p_key_hash:hashKey(key)}});
  const promo=Array.isArray(out)&&out[0]?.promo_pro_until&&new Date(out[0].promo_pro_until)>new Date();
  await reply(message.chat.id,'MANDRACKE CENTER\n\nSua key permanente de acesso:\n\n'+key+'\n\nCopie e cole na tela de login do painel. Não compartilhe esta key.\n\n'+(promo?'PROMOÇÃO: seu PRO grátis de 7 dias está ativo.':'Plano e créditos podem ser consultados no painel.')+'\n\nAtenção: pedir uma nova key pelo /start substitui a anterior.');
 }catch(e){console.error('Telegram webhook',String(e));return NextResponse.json({error:'Falha temporária ao processar /start'},{status:500})}
 return NextResponse.json({ok:true});
}
