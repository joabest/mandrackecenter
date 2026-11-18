import {NextResponse} from 'next/server';
import {validSession} from './lib/auth';
export async function middleware(req) {
 const path=req.nextUrl.pathname;
 if(path==='/login'||path==='/api/login'||path.startsWith('/_next/')||path==='/favicon.ico')return NextResponse.next();
 const secret=process.env.SESSION_SECRET;
 const ok=await validSession(req.cookies.get('mandracke_session')?.value,secret);
 if(!ok){
  if(path.startsWith('/api/'))return NextResponse.json({error:'Não autorizado'},{status:401});
  return NextResponse.redirect(new URL('/login',req.url));
 }
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image).*)']};
