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
  else console.log('Telegram webhook: registered for production');
 }catch(e){console.warn('Telegram webhook: setup unavailable; use the administrative setup action')}
}
