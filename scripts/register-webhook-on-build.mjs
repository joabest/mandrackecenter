const token=process.env.TELEGRAM_BOT_TOKEN;
const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
const url='https://painel-beige-tau.vercel.app/api/telegram/webhook';
if(process.env.VERCEL_ENV!=='production'){
 console.log('Telegram webhook: skipped (not production)');
}else if(!token||!secret||secret.length<16){
 console.log('Telegram webhook: missing token or webhook secret');
}else{
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  let resp;
  try{resp=await fetch('https://api.telegram.org/bot'+token+'/setWebhook',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({url,secret_token:secret,allowed_updates:['message'],drop_pending_updates:false}),
   signal:controller.signal
  });}finally{clearTimeout(timeout)}
  const result=await resp.json();
  if(!resp.ok||!result.ok)console.warn('Telegram webhook: setup failed; verify token and network');
  else {
   console.log('Telegram webhook: registered for production');
   const commands=[
    {command:'start',description:'Abrir menu principal'},
    {command:'key',description:'Gerar ou substituir key permanente'},
    {command:'conta',description:'Consultar meu plano e conta'},
    {command:'creditos',description:'Consultar saldo de créditos'},
    {command:'limites',description:'Consultar plano e limites'},
    {command:'historico',description:'Consultar recargas anteriores'},
    {command:'recarga',description:'Solicitar recarga de créditos'},
    {command:'nome',description:'Atualizar nome do painel'},
    {command:'foto',description:'Atualizar foto do painel'},
    {command:'dispositivos',description:'Desconectar sessões do painel'},
    {command:'grupo',description:'Grupo da central'},
    {command:'suporte',description:'Falar com suporte'}
   ];
   try{
    const c=await fetch('https://api.telegram.org/bot'+token+'/setMyCommands',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({commands,scope:{type:'all_private_chats'}}),
     signal:AbortSignal.timeout(8000)
    });
    const result=await c.json();
    console.log(result.ok?'Telegram: commands registered':'Telegram: command registration failed');
   }catch{console.warn('Telegram: command registration unavailable')}
  }
 }catch(e){console.warn('Telegram webhook: setup unavailable; use the administrative setup action')}
}
