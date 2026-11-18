'use client';
import {useEffect,useState,useRef} from 'react';
import {LayoutDashboard,Users,Wallet,ReceiptText,History,MessageCircle,Settings,ChevronLeft,ChevronRight,Menu,Search,ArrowUpRight,ExternalLink,RefreshCw,LogOut,Shield,CheckCircle2,Clock3,ShieldCheck,Coins,PanelLeftClose,Pin,EllipsisVertical,UserCircle,ChevronDown} from 'lucide-react';

const navigation=[
 {group:'GERAL',items:[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'profile',label:'Minha conta',icon:Users}]},
 {group:'FINANCEIRO',items:[{id:'credits',label:'Créditos e MC',icon:Wallet},{id:'recharges',label:'Solicitar recarga',icon:ReceiptText},{id:'history',label:'Histórico',icon:History}]},
 {group:'SISTEMA',items:[{id:'support',label:'Suporte',icon:MessageCircle}]}
];
const money=n=>Number(n||0).toLocaleString('pt-BR');
const time=date=>new Date(date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
const label={pending:'Pendente',approved:'Aprovado',rejected:'Recusado'};
function Tile({title,value,icon:Icon,detail}){
 return <div className="rounded-2xl border border-[#322a3a] bg-[#1b1820] p-5 shadow-[0_8px_30px_#00000020]">
  <div className="mb-6 flex items-center justify-between text-xs text-[#a6a1b0]"><span>{title}</span><Icon size={18} className="text-[#a58acb]"/></div>
  <div className="text-3xl font-semibold tracking-tight text-[#f4f0f9]">{value}</div>
  <div className="mt-2 text-xs text-[#918a9b]">{detail}</div>
 </div>
}
export default function Member(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 const [view,setView]=useState('dashboard'),[narrow,setNarrow]=useState(false),[mobile,setMobile]=useState(false);
 const [creditAmount,setCreditAmount]=useState('100'),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [query,setQuery]=useState('');
 const [navOrder,setNavOrder]=useState(Object.fromEntries(navigation.map(g=>[g.group,g.items.map(i=>i.id)])));
 const [navPins,setNavPins]=useState([]),[navMenu,setNavMenu]=useState(null);
 const prefsHydrated=useRef(false);
 useEffect(()=>{
  async function loadPreferences(){
   try{
    const r=await fetch('/api/ui/preferences',{cache:'no-store'});
    if(r.ok){const data=await r.json(),p=data.preferences?.member_sidebar||{};
     if(p.order&&typeof p.order==='object')setNavOrder(o=>({...o,...p.order}));
     if(Array.isArray(p.pins))setNavPins(p.pins);
     if(typeof p.narrow==='boolean')setNarrow(p.narrow);
    }
   }catch(e){console.warn('Preferências não disponíveis')}finally{prefsHydrated.current=true}
  }
  loadPreferences();refresh();
 },[]);
 useEffect(()=>{
  if(!prefsHydrated.current)return;
  const timer=setTimeout(()=>fetch('/api/ui/preferences',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({preferences:{member_sidebar:{order:navOrder,pins:navPins,narrow}}})}).catch(()=>{}),350);
  return()=>clearTimeout(timer);
 },[navOrder,navPins,narrow]);
 async function refresh(){
  try{const r=await fetch('/api/member/me',{cache:'no-store'});const out=await r.json();if(!r.ok)throw Error(out.error||'Falha ao consultar conta');setData(out);setError('')}
  catch(e){setError(e.message)}
 }
 async function recharge(e){
  e.preventDefault();setBusy(true);setNotice('');
  try{
   const amount=Number(creditAmount);
   const r=await fetch('/api/member/recharge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credits:amount})});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível registrar recarga');
   setNotice(d.message);await refresh();
  }catch(e){setNotice(e.message)}finally{setBusy(false)}
 }
 async function logout(){await fetch('/api/member/logout',{method:'POST'});location.replace('/login')}
 const move=id=>{setView(id);setMobile(false);setNotice('')};
 const toggle=()=>setNarrow(n=>!n);
 const u=data?.user||{},isAdmin=Boolean(data?.is_admin);
 const rows=(data?.recharges||[]).filter(r=>!query||String(r.credits_requested).includes(query)||(label[r.status]||r.status).toLowerCase().includes(query.toLowerCase()));
 const groupItems=g=>g.items.slice().sort((a,b)=>{
  const ids=navOrder[g.group]||[],ai=ids.indexOf(a.id),bi=ids.indexOf(b.id);
  return(ai<0?100:ai)-(bi<0?100:bi);
 });
 const reorder=(group,from,to)=>{
  if(!group||from===to)return;
  const g=navigation.find(x=>x.group===group);if(!g)return;
  const ids=groupItems(g).map(x=>x.id);
  if(!ids.includes(from)||!ids.includes(to))return;
  ids.splice(ids.indexOf(to),0,ids.splice(ids.indexOf(from),1)[0]);
  setNavOrder(p=>({...p,[group]:ids}));
 };
 function navItem(item,section,pinned=false){
  const Icon=item.icon;
  return <div key={(pinned?'pin-':'')+item.id}
   draggable={!pinned}
   onDragStart={e=>{e.dataTransfer.setData('text/plain',JSON.stringify({group:section.group,id:item.id}));e.dataTransfer.effectAllowed='move'}}
   onDragOver={e=>e.preventDefault()}
   onDrop={e=>{e.preventDefault();try{const drag=JSON.parse(e.dataTransfer.getData('text/plain'));if(drag.group===section.group)reorder(section.group,drag.id,item.id)}catch{}}}
   className="relative mb-1 flex items-center">
    <button title={item.label} type="button" onClick={()=>move(item.id)}
     className={'flex h-10 w-full items-center gap-3 !rounded-lg !border !py-2 text-left text-[13px] !font-medium transition-colors '+(narrow?'!justify-center !px-2':'!pl-3 !pr-9')+' '+(view===item.id?'!border-[#574364] !bg-[#2a2630] !text-white':'!border-transparent !bg-transparent !text-[#aaa4b0] hover:!bg-[#242028] hover:!text-white')}>
      <Icon size={17} className="shrink-0 text-[#b09bc8]"/>{!narrow&&<span className="truncate">{item.label}</span>}
    </button>
    {!narrow&&<button type="button" aria-label={'Opções '+item.label} onClick={()=>setNavMenu(navMenu===item.id?null:item.id)} className="absolute right-1 !bg-transparent !px-2 !py-2 text-[#9c91a8]"><EllipsisVertical size={16}/></button>}
    {navMenu===item.id&&<div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[#594365] bg-[#271e2e] p-2 shadow-xl"><button className="flex items-center gap-2 !bg-transparent !px-2 !py-2 text-xs" onClick={()=>{setNavPins(x=>x.includes(item.id)?x.filter(k=>k!==item.id):[...x,item.id]);setNavMenu(null)}}><Pin size={14}/>{navPins.includes(item.id)?'Desafixar':'Fixar no topo'}</button></div>}
   </div>;
 }
 const nav=()=><>
  {!!navPins.length&&<section className="mb-7">{!narrow&&<div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#8b789c]">FIXADOS</div>}{navPins.map(id=>{const g=navigation.find(x=>x.items.some(i=>i.id===id)),item=g?.items.find(i=>i.id===id);return item?navItem(item,g,true):null})}</section>}
  {navigation.map(section=><div key={section.group} className="mb-7">
   {!narrow&&<div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#736b7b]">{section.group}</div>}
   {groupItems(section).map(item=>navItem(item,section))}
  </div>)}
 </>;
 return <div className="min-h-screen bg-[#0e0e11] text-[#f0edf4]">
  <div className="flex min-h-screen">
   {mobile&&<button className="fixed inset-0 z-30 !rounded-none !bg-black/70" aria-label="Fechar menu" onClick={()=>setMobile(false)}/>}
   <aside className={(mobile?'translate-x-0':'-translate-x-full md:translate-x-0')+' fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#332c38] bg-[#121115] transition-transform duration-200 md:sticky md:top-0 md:h-screen '+(narrow?'w-[72px]':'w-[242px]')}>
    <div className="flex h-[76px] items-center justify-between border-b border-[#2b262e] px-4">
     <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#6c4a85] bg-[#35233f] font-bold text-[#d0b4e9]">M</div>
      {!narrow&&<div className="min-w-0"><div className="truncate text-[13px] font-semibold tracking-wide">MANDRACKE</div><div className="text-[10px] tracking-[.18em] text-[#a981ca]">CENTER</div></div>}
     </div>
     {!narrow&&<button title="Recolher menu" onClick={toggle} className="!bg-transparent !p-1 text-[#91899a]"><PanelLeftClose size={17}/></button>}
     {narrow&&<button title="Expandir menu" onClick={toggle} className="absolute left-[74px] top-[22px] hidden !bg-[#1d1921] !p-2 text-[#b7a2c8] md:block"><ChevronRight size={15}/></button>}
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-7">{nav()}{isAdmin&&<div className="mt-4 border-t border-[#302a35] pt-4"><a className="flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] text-[#cdb5ec] hover:bg-[#2a2630]" href="/login?admin=1"><Shield size={17}/> {!narrow&&'Administração protegida'}</a></div>}</div>
    <div className="border-t border-[#2e2731] px-3 py-3">
     <button type="button" onClick={logout} title="Sair" className="flex w-full items-center gap-3 !bg-transparent !px-3 !py-2 text-left text-xs !font-medium text-[#a5a0aa] hover:!text-white"><LogOut size={17}/>{!narrow&&'Encerrar sessão'}</button>
     {!narrow&&<div className="mt-3 px-3 text-[10px] text-[#797380]">MANDRACKE CENTER · v1</div>}
    </div>
   </aside>
   <main className="min-w-0 flex-1">
    <header className="flex h-[76px] items-center justify-between border-b border-[#322a37] bg-[#131115] px-5 md:px-9">
     <div className="flex min-w-0 items-center gap-3"><button aria-label="Abrir menu" onClick={()=>setMobile(true)} className="!bg-transparent !p-1 md:hidden"><Menu size={20}/></button><span className="text-[13px] font-medium">Central do usuário</span><span className="text-xs text-[#736b78]">/</span><span className="truncate text-xs text-[#b7a5c8]">{navigation.flatMap(n=>n.items).find(n=>n.id===view)?.label}</span></div>
     <div className="flex items-center gap-3"><span className="hidden rounded-full border border-[#624a74] bg-[#31263c] px-3 py-1 text-[10px] font-bold tracking-[.08em] text-[#dbbfff] sm:block">{u.effective_plan||'FREE'}</span><button aria-label="Atualizar conta" title="Atualizar dados" onClick={refresh} className="!bg-transparent !p-2 text-[#aaa3b2]"><RefreshCw size={17}/></button><div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-[#614d74] bg-[#342443] text-sm font-semibold text-[#d7b9f2]">{u.has_photo?<img src="/api/member/photo" alt="Perfil" className="h-full w-full object-cover"/>:(u.username||u.first_name||'M').slice(0,1).toUpperCase()}</div></div>
    </header>
    <div className="mx-auto max-w-[1280px] space-y-7 px-5 pb-16 pt-9 md:px-9">
     {error&&<div className="rounded-xl border border-rose-900 bg-rose-950/30 p-4 text-sm text-rose-200" role="alert">{error} <a className="ml-2 underline" href="/login">Entrar novamente</a></div>}
     {!data&&!error&&<div className="animate-pulse text-sm text-[#a4a0ab]">Carregando seus dados...</div>}
     {data&&<>
     <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 text-[11px] font-semibold uppercase tracking-[.19em] text-[#a480c8]">MANDRACKE / {view==='dashboard'?'Visão geral':view.toUpperCase()}</div><h1 className="!m-0 text-[28px] font-semibold tracking-tight text-[#f8f4fc] md:text-3xl">{view==='dashboard'?'Seu painel':navigation.flatMap(n=>n.items).find(n=>n.id===view)?.label}</h1><p className="mt-2 text-sm text-[#8f8899]">Bem-vindo, {u.first_name||u.username||'usuário'} · Conta vinculada ao Telegram</p></div><div className="flex items-center gap-2 rounded-full border border-[#3d3843] bg-[#1b1920] px-3 py-2 text-[11px] text-[#c2b9ca]"><span className="h-2 w-2 rounded-full bg-emerald-400"/>Conta ativa</div></div>
     {['dashboard','credits'].includes(view)&&<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
       <Tile title="Créditos disponíveis" value={money(u.credits)} icon={Wallet} detail="Saldo consultado no Supabase"/>
       <Tile title="Plano ativo" value={u.effective_plan} icon={ShieldCheck} detail={u.promo_pro_until&&new Date(u.promo_pro_until)>new Date()?'PRO promocional até '+time(u.promo_pro_until):'Definido pela administração'}/>
       <Tile title="Saldo MC" value={isAdmin?money(u.mc_tokens):'—'} icon={Coins} detail={isAdmin?'1.500 MC renováveis a cada dia':'Disponível apenas para administração'}/>
       <Tile title="Solicitações" value={money((data.recharges||[]).length)} icon={ReceiptText} detail={(data.recharges||[]).filter(r=>r.status==='pending').length+' pendente(s)'}/>
     </div>}
     {view==='dashboard'&&<div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
       <section className="overflow-hidden rounded-2xl border border-[#342c3a] bg-[#19161e]"><div className="flex items-center justify-between border-b border-[#302a34] px-5 py-4"><h2 className="text-[15px] font-semibold">Atividade da conta</h2><button className="!bg-transparent !p-1 text-xs text-[#bf9ae9]" onClick={()=>move('history')}>Ver histórico <ArrowUpRight size={13} className="inline"/></button></div>
       <div className="overflow-x-auto"><table className="w-full text-left text-[12px]"><thead className="bg-[#211d25] text-[#a69dad]"><tr><th className="px-5 py-3 font-medium">Solicitação</th><th className="px-5 py-3 font-medium">Créditos</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Data</th></tr></thead><tbody>{(data.recharges||[]).slice(0,8).map(r=><tr key={r.id} className="border-t border-[#2c2731]"><td className="px-5 py-3 text-[#d3cbd9]">Recarga</td><td className="px-5 py-3">{money(r.credits_requested)}</td><td className="px-5 py-3"><span className={'rounded-full px-2 py-1 text-[10px] '+(r.status==='approved'?'bg-emerald-900/30 text-emerald-300':r.status==='rejected'?'bg-rose-900/30 text-rose-300':'bg-amber-900/30 text-amber-300')}>{label[r.status]||r.status}</span></td><td className="whitespace-nowrap px-5 py-3 text-[#91899b]">{time(r.created_at)}</td></tr>)}{!data.recharges?.length&&<tr><td colSpan={4} className="px-5 py-10 text-center text-[#92899d]">Nenhuma movimentação registrada.</td></tr>}</tbody></table></div></section>
       <section className="rounded-2xl border border-[#342c3a] bg-[#19161e] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-[15px] font-semibold">Acesso e segurança</h2><Shield size={17} className="text-[#a98ad0]"/></div><p className="text-sm leading-6 text-[#afa4b7]">Você está autenticado pelo Telegram ID <b className="text-[#e8ddf2]">{u.telegram_id}</b>.</p><p className="my-4 text-xs text-[#9f96ac]">Origem: {data.source||'Telegram'}. Sua key é permanente até ser revogada. Links temporários de acesso expiram automaticamente.</p><button className="!border !border-[#554064] !bg-[#302538] !px-4 !py-2 text-xs" onClick={()=>move('profile')}>Dados da conta</button></section>
     </div>}
     {view==='profile'&&<section className="max-w-3xl overflow-hidden rounded-2xl border border-[#342c3a] bg-[#19161e]"><div className="border-b border-[#332c3a] p-6"><h2 className="text-[15px] font-semibold">Identificação da conta</h2><p className="mt-1 text-xs text-[#8e8795]">Informações fornecidas pelo Telegram e pelo sistema.</p></div><div className="divide-y divide-[#302a36]">{[['Nome',u.first_name||'Não informado'],['Usuário Telegram','@'+(u.username||'não cadastrado')],['Telegram ID',u.telegram_id],['Origem de acesso',data.source],['Plano',u.effective_plan],['Sessão','Autenticado']].map(([k,v])=><div key={k} className="flex items-center justify-between gap-5 px-6 py-4 text-sm"><span className="text-[#968d9e]">{k}</span><span className="text-right font-medium">{v}</span></div>)}</div></section>}
     {view==='credits'&&<section className="max-w-3xl rounded-2xl border border-[#342c3a] bg-[#19161e] p-6"><h2 className="text-[15px] font-semibold">Informações sobre créditos</h2><p className="mt-3 text-sm leading-6 text-[#a69eaf]">Créditos são unidades internas do serviço. Alterações de saldo dependem das regras e aprovações administrativas. {isAdmin?'Os 1.000 créditos e 1.500 MC do administrador são renovados na primeira consulta após a meia-noite de Brasília.':''}</p><button className="mt-5 !bg-[#493458] !px-4 !py-2 text-xs" onClick={()=>move('recharges')}>Solicitar recarga</button></section>}
     {view==='recharges'&&<section className="max-w-2xl rounded-2xl border border-[#342c3a] bg-[#19161e] p-6"><h2 className="text-[15px] font-semibold">Solicitar créditos</h2><p className="mt-2 text-xs leading-5 text-[#a098ac]">Solicitações precisam de aprovação; nenhum pagamento é processado automaticamente.</p><form className="mt-6 space-y-4" onSubmit={recharge}><label htmlFor="credits" className="block text-xs font-medium text-[#b9afc4]">Quantidade de créditos</label><input id="credits" type="number" min="1" max="100000" value={creditAmount} onChange={e=>setCreditAmount(e.target.value)} required className="w-full !rounded-xl !border !border-[#524059] !bg-[#0f0d13] !px-4 !py-3 !text-sm text-white focus:!border-[#ac81d5]"/><button disabled={busy} className="!rounded-xl !bg-[#684a86] !px-5 !py-3 !text-sm hover:!bg-[#79599a]">{busy?'Registrando...':'Solicitar recarga'}</button></form>{notice&&<p className="mt-4 text-sm text-[#d2b5f3]" role="status">{notice}</p>}</section>}
     {view==='history'&&<section className="overflow-hidden rounded-2xl border border-[#342c3a] bg-[#19161e]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#322b38] p-5"><div><h2 className="text-[15px] font-semibold">Histórico de recargas</h2><p className="mt-1 text-xs text-[#978e9e]">Dados reais do servidor</p></div><div className="flex items-center gap-2 rounded-xl border border-[#3f3646] bg-[#221e27] px-3"><Search size={16} className="text-[#93899e]"/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-40 !bg-transparent !py-3 text-xs !text-white outline-none" placeholder="Buscar..."/></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-[#241f28] text-[#afa2b8]"><th className="px-5 py-4">Data</th><th className="px-5 py-4">Créditos</th><th className="px-5 py-4">Situação</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t border-[#322a37]"><td className="px-5 py-4">{time(r.created_at)}</td><td className="px-5 py-4">{money(r.credits_requested)}</td><td className="px-5 py-4 text-[#c7b4d7]">{label[r.status]||r.status}</td></tr>)}{!rows.length&&<tr><td colSpan={3} className="px-5 py-10 text-center text-[#928a99]">Nenhum registro encontrado.</td></tr>}</tbody></table></div></section>}
     {view==='support'&&<section className="max-w-2xl rounded-2xl border border-[#342c3a] bg-[#19161e] p-6"><MessageCircle size={25} className="text-[#ab86d1]"/><h2 className="mt-4 text-lg font-semibold">Central de suporte</h2><p className="mt-3 text-sm text-[#afa6b9]">Precisa de ajuda com sua conta, key ou recarga? Fale com a equipe pelo Telegram.</p><a href="https://t.me/mandracke" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#62467d] px-4 py-3 text-xs font-medium text-white">Abrir suporte <ExternalLink size={14}/></a></section>}
     </>}
    </div>
   </main>
  </div>
 </div>;
}
