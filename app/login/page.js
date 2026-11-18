'use client';
import {useState} from 'react';
export default function Login(){
 const [pwd,setPwd]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})});const d=await r.json();if(!r.ok)throw Error(d.error||'Erro de autenticação');location.replace('/')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <main className="auth"><div className="login"><div className="logo">⬡ <span>MANDRACKE <b>CENTER</b></span></div><div className="eyebrow">ACESSO RESTRITO</div><h1>Administração</h1><p>Entre com a senha do administrador para visualizar o painel.</p><form onSubmit={submit}><label htmlFor="password">SENHA ADMINISTRATIVA</label><input id="password" type="password" autoComplete="current-password" required minLength={1} value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Digite a senha"/><button disabled={busy}>{busy?'Validando...':'Entrar no painel →'}</button></form>{error&&<div role="alert" className="error">{error}</div>}<small>Proteção de sessão no servidor · Não envie sua senha pelo chat.</small></div></main>
}
