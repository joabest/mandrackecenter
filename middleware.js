import {NextResponse} from 'next/server';
import {validSession} from './lib/auth';
import {verifyMember} from './lib/member-session';
export async function middleware(req){
 const path=req.nextUrl.pathname;
 if(path==='/login'||path==='/api/login'||path==='/api/member/login'||path==='/api/public-config'||path==='/api/telegram/webhook'||path==='/manifest.webmanifest'||path==='/mandracke-icon.svg'||path==='/favicon.ico'||path.startsWith('/_next/'))return NextResponse.next();
 const secret=process.env.SESSION_SECRET;
 const admin=await validSession(req.cookies.get('mandracke_session')?.value,secret);
 if(admin)return NextResponse.next();
 const id=await verifyMember(req.cookies.get('mandracke_member')?.value,secret);
 const isMemberRoute=path==='/member'||path.startsWith('/api/member/');
 if(id&&isMemberRoute)return NextResponse.next();
 if(path.startsWith('/api/'))return NextResponse.json({error:'Não autorizado'},{status:401});
 return NextResponse.redirect(new URL(id?'/member':'/login',req.url));
}
export const config={matcher:['/((?!_next/static|_next/image).*)']};
