import {NextResponse} from 'next/server';
import {db,generateKey,hashKey,safeUser} from '../../../../lib/members';

export const runtime='nodejs';
const LOGIN='https://mandracke.vercel.app/login';
const SUPPORT='https://t.me/mandracke';
const BOT='https://t.me/mandrackecenterkeybot';
const isAdmin=id=>Boolean(process.env.ADMIN_TELEGRAM_ID)&&String(id)===process.env.ADMIN_TELEGRAM_ID;
const adminMenu=()=>({inline_keyboard:[
 [{text:'📊 Resumo administrativo',callback_data:'admin_summary'},{text:'👥 Usuários',callback_data:'admin_users'}],
 [{text:'💳 Recargas pendentes',callback_data:'admin_recharges'}],
 [{text:'🌐 Abrir painel administrativo',url:'https://mandracke.vercel.app/login'}],
 [{text:'⬅️ Menu principal',callback_data:'menu'}]
]});
async function adminAction(action,chatId,id){
 if(!isAdmin(id)){await chat(chatId,'⛔ Acesso restrito ao administrador.');return}
 if(action==='admin'){
  return chat(chatId,'🛡 ADMINISTRADOR — MANDRACKE CENTER\n\nAcesso reconhecido pelo seu Telegram ID. Seu plano e créditos como usuário não são alterados por este reconhecimento.\n\nEscolha abaixo:',{reply_markup:adminMenu()});
 }
 if(action==='admin_summary'){
  const [users,recharges]=await Promise.all([
   db('mc_users?select=telegram_id,plan,promo_pro_until'),
   db('mc_recharges?select=status')
  ]);
  const pending=recharges.filter(x=>x.status==='pending').length;
  const promos=users.filter(x=>x.plan==='FREE'&&x.promo_pro_until&&new Date(x.promo_pro_until)>new Date()).length;
  return chat(chatId,'📊 RESUMO ADMINISTRATIVO\n\nUsuários: '+users.length+'\nPRO promocionais ativos: '+promos+'\nRecargas pendentes: '+pending,{reply_markup:adminMenu()});
 }
 if(action==='admin_users'){
  const users=await db('mc_users?select=telegram_id,username,first_name,plan,credits,enabled&order=created_at.desc&limit=15');
  const lines=users.map(x=>'• '+(x.first_name||x.username||'Usuário')+' — ID '+x.telegram_id+' — '+x.plan+' — '+x.credits+' créditos'+(x.enabled?'':' (bloqueado)'));
  return chat(chatId,'👥 ÚLTIMOS USUÁRIOS\n\n'+(lines.join('\n')||'Nenhum usuário registrado.')+'\n\nPara editar plano e créditos, use o painel administrativo.',{reply_markup:adminMenu()});
 }
 if(action==='admin_recharges'){
  const rows=await db('mc_recharges?status=eq.pending&select=id,telegram_id,credits_requested,created_at&order=created_at.asc&limit=12');
  if(!rows.length)return chat(chatId,'✅ Nenhuma recarga pendente.',{reply_markup:adminMenu()});
  const text=rows.map(x=>'• ID Telegram '+x.telegram_id+': '+x.credits_requested+' créditos').join('\n');
  return chat(chatId,'💳 RECARGAS PENDENTES\n\n'+text+'\n\nA aprovação e o crédito devem ser feitos pelo painel administrativo.',{reply_markup:adminMenu()});
 }
}

const menu=[
 [{text:'🔑 Gerar Key',callback_data:'key'},{text:'👤 Minha Conta',callback_data:'account'}],
 [{text:'💳 Créditos',callback_data:'credits'},{text:'📊 Limites',callback_data:'limits'}],
 [{text:'📜 Histórico',callback_data:'history'},{text:'➕ Recarga',callback_data:'recharge'}],
 [{text:'🖼 Atualizar Foto',callback_data:'photo'},{text:'✏️ Atualizar Nome',callback_data:'name'}],
 [{text:'🛡 Desconectar Dispositivos',callback_data:'disconnect'}],
 [{text:'👥 Grupo da Central',callback_data:'group'}],
 [{text:'🌐 Entrar no Painel',url:LOGIN},{text:'🆘 Suporte',url:SUPPORT}]
];

async function telegram(method,body){
 const t=process.env.TELEGRAM_BOT_TOKEN;
 const r=await fetch('https://api.telegram.org/bot'+t+'/'+method,{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
  signal:AbortSignal.timeout(12000),cache:'no-store'
 });
 const x=await r.json();
 if(!r.ok||!x.ok)throw Error('Telegram API '+method+': '+String(x.description||r.status));
 return x.result;
}
const chat=(chat_id,text,options={})=>telegram('sendMessage',{chat_id,text,disable_web_page_preview:true,...options});
const keyboard=(extra=[])=>({inline_keyboard:[...menu,...extra]});
function tidyCommand(text){return String(text||'').trim().split(/\s+/)[0].toLowerCase().split('@')[0]}
function fullPlan(u){return safeUser(u).effective_plan}
async function getUser(id){
 const users=await db('mc_users?telegram_id=eq.'+id+'&select=telegram_id,username,first_name,credits,created_at,plan,promo_pro_until,enabled,photo_file_id,session_version');
 return users[0]||null;
}
async function intro(id,name){
 const u=await getUser(id);
 const state=u?'Seu cadastro já está ativo.':'Use “🔑 Gerar Key” para ativar sua conta.';
 await chat(id,'🟣 MANDRACKE CENTER\n\nOlá, '+(name||'usuário')+'! Bem-vindo à central.\n'+state+'\n\nSelecione uma opção abaixo:',{reply_markup:keyboard(isAdmin(id)?[[{text:'🛡 Administração',callback_data:'admin'}]]:[])});
}
async function issueKey(chatId,telegramId,from){
 const key=generateKey();
 const out=await db('rpc/mc_activate_telegram',{method:'POST',body:{
  p_telegram_id:telegramId,p_username:String(from?.username||'').slice(0,80),
  p_first_name:String(from?.first_name||'').slice(0,100),p_key_hash:hashKey(key)
 }});
 const expiry=Array.isArray(out)?out[0]?.promo_pro_until:null;
 const promo=expiry&&new Date(expiry)>new Date();
 const when=promo?'\n🎁 PRO promocional até '+new Date(expiry).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+'.':'';
 await chat(chatId,
 '🔑 MANDRACKE CENTER — SUA KEY\n\n'+
 'Sua key permanente:\n'+key+'\n\n'+
 '🌐 Login: '+LOGIN+'\n\n'+
 'Copie a key e cole no campo de acesso do site. Ela permanece válida até você solicitar outra ou o administrador revogá-la.'+
 when+'\n\n⚠️ Não compartilhe sua key. Solicitar outra substitui a anterior.',
 {reply_markup:{inline_keyboard:[
 [{text:'🌐 Abrir login',url:LOGIN}],
 [{text:'👤 Minha Conta',callback_data:'account'},{text:'⬅️ Menu',callback_data:'menu'}]
 ]}}
 );
}
async function account(chatId,id){
 const u=await getUser(id);
 if(!u)return chat(chatId,'Você ainda não está cadastrado. Clique em Gerar Key.',{reply_markup:{inline_keyboard:[[{text:'🔑 Gerar Key',callback_data:'key'}]]}});
 const active=u.enabled!==false;
 const promo=u.promo_pro_until&&new Date(u.promo_pro_until)>new Date();
 await chat(chatId,'👤 MINHA CONTA\n\nNome: '+(u.first_name||'Não informado')+
 '\nTelegram: @'+(u.username||'sem username')+
 '\nID: '+u.telegram_id+
 '\nPlano: '+fullPlan(u)+(promo?'\n🎁 PRO até '+new Date(u.promo_pro_until).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'')+
 '\nCréditos: '+Number(u.credits).toLocaleString('pt-BR')+
 '\nSituação: '+(active?'Ativa':'Desativada')+
 '\nKey: permanente (não exibida novamente por segurança).',
 {reply_markup:keyboard()});
}
async function credits(chatId,id){
 const u=await getUser(id);
 if(!u)return chat(chatId,'Cadastre sua conta primeiro com Gerar Key.');
 await chat(chatId,'💳 CRÉDITOS\n\nSaldo atual: '+Number(u.credits).toLocaleString('pt-BR')+
 ' créditos.\nPlano: '+fullPlan(u)+'\n\nO saldo é consultado diretamente no banco de dados. Recargas só são creditadas após aprovação do administrador.',
 {reply_markup:{inline_keyboard:[[{text:'➕ Solicitar recarga',callback_data:'recharge'}],[{text:'⬅️ Menu',callback_data:'menu'}]]}});
}
async function limits(chatId,id){
 const u=await getUser(id);
 if(!u)return chat(chatId,'Cadastre sua conta primeiro com Gerar Key.');
 const plan=fullPlan(u);
 await chat(chatId,'📊 PLANO E LIMITES\n\nPlano ativo: '+plan+
 '\nCréditos disponíveis: '+Number(u.credits).toLocaleString('pt-BR')+
 '\n\nOs limites específicos de cada ferramenta ainda dependem da configuração do administrador. Nenhum limite não cadastrado será apresentado como válido.',
 {reply_markup:{inline_keyboard:[[{text:'👤 Minha Conta',callback_data:'account'}],[{text:'⬅️ Menu',callback_data:'menu'}]]}});
}
async function history(chatId,id){
 const rows=await db('mc_recharges?telegram_id=eq.'+id+'&select=credits_requested,status,created_at&order=created_at.desc&limit=8');
 const labels={pending:'Pendente',approved:'Aprovada',rejected:'Recusada'};
 const lines=rows.map(x=>'• '+x.credits_requested+' créditos — '+(labels[x.status]||x.status)+' ('+new Date(x.created_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})+')');
 await chat(chatId,'📜 HISTÓRICO DE RECARGAS\n\n'+(lines.length?lines.join('\n'):'Nenhuma solicitação registrada.'),{reply_markup:{inline_keyboard:[[{text:'⬅️ Menu',callback_data:'menu'}]]}});
}
async function recharge(chatId,id,amount){
 const u=await getUser(id);
 if(!u||u.enabled===false)return chat(chatId,'Conta inexistente ou desativada.');
 if(!Number.isSafeInteger(amount)||amount<1||amount>100000)return chat(chatId,'Quantidade inválida. Use /recarga 100 (de 1 a 100000 créditos).');
 await db('mc_recharges',{method:'POST',body:{telegram_id:id,credits_requested:amount,status:'pending'},prefer:'return=minimal'});
 await chat(chatId,'✅ Pedido de '+amount+' créditos registrado.\n\nStatus: PENDENTE. A recarga não realiza pagamentos e os créditos só serão adicionados após a aprovação do administrador.',{reply_markup:{inline_keyboard:[[{text:'📜 Histórico',callback_data:'history'}],[{text:'⬅️ Menu',callback_data:'menu'}]]}});
}
async function rechargeMenu(id){
 await chat(id,'➕ RECARGA DE CRÉDITOS\n\nSelecione uma quantidade ou envie /recarga 100 para um valor personalizado.\n\nNenhuma cobrança automática é efetuada. A solicitação ficará pendente até a aprovação.',{reply_markup:{inline_keyboard:[
 [{text:'100 créditos',callback_data:'recharge_100'},{text:'500 créditos',callback_data:'recharge_500'}],
 [{text:'1000 créditos',callback_data:'recharge_1000'}],
 [{text:'⬅️ Menu',callback_data:'menu'}]
 ]}});
}
async function namePrompt(id){await chat(id,'✏️ ATUALIZAR NOME\n\nResponda a esta mensagem com o nome desejado (até 80 caracteres). A alteração será exibida no painel; seu nome público do Telegram não será modificado.',{reply_markup:{force_reply:true,input_field_placeholder:'Novo nome'}})}
async function photoPrompt(id){await chat(id,'🖼 ATUALIZAR FOTO\n\nResponda a esta mensagem enviando uma foto. Salvaremos apenas a referência privada da imagem no Telegram, não a imagem no banco.',{reply_markup:{force_reply:true}})}
async function updateName(chatId,id,name){
 const u=await getUser(id);if(!u)return chat(chatId,'Cadastre a conta com Gerar Key antes de atualizar o perfil.');
 const clean=String(name||'').trim();if(clean.length<2||clean.length>80)return chat(chatId,'Nome inválido: use entre 2 e 80 caracteres.');
 await db('mc_users?telegram_id=eq.'+id,{method:'PATCH',body:{first_name:clean},prefer:'return=minimal'});
 await chat(chatId,'✅ Nome atualizado para: '+clean,{reply_markup:keyboard()});
}
async function updatePhoto(chatId,id,photo){
 const u=await getUser(id);if(!u)return chat(chatId,'Cadastre sua conta primeiro.');
 const fileId=photo?.at(-1)?.file_id;
 if(!fileId)return chat(chatId,'Envie uma foto, não um arquivo de outro tipo.');
 await db('mc_users?telegram_id=eq.'+id,{method:'PATCH',body:{photo_file_id:fileId},prefer:'return=minimal'});
 await chat(chatId,'✅ Referência da foto atualizada no seu perfil. Seu avatar do Telegram não foi alterado.',{reply_markup:keyboard()});
}
async function disconnect(chatId,id){
 const u=await getUser(id);
 if(!u)return chat(chatId,'Cadastre sua conta primeiro.');
 await db('rpc/mc_disconnect_sessions',{method:'POST',body:{p_telegram_id:id}});
 await chat(chatId,'🛡 DISPOSITIVOS DESCONECTADOS\n\nAs sessões anteriores do painel foram invalidadas. Sua key permanente continua válida e pode ser usada para entrar novamente.',{reply_markup:keyboard()});
}
async function mainAction(action,chatId,id,from){
 if(action==='admin'||action.startsWith('admin_'))return adminAction(action,chatId,id);
 switch(action){
  case 'menu':return intro(chatId,from?.first_name);
  case 'key':return issueKey(chatId,id,from);
  case 'account':return account(chatId,id);
  case 'credits':return credits(chatId,id);
  case 'limits':return limits(chatId,id);
  case 'history':return history(chatId,id);
  case 'recharge':return rechargeMenu(chatId);
  case 'name':return namePrompt(chatId);
  case 'photo':return photoPrompt(chatId);
  case 'disconnect':return disconnect(chatId,id);
  case 'group':{
   const url=process.env.CENTRAL_GROUP_URL;
   return chat(chatId,url?'👥 GRUPO DA CENTRAL\n\n'+url:'O administrador ainda não configurou o convite do grupo.',{reply_markup:keyboard()});
  }
  case 'support':return chat(chatId,'🆘 SUPORTE\n\n'+SUPPORT,{reply_markup:keyboard()});
  default:{
   const m=/^recharge_(100|500|1000)$/.exec(action);
   if(m)return recharge(chatId,id,Number(m[1]));
   return intro(chatId,from?.first_name);
  }
 }
}
function asAction(text){
 const cmd=tidyCommand(text);
 return ({'/start':'start','/menu':'menu','/key':'key','/gerarkey':'key','/conta':'account','/creditos':'credits','/limites':'limits','/historico':'history','/recarga':'recharge','/grupo':'group','/suporte':'support','/nome':'name','/foto':'photo','/dispositivos':'disconnect','/help':'menu','/admin':'admin'})[cmd]||null;
}
export async function POST(req){
 const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
 if(!secret||secret.length<16||req.headers.get('x-telegram-bot-api-secret-token')!==secret||!process.env.TELEGRAM_BOT_TOKEN)return NextResponse.json({error:'Forbidden'},{status:403});
 let update;try{update=await req.json()}catch{return NextResponse.json({ok:true})}
 const callback=update?.callback_query;
 const msg=update?.message;
 const from=callback?.from||msg?.from;
 const id=from?.id,chatId=callback?.message?.chat?.id||msg?.chat?.id;
 if(!Number.isSafeInteger(id)||id<=0||id!==chatId||((msg?.chat?.type||callback?.message?.chat?.type)!=='private'))return NextResponse.json({ok:true});
 try{
  if(callback){
   await telegram('answerCallbackQuery',{callback_query_id:callback.id});
   await mainAction(String(callback.data||''),chatId,id,from);
  }else{
   const text=String(msg.text||''),command=asAction(text);
   if(command==='start'){
    const existing=await getUser(id);
    if(!existing)await issueKey(chatId,id,from);
    else await intro(chatId,from?.first_name);
   }else if(command==='recharge'&&text.trim().split(/\s+/).length>1){
    await recharge(chatId,id,Number(text.trim().split(/\s+/)[1]));
   }else if(command==='name'&&text.trim().length>5){
    await updateName(chatId,id,text.trim().slice(5));
   }else if(command){
    await mainAction(command,chatId,id,from);
   }else if(msg?.reply_to_message?.from?.is_bot){
    const prompt=String(msg.reply_to_message.text||'');
    if(prompt.startsWith('✏️ ATUALIZAR NOME'))await updateName(chatId,id,msg.text);
    else if(prompt.startsWith('🖼 ATUALIZAR FOTO'))await updatePhoto(chatId,id,msg.photo);
    else await intro(chatId,from?.first_name);
   }else await intro(chatId,from?.first_name);
  }
 }catch(e){
  console.error('Telegram webhook action failed',String(e));
  try{await chat(chatId,'Não foi possível executar esta ação. Tente novamente ou chame o suporte: '+SUPPORT)}catch{}
  return NextResponse.json({error:'Temporary processing error'},{status:500});
 }
 return NextResponse.json({ok:true});
}
