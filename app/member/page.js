'use client';
import {useEffect,useState} from 'react';
export default function Member(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[credits,setCredits]=useState(100),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 async function refresh(){try{const r=await fetch('/api/member/me',{cache:'no-store'}),x=await r.json();if(!r.ok)throw Error(x.error);setData(x)}catch(e){setError(e.message)}}
 useEffect(()=>{refresh()},[]);
 async function recharge(e){e.preventDefault();setBusy(true);setNotice('');try{const r=await fetch('/api/member/recharge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credits:Number(credits)})}),x=await r.json();if(!r.ok)throw Error(x.error);setNotice(x.message);await refresh()}catch(e){setNotice(e.message)}finally{setBusy(false)}}
 async function logout(){await fetch('/api/member/logout',{method:'POST'});location.replace('/login')}
 return <main className="member-shell">
 <div className="member-top"><div className="logo">⬡ <span>MANDRACKE <b>CENTER</b></span></div><button onClick={logout}>Sair</button></div>
 <div className="eyebrow">MINHA CONTA / TELEGRAM</div><h1>Central do usuário</h1>
 {error&&<div className="error">{error}</div>}
 {!data&&!error&&<p>Carregando conta...</p>}
 {data&&<>
 <div className="member-grid">
 <section className="member-card"><div className="eyebrow">CRÉDITOS DISPONÍVEIS</div><div className="member-val">{data.user.credits.toLocaleString('pt-BR')}</div><p>Saldo atualizado diretamente do banco de dados.</p> <div className="eyebrow">PLANO ATUAL: {data.user.effective_plan}</div>{data.user.promo_pro_until&&new Date(data.user.promo_pro_until)>new Date()&&<p>PRO promocional até {new Date(data.user.promo_pro_until).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}.</p>}</section>
 <section className="member-card"><div className="eyebrow">CONTA VINCULADA</div><h2 style={{marginTop:17}}>{data.user.first_name||data.user.username||'Usuário Telegram'}</h2><p>@{data.user.username||'sem username'}</p><small>ID Telegram: {data.user.telegram_id}</small></section></div>
 <section className="member-card"><h2>Solicitar recarga</h2><p>Solicite a quantidade desejada de créditos. A solicitação ficará pendente até conferência e aprovação do administrador. Nenhum pagamento é realizado automaticamente.</p><form className="member-form" onSubmit={recharge}><input type="number" min="1" max="100000" step="1" value={credits} onChange={e=>setCredits(e.target.value)} aria-label="Quantidade de créditos" required/><button disabled={busy}>{busy?'Enviando...':'Solicitar recarga'}</button></form>{notice&&<div style={{marginTop:12,color:'#c7a3ff'}} role="status">{notice}</div>}</section>
 <section className="member-card"><h2>Solicitações recentes</h2><div className="member-list">{data.recharges?.length?data.recharges.map(x=><div className="member-request" key={x.id}><span>{x.credits_requested} créditos</span><span>{x.status==='pending'?'Pendente':x.status==='approved'?'Aprovada':'Recusada'}</span></div>):<p>Nenhuma recarga solicitada.</p>}</div></section>
 <section className="member-card"><h2>Comunidade e suporte</h2><div className="member-links">{data.group&&<a href={data.group} target="_blank" rel="noopener noreferrer">Entrar no grupo da central ↗</a>}<a href="https://t.me/mandracke" target="_blank" rel="noopener noreferrer">Chamar suporte ↗</a>{data.bot&&<a href={'https://t.me/'+data.bot+'?start=login'} target="_blank" rel="noopener noreferrer">Abrir meu bot ↗</a>}</div>{!data.group&&<p>O administrador ainda não cadastrou o link do grupo da central.</p>}</section>
 </>}
 </main>
}
