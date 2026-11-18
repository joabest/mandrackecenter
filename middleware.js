import {NextResponse} from 'next/server';
import {validSession} from './lib/auth';
import {verifyMember} from './lib/member-session';
export async function middleware(req){
 const path=req.nextUrl.pathname;
 if(path==='/login'||path==='/api/login'||path==='/api/member/login'||path==='/api/public-config'||path==='/api/telegram/webhook'||path==='/manifest.webmanifest'||path==='/mandracke-icon.svg'||path==='/favicon.ico'||path.startsWith('/_next/'))return NextResponse.next();
 const secret=process.env.SESSION_SECRET;
 const admin=await validSession(req.cookies.get('mandracke_session')?.value,secret);
 if(admin)return NextResponse.next();
 const session=await verifyMember(req.cookies.get('mandracke_member')?.value,secret);
 const isMemberRoute=path==='/member'||path.startsWith('/api/member/');
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
