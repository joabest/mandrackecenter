import {NextResponse} from 'next/server';
import {validSession} from './lib/auth';
import {verifyMember} from './lib/member-session';
export async function middleware(req){
 const path=req.nextUrl.pathname;
 if(path==='/api/login'||path==='/api/public-config'||path==='/api/telegram/webhook'||path==='/api/member/telegram-auth'||path==='/api/member/browser-ticket'||path==='/manifest.webmanifest'||path==='/mandracke-icon.svg'||path==='/favicon.ico'||path.startsWith('/_next/'))return NextResponse.next();
 const secret=process.env.SESSION_SECRET;
 const admin=await validSession(req.cookies.get('mandracke_session')?.value,secret);
 if(path==='/maintenance'||path==='/telegram'||path==='/entrar')return NextResponse.next();
 if(!admin && !(path==='/login'&&req.nextUrl.searchParams.get('admin')==='1')){
  try{
   const api=process.env.SUPABASE_URL,token=process.env.SUPABASE_SERVICE_ROLE_KEY;
   if(api&&token){
    const headers={apikey:token,...(!token.startsWith('sb_secret_')?{Authorization:'Bearer '+token}:{})};
    const response=await fetch(api.replace(/\/$/,'')+'/rest/v1/mc_settings?key=eq.maintenance&select=value',{headers,cache:'no-store'});
    if(response.ok){
     const rows=await response.json();
     if(rows[0]?.value?.enabled===true){
      if(path.startsWith('/api/'))return NextResponse.json({error:'Sistema em manutenção'},{status:503,headers:{'Retry-After':'300'}});
      return NextResponse.rewrite(new URL('/maintenance',req.url),{status:503});
     }
    }
   }
  }catch(e){console.error('Maintenance check unavailable')}
 }

 if(admin)return NextResponse.next();
 if(path==='/login'||path==='/api/member/login')return NextResponse.next();
 const session=await verifyMember(req.cookies.get('mandracke_member')?.value,secret);
 const isMemberRoute=path==='/member'||path.startsWith('/api/member/')||path==='/api/modules'||path==='/api/ui/preferences';
 let memberOK=false;
 if(session){
  try{
   const token=process.env.SUPABASE_SERVICE_ROLE_KEY;
   const url=process.env.SUPABASE_URL;
   if(token&&url){
    const headers={apikey:token,...(!token.startsWith('sb_secret_')?{Authorization:'Bearer '+token}:{})};
    const response=await fetch(url.replace(/\/$/,'')+'/rest/v1/mc_users?telegram_id=eq.'+session.id+'&select=session_version,enabled',{headers,cache:'no-store'});
    if(response.ok){const rows=await response.json();memberOK=rows.length===1&&rows[0].enabled===true&&Number(rows[0].session_version)===session.version}
   }
  }catch{}
 }
 if(memberOK&&isMemberRoute)return NextResponse.next();
 if(path.startsWith('/api/'))return NextResponse.json({error:'Não autorizado'},{status:401});
 return NextResponse.redirect(new URL(memberOK?'/member':'/login',req.url));
}
export const config={matcher:['/((?!_next/static|_next/image).*)']};
