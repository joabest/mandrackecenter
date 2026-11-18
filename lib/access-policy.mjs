export const adminOnlyModules=new Set(['users','telegram','settings']);
export function effectivePlan({plan='FREE',credits=0,promo_pro_until=null},now=Date.now()){
 const base=plan||'FREE';
 return Number(credits)>0&&base==='FREE'&&promo_pro_until&&Date.parse(promo_pro_until)>now?'PRO':base;
}
export function moduleAccess({moduleId,enabled,credits,isAdmin}){
 if(enabled!==true)return 'off';
 if(isAdmin)return 'available';
 if(adminOnlyModules.has(moduleId))return 'admin_only';
 if(!Number.isFinite(Number(credits))||Number(credits)<=0)return 'no_credits';
 // Existing legacy tools are not mounted for regular members yet.
 return 'not_integrated';
}
