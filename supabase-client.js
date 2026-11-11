const CFG = window.RELICARIO_SUPABASE;
function configOK(){return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(CFG.url) && !!CFG.chavePublica && !/^(sb_secret_|service_role)/.test(CFG.chavePublica)}
async function requisicao(path, opts={}){
 const headers={apikey:CFG.chavePublica,Authorization:'Bearer '+(opts.token||CFG.chavePublica),...(opts.headers||{})};
 const response=await fetch(CFG.url+path,{...opts,headers});
 if(!response.ok){let msg;try{const e=await response.json();msg=e.message||e.msg||e.error_description||e.error}catch(_){};throw new Error(msg || 'Erro ao comunicar com o servidor.');}
 if(response.status===204)return null;const text=await response.text();return text ? JSON.parse(text) : null;
}
