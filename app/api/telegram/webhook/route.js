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
  const existing=await db('mc_users?telegram_id=eq.'+id+'&select=telegram_id');
  if(!existing?.length)await db('mc_users',{method:'POST',body:{telegram_id:id,username:String(message.from?.username||'').slice(0,80),first_name:String(message.from?.first_name||'').slice(0,100)},prefer:'resolution=merge-duplicates,return=minimal'});
  else await db('mc_users?telegram_id=eq.'+id,{method:'PATCH',body:{username:String(message.from?.username||'').slice(0,80),first_name:String(message.from?.first_name||'').slice(0,100)},prefer:'return=minimal'});
  const key=generateKey();
  await db('mc_login_keys',{method:'POST',body:{telegram_id:id,key_hash:hashKey(key),expires_at:new Date(Date.now()+10*60*1000).toISOString()},prefer:'return=minimal'});
  await reply(message.chat.id,'MANDRACKE CENTER\n\nSua key de acesso (uso único, válida por 10 minutos):\n\n'+key+'\n\nCopie e cole na tela de login do painel. Não compartilhe esta key.');
 }catch(e){console.error('Telegram webhook',String(e));return NextResponse.json({error:'Falha temporária ao processar /start'},{status:500})}
 return NextResponse.json({ok:true});
}
