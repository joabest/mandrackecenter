import {
 LayoutDashboard, Wallet, Users, Send, FileSearch, ScanText, ListFilter,
 CreditCard, MapPin, IdCard, Braces, ShieldCheck, ShieldAlert, ShieldQuestion,
 ShoppingBag, Pill, UserRound, SlidersHorizontal, Boxes
} from 'lucide-react';

// Ícones específicos por função — compartilhados entre a navegação do membro e do admin.
export const moduleIcons = Object.freeze({
 dashboard:LayoutDashboard,
 credits:Wallet,
 users:Users,
 telegram:Send,
 extractor:FileSearch,
 formatcc:ScanText,
 formatlogin:ListFilter,
 bin:CreditCard,
 ip:MapPin,
 geradorbr:IdCard,
 geradorgg:Braces,
 zeroauth:ShieldCheck,
 preauth:ShieldAlert,
 zeroauthv2:ShieldQuestion,
 amazon:ShoppingBag,
 drogasil:Pill,
 profile:UserRound,
 settings:SlidersHorizontal
});
export function iconForModule(id){return moduleIcons[id]||Boxes}
