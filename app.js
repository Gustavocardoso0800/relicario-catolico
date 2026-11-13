const $ = (selector) => document.querySelector(selector);
const grid = $('#product-grid');
const catalogoOnline = typeof configOK === 'function' && configOK();
PRODUCTS = [];
let catalogoCarregado = false, gruposResolvidos = false, erroCatalogo = false, erroConfiguracao = false;
let category = new URLSearchParams(location.search).get('categoria') || 'Todos';
let ordemGrupos = ['Roupas','Livros','Terços e escapulários','Imagens','Crucifixos','Outros artigos'];
let nomesGrupos = {};
const nomeGrupo = nome => typeof nomesGrupos[nome]==='string' && nomesGrupos[nome].trim() ? nomesGrupos[nome] : nome;
let search = '';
let cart = {};
let numeroLoja = '5591992247847';
try { const saved = JSON.parse(localStorage.getItem('relicario-carrinho') || '{}'); cart = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}; } catch (_) { cart = {}; }
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const precoFinal = p => p.preco!=null && p.preco_promocional!=null && Number(p.preco_promocional)>=0 && Number(p.preco_promocional)<Number(p.preco) ? Number(p.preco_promocional) : p.preco;
const emPromocao = p => p.preco!=null && p.preco_promocional!=null && Number(p.preco_promocional)>=0 && Number(p.preco_promocional)<Number(p.preco);
const stock = p => Number.isInteger(p.estoque) && p.estoque >= 0 ? p.estoque : null;
const soldOut = p => !!p.vendido || stock(p) === 0;
const categoriaProduto = p => p.categoria === 'Artigos católicos' ? 'Outros artigos' : p.categoria;
const tamanhosProduto = p => p.categoria === 'Roupas' && Array.isArray(p.tamanhos) ? p.tamanhos.filter(t=>typeof t==='string'&&t.trim()) : [];
const chaveCarrinho = (id,tamanho) => tamanho ? id+'::'+encodeURIComponent(tamanho) : id;
function detalheChave(key){const i=key.indexOf('::');if(i<0)return {id:key,tamanho:''};try{return {id:key.slice(0,i),tamanho:decodeURIComponent(key.slice(i+2))}}catch(_){return {id:'',tamanho:''}}}
const quantidadeProduto = id => Object.entries(cart).reduce((n,[key,q])=>n+(detalheChave(key).id===id&&Number.isInteger(q)&&q>0?q:0),0);
function avisar(texto){$('#toast').textContent=texto;$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200)}
const price = (value) => value == null ? 'Consultar preço' : value.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalized = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function resumoDescricao(texto){const frase=String(texto || '').trim().replace(/\s+/g, ' ');if(frase.length<=110)return frase;const corte=frase.slice(0,110);const espaco=corte.lastIndexOf(' ');return corte.slice(0,espaco>50?espaco:110)+'…';}
function atualizarLeiaMais(){document.querySelectorAll('.product-card').forEach(card=>{const texto=card.querySelector('.product-detail'),botao=card.querySelector('.read-more');if(texto&&botao)botao.hidden=botao.dataset.limitado!=='true'&&texto.scrollHeight<=texto.clientHeight+1;});}
window.addEventListener('resize',atualizarLeiaMais);
if(document.fonts?.ready)document.fonts.ready.then(atualizarLeiaMais);
const barraCatalogo=document.querySelector('.catalog-bar');
let filtroMovel=null;
if(barraCatalogo){const grupo=document.createElement('div');grupo.className='mobile-filter';const label=document.createElement('label');label.htmlFor='filtro-grupo-movel';label.textContent='Filtrar por grupo';filtroMovel=document.createElement('select');filtroMovel.id='filtro-grupo-movel';filtroMovel.addEventListener('change',()=>{category=filtroMovel.value;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===category));renderProducts();});grupo.append(label,filtroMovel);barraCatalogo.prepend(grupo);}
function atualizarFiltroMovel(){if(!filtroMovel)return;filtroMovel.replaceChildren();for(const nome of ['Todos',...ordemGrupos]){const o=document.createElement('option');o.value=nome;o.textContent=nome==='Todos'?nome:nomeGrupo(nome);filtroMovel.append(o)}filtroMovel.value=category;}
atualizarFiltroMovel();
const menuNavegacao=document.querySelector('.navigation');
const botaoMenu=document.createElement('button');botaoMenu.type='button';botaoMenu.className='mobile-menu-button';botaoMenu.setAttribute('aria-label','Abrir menu');botaoMenu.setAttribute('aria-expanded','false');botaoMenu.setAttribute('aria-controls','navegacao-principal');botaoMenu.innerHTML='<span></span><span></span><span></span>';menuNavegacao.id='navegacao-principal';document.body.append(botaoMenu);
function fecharMenu(){menuNavegacao.classList.remove('menu-open');botaoMenu.setAttribute('aria-expanded','false');botaoMenu.setAttribute('aria-label','Abrir menu');}
botaoMenu.addEventListener('click',()=>{const aberto=menuNavegacao.classList.toggle('menu-open');botaoMenu.setAttribute('aria-expanded',String(aberto));botaoMenu.setAttribute('aria-label',aberto?'Fechar menu':'Abrir menu');});
document.addEventListener('click',e=>{if(menuNavegacao.classList.contains('menu-open')&&!menuNavegacao.contains(e.target)&&!botaoMenu.contains(e.target))fecharMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuNavegacao.classList.contains('menu-open')){fecharMenu();botaoMenu.focus();}});
window.addEventListener('resize',()=>{if(window.innerWidth>800)fecharMenu();});
function renderProducts() {
  if(!catalogoCarregado || !gruposResolvidos || erroCatalogo || erroConfiguracao){grid.replaceChildren();$('#result-count').textContent='';const estado=$('#empty-state');estado.hidden=false;estado.textContent=(erroCatalogo||erroConfiguracao)?'Não foi possível carregar o catálogo. Atualize a página para tentar novamente.':'Carregando catálogo...';return;}
  $('#empty-state').textContent='Nenhum produto encontrado nesta seleção.';
  const list = PRODUCTS.filter(p => (category === 'Todos' || categoriaProduto(p) === (category==='Artigos católicos'?'Outros artigos':category)) && normalized([p.nome,p.autor,p.categoria].join(' ')).includes(normalized(search))).sort((a,b)=>{const disponibilidade=Number(soldOut(a))-Number(soldOut(b));if(disponibilidade)return disponibilidade;if(category==='Todos'){const ia=ordemGrupos.indexOf(categoriaProduto(a)),ib=ordemGrupos.indexOf(categoriaProduto(b));const grupo=(ia<0?ordemGrupos.length:ia)-(ib<0?ordemGrupos.length:ib);if(grupo)return grupo;}return String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR');});
  grid.innerHTML = list.map(p => `<article class="product-card"><div class="product-image"><span class="badge">${escapeHtml(soldOut(p) ? 'Esgotado' : (p.etiqueta || nomeGrupo(categoriaProduto(p))))}</span><button class="product-view-image" data-view="${escapeHtml(p.id)}" aria-label="Visualizar ${escapeHtml(p.nome)}">${(p.imagens?.[0] || p.imagem) ? `<img src="${escapeHtml(p.imagens?.[0] || p.imagem)}" alt="${escapeHtml(p.nome)}">` : `<div class="image-placeholder" aria-label="Foto do produto ainda não disponível"><span>✝</span><small>FOTO EM BREVE</small></div>`}</button></div><div class="product-info"><p class="product-category">${escapeHtml(nomeGrupo(categoriaProduto(p)))}</p><h3><button class="product-view-title" data-view="${escapeHtml(p.id)}">${escapeHtml(p.nome)}</button></h3><p class="author">${escapeHtml(p.autor)}</p><p class="product-detail">${escapeHtml(resumoDescricao(p.detalhe))}</p>${p.detalhe ? `<button type="button" class="read-more" hidden data-limitado="${String(p.detalhe || '').trim().replace(/\s+/g, ' ').length > 110}" data-view="${escapeHtml(p.id)}" aria-label="Ler descrição completa de ${escapeHtml(p.nome)}">Ler mais</button>` : ""}${stock(p) !== null && !soldOut(p) ? `<p class="stock-info">${stock(p)} ${stock(p) === 1 ? "unidade disponível" : "unidades disponíveis"}</p>` : ""}<div class="product-price">${emPromocao(p) ? `<span class="old-price">De <del>${price(p.preco)}</del></span><strong>Por ${price(precoFinal(p))}</strong>` : `<strong>${price(p.preco)}</strong>`}</div>${tamanhosProduto(p).length ? `<label class="size-label" for="tamanho-${escapeHtml(p.id)}">Tamanho</label><select class="size-select" id="tamanho-${escapeHtml(p.id)}" data-size aria-label="Escolha o tamanho de ${escapeHtml(p.nome)}"><option value="">Selecione o tamanho</option>${tamanhosProduto(p).map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}</select>` : (p.categoria==='Roupas'?'<p class="size-consult">Tamanhos a consultar</p>':'')}${soldOut(p) ? `<button class="add-button" type="button" disabled>Esgotado</button>${p.permitir_encomenda!==false ? `<button class="add-button order-button" type="button" data-order="${escapeHtml(p.id)}">Encomende <span>↗</span></button>` : ""}` : `<button class="add-button" type="button" data-add="${escapeHtml(p.id)}">Adicionar ao carrinho <span>+</span></button>`}</div></article>`).join('');
  requestAnimationFrame(atualizarLeiaMais);
  if (filtroMovel) filtroMovel.value = category;
  $('#empty-state').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;
}
const carrinhoFlutuante = document.createElement('button');
carrinhoFlutuante.type = 'button';
carrinhoFlutuante.className = 'floating-cart';
carrinhoFlutuante.hidden = true;
carrinhoFlutuante.setAttribute('aria-label','Abrir carrinho');
carrinhoFlutuante.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M5 10h8l7 27h34l5-20H20M23 23h28M25 29h24"/><circle cx="26" cy="48" r="4.5"/><circle cx="46" cy="48" r="4.5"/></svg><span class="floating-cart-count" aria-hidden="true"></span>';
carrinhoFlutuante.addEventListener('click', () => setDrawer(true));
document.body.append(carrinhoFlutuante);
function saveCart() { try { localStorage.setItem('relicario-carrinho', JSON.stringify(cart)); } catch (_) {} renderCart(); }
function renderCart() {
  const acumulado={};const entries=[];
  for(const [key,qty] of Object.entries(cart)){const {id,tamanho}=detalheChave(key),p=byId(id);if(!p||soldOut(p)||!Number.isInteger(qty)||qty<=0)continue;const tamanhos=tamanhosProduto(p);if(tamanhos.length&&!tamanhos.includes(tamanho))continue;const limite=stock(p),restante=limite===null?qty:Math.max(0,limite-(acumulado[id]||0));const quantidade=Math.min(qty,restante);if(quantidade>0){acumulado[id]=(acumulado[id]||0)+quantidade;entries.push({key,id,tamanho,qty:quantidade,p})}}
  cart=Object.fromEntries(entries.map(e=>[e.key,e.qty]));const count=entries.reduce((n,e)=>n+e.qty,0);$('#cart-count').textContent=count;carrinhoFlutuante.hidden=count===0;carrinhoFlutuante.querySelector('.floating-cart-count').textContent=count>99?'99+':count;carrinhoFlutuante.setAttribute('aria-label','Abrir carrinho, '+count+' '+(count===1?'item':'itens'));
  $('#cart-items').innerHTML=entries.length?entries.map(({key,tamanho,qty,p})=>`<div class="cart-item"><div class="cart-thumb">${(p.imagens?.[0]||p.imagem)?`<img src="${escapeHtml(p.imagens?.[0]||p.imagem)}" alt="">`:'✝'}</div><div class="cart-item-info"><strong>${escapeHtml(p.nome)}</strong><small>${escapeHtml(p.autor)}${tamanho?` · Tamanho: ${escapeHtml(tamanho)}`:''}</small><b>${price(precoFinal(p))}</b><div class="quantity"><button data-change="${escapeHtml(key)}" data-delta="-1" aria-label="Diminuir quantidade">-</button><span>${qty}</span><button data-change="${escapeHtml(key)}" data-delta="1" aria-label="Aumentar quantidade">+</button><button class="remove" data-remove="${escapeHtml(key)}">Remover</button></div></div></div>`).join(''):'<div class="cart-empty"><span>✧</span><h3>Seu carrinho está vazio</h3><p>Escolha um item do catálogo para começar.</p></div>';
  const lines=entries.map(({qty,tamanho,p})=>`• ${qty}x ${p.nome}${tamanho?` — Tamanho: ${tamanho}`:''}${p.preco==null?' (preço a consultar)':` (${price(precoFinal(p))} cada)`}`);const knownTotal=entries.reduce((n,e)=>n+(precoFinal(e.p)||0)*e.qty,0),hasUnknown=entries.some(e=>e.p.preco==null);$('#cart-total').textContent=!entries.length?price(0):hasUnknown?(knownTotal?price(knownTotal)+' + a consultar':'A consultar'):price(knownTotal);$('#total-note').textContent=hasUnknown?'Há produtos com preço a consultar. Confirme valores e entrega no WhatsApp.':'Entrega e disponibilidade são confirmadas no WhatsApp.';$('#clear-cart').disabled=!entries.length;const totalLine=entries.length&&!hasUnknown?`\nTotal dos produtos: ${price(knownTotal)}\n`:'';const message=`Olá! Gostaria de fazer um pedido no Relicário Católico:\n\n${lines.join('\n')}${totalLine}\nPoderia confirmar a disponibilidade, os valores e a entrega em Breves?`;const checkout=$('#checkout');checkout.href=entries.length?`https://wa.me/${numeroLoja}?text=${encodeURIComponent(message)}`:'#';checkout.classList.toggle('disabled',!entries.length);checkout.setAttribute('aria-disabled',String(!entries.length));
}
function setDrawer(open) { $('#drawer').classList.toggle('open',open); $('#drawer').inert = !open; $('#drawer').setAttribute('aria-hidden',String(!open)); $('#overlay').hidden=!open; document.body.classList.toggle('drawer-open',open); if(open) $('#cart-close').focus(); else $('#cart-open').focus(); }
document.addEventListener('click', e => {
  const view=e.target.closest('[data-view]'); if(view){const p=byId(view.dataset.view);if(p) abrirProduto(p,view);}
  const add=e.target.closest('[data-add], [data-order]');if(add){const p=byId(add.dataset.add||add.dataset.order);if(p){const select=add.closest('.product-card').querySelector('[data-size]'),tamanho=select?select.value:'';if(tamanhosProduto(p).length&&!tamanho){avisar('Selecione o tamanho antes de continuar');select.focus();return}if(add.dataset.order){const mensagem=`Olá! Gostaria de encomendar ${p.nome}${tamanho?` no tamanho ${tamanho}`:''}. Poderia informar a disponibilidade e os valores?`;window.open(`https://wa.me/${numeroLoja}?text=${encodeURIComponent(mensagem)}`,'_blank','noopener');return}if(!soldOut(p)){if(stock(p)!==null&&quantidadeProduto(p.id)>=stock(p)){avisar('Quantidade disponível atingida');return}const chave=chaveCarrinho(p.id,tamanho);cart[chave]=(cart[chave]||0)+1;saveCart();avisar('Produto adicionado ao carrinho')}}}
  const change=e.target.closest('[data-change]');if(change){const key=change.dataset.change,{id}=detalheChave(key),p=byId(id),delta=Number(change.dataset.delta);if(p&&delta>0&&stock(p)!==null&&quantidadeProduto(id)>=stock(p)){avisar('Quantidade disponível atingida');return}cart[key]=(cart[key]||0)+delta;if(cart[key]<=0)delete cart[key];saveCart();}
  const remove=e.target.closest('[data-remove]');if(remove){delete cart[remove.dataset.remove];saveCart();}
  const f=e.target.closest('[data-filter], [data-category]');if(f){category=f.dataset.filter||f.dataset.category;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===category));renderProducts();}
});
$('#checkout').addEventListener('click',e=>{if(e.currentTarget.classList.contains('disabled'))e.preventDefault();});
$('#cart-open').addEventListener('click',()=>setDrawer(true));$('#cart-close').addEventListener('click',()=>setDrawer(false));$('#overlay').addEventListener('click',()=>setDrawer(false));document.addEventListener('keydown',e=>{if(!$('#drawer').classList.contains('open')) return; if(e.key==='Escape') { setDrawer(false); return; } if(e.key==='Tab') { const focusable=[...$('#drawer').querySelectorAll('button, a[href]:not([aria-disabled=\"true\"])')]; const first=focusable[0], last=focusable[focusable.length-1]; if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();} }});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();if(document.body.dataset.page!=='catalogo'){location.href='catalogo.html?busca='+encodeURIComponent($('#search').value.trim());return;}search=$('#search').value.trim();category='Todos';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='Todos'));renderProducts();$('#catalogo').scrollIntoView({behavior:'smooth'});});
$('#search').addEventListener('input',e=>{search=e.target.value.trim();renderProducts();});
let current=0;let slides=[...document.querySelectorAll('.slide')],dots=[...document.querySelectorAll('.dot')];const bannerModelo1=slides[0].cloneNode(true),bannerModelo2=slides[1].cloneNode(true);function showSlide(index){current=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current));s.querySelectorAll('a').forEach(a=>a.tabIndex=i===current?0:-1)});dots.forEach((d,i)=>{d.classList.toggle('active',i===current);if(i===current)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')});}$('#prev-slide').addEventListener('click',()=>showSlide(current-1));$('#next-slide').addEventListener('click',()=>showSlide(current+1));function registrarPontos(){dots.forEach((d,i)=>d.addEventListener('click',()=>showSlide(i)));}registrarPontos();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(!document.hidden && !document.querySelector('.hero:hover') && !document.querySelector('.hero:focus-within'))showSlide(current+1)},6500);
search=new URLSearchParams(location.search).get('busca') || ''; $('#search').value=search; document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===category)); $('#year').textContent=new Date().getFullYear();showSlide(0);renderProducts();$('#checkout').classList.add('disabled');$('#checkout').setAttribute('aria-disabled','true');

// Configure o endereço do Instagram quando informado.
function atualizarGrupos(grupos){if(!Array.isArray(grupos)||!grupos.length)return;const validos=grupos.filter(g=>typeof g==='string'&&g.trim());if(!validos.length)return;ordemGrupos=validos;atualizarFiltroMovel();renderProducts();const nav=document.querySelector('.nav-inner');if(nav){nav.querySelectorAll('a[href^="catalogo.html?categoria="]').forEach(a=>a.remove());const depois=nav.querySelector('a[href="quem-somos.html"]');for(const nome of validos){const a=document.createElement('a');a.href='catalogo.html?categoria='+encodeURIComponent(nome);a.textContent=nomeGrupo(nome);nav.insertBefore(a,depois)}}const filtros=document.querySelector('.filters');if(filtros){filtros.replaceChildren();for(const nome of ['Todos',...validos]){const b=document.createElement('button');b.type='button';b.className='filter'+(category===nome?' active':'');b.dataset.filter=nome;b.textContent=nome==='Todos'?nome:nomeGrupo(nome);filtros.append(b)}}}
function aplicarConfiguracoes(d){
  nomesGrupos=d.nomes_grupos&&typeof d.nomes_grupos==='object'&&!Array.isArray(d.nomes_grupos)?d.nomes_grupos:{};
  atualizarGrupos(Array.isArray(d.grupos)&&d.grupos.length?d.grupos:ordemGrupos);
  if (/^\d{10,11}$/.test(d.whatsapp || '')) {
    numeroLoja = '55' + d.whatsapp;
    document.querySelectorAll('a[href^="https://wa.me/"]:not(#checkout)').forEach(a=>{a.href='https://wa.me/'+numeroLoja;});
    const tel=document.querySelector('.footer-inner a[href^="https://wa.me/"]');
    if(tel){const n=d.whatsapp;tel.textContent='('+n.slice(0,2)+') '+n.slice(2,-4)+'-'+n.slice(-4);}
    if (catalogoCarregado) renderCart();
  }
  if (/^[A-Za-z0-9._]{1,30}$/.test(d.instagram || '')) document.querySelectorAll('.instagram-link').forEach(a=>{a.href='https://www.instagram.com/'+d.instagram+'/';a.hidden=false;});
  if(Array.isArray(d.banners)&&d.banners.length){
    const hero=document.querySelector('.hero'),controles=hero.querySelector('.hero-controls'),pontos=hero.querySelector('.dots');
    const novos=[];pontos.replaceChildren();
    d.banners.forEach((banner,i)=>{const slide=(i===0?bannerModelo1:bannerModelo2).cloneNode(true);const titulo=slide.querySelector('h1, h2'),subtitulo=slide.querySelector('.hero-copy > p:not(.eyebrow)'),destaque=slide.querySelector('.eyebrow');titulo.textContent=String(banner.titulo||'');subtitulo.textContent=String(banner.subtitulo||'');destaque.textContent=String(banner.destaque||'');let imagem='';try{const url=new URL(banner.imagem);if(url.origin===CFG.url&&url.pathname.startsWith('/storage/v1/object/public/produtos/'))imagem=url.href;}catch(_){}slide.classList.toggle('has-banner-image',!!imagem);if(imagem)slide.style.backgroundImage='linear-gradient(90deg, rgba(40,13,18,.87), rgba(40,13,18,.28)), url('+JSON.stringify(imagem)+')';else slide.style.removeProperty('background-image');novos.push(slide);const ponto=document.createElement('button');ponto.className='dot';ponto.type='button';ponto.setAttribute('aria-label','Mostrar banner '+(i+1));pontos.append(ponto)});
    slides.forEach(slide=>slide.remove());novos.forEach(slide=>hero.insertBefore(slide,controles));slides=novos;dots=[...pontos.querySelectorAll('.dot')];$('#prev-slide').hidden=$('#next-slide').hidden=slides.length<2;pontos.hidden=slides.length<2;registrarPontos();showSlide(0);
  } else {
    if (d.titulo) document.querySelector('.slide-one h1').textContent=d.titulo;
    if (d.subtitulo) document.querySelector('.slide-one .hero-copy > p:not(.eyebrow)').textContent=d.subtitulo;
    if (typeof d.destaque1 === 'string') document.querySelector('.slide-one .eyebrow').textContent=d.destaque1;
    if (typeof d.destaque2 === 'string') document.querySelector('.slide-two .eyebrow').textContent=d.destaque2;
    if (d.titulo2) document.querySelector('.slide-two h2').textContent=d.titulo2;
    if (d.subtitulo2) document.querySelector('.slide-two .hero-copy > p:not(.eyebrow)').textContent=d.subtitulo2;
    for(const [seletor,chave] of [['.slide-one','imagem1'],['.slide-two','imagem2']]){const slide=document.querySelector(seletor);let imagem='';try{const url=new URL(d[chave]);if(url.origin===CFG.url&&url.pathname.startsWith('/storage/v1/object/public/produtos/'))imagem=url.href}catch(_){}slide.classList.toggle('has-banner-image',!!imagem);if(imagem)slide.style.backgroundImage='linear-gradient(90deg, rgba(40,13,18,.87), rgba(40,13,18,.28)), url('+JSON.stringify(imagem)+')';}
  }
  if (d.sobre) document.querySelector('.story p:not(.eyebrow)').textContent=d.sobre;
}
const mostrarHero = () => { const hero = document.querySelector('.hero'); if (hero) hero.style.opacity = ''; };
if (catalogoOnline) requisicao('/rest/v1/configuracoes_loja?id=eq.1&select=*').then(rows=>{if(!rows[0])throw new Error('Configurações indisponíveis');aplicarConfiguracoes(rows[0]);gruposResolvidos=true;document.documentElement.classList.add('grupos-prontos');mostrarHero();renderProducts();}).catch(()=>{erroConfiguracao=true;gruposResolvidos=true;renderProducts();}); else {erroConfiguracao=true;gruposResolvidos=true;renderProducts();}
const themeButton = $('#theme-toggle');
let theme; try { theme=localStorage.getItem('relicario-tema'); } catch (_) {}
function applyTheme(value){document.documentElement.dataset.theme=value;themeButton.textContent=value==='dark'?'☀':'☾';themeButton.setAttribute('aria-label',value==='dark'?'Ativar modo claro':'Ativar modo escuro');}
applyTheme(theme === 'dark' ? 'dark' : 'light');
themeButton.addEventListener('click',()=>{let next=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('relicario-tema',next)}catch(_) {}});
$('#clear-cart').addEventListener('click',()=>{cart={};saveCart();});

if (catalogoOnline) { requisicao('/rest/v1/produtos?select=*&order=nome.asc').then(rows=>{PRODUCTS=rows;catalogoCarregado=true;renderProducts();renderCart();}).catch(()=>{erroCatalogo=true;catalogoCarregado=true;renderProducts();}); }

// Visualização ampliada das fotos do produto.
const dialogo = $('#product-dialog');
let fotosProduto = [], fotoAtual = 0, origemModal = null;
function mostrarFoto(){
  const img=$('#detail-image'), vazio=$('#detail-empty');
  img.hidden=fotosProduto.length===0; vazio.hidden=fotosProduto.length>0;
  if(fotosProduto.length){img.src=fotosProduto[fotoAtual];img.alt=$('#detail-title').textContent+' • foto '+(fotoAtual+1);}else img.removeAttribute('src');
  $('#detail-prev').hidden=$('#detail-next').hidden=fotosProduto.length<2;
}
function abrirProduto(p, origem){
  origemModal=origem;fotoAtual=0;fotosProduto=Array.isArray(p.imagens)&&p.imagens.length?p.imagens:(p.imagem?[p.imagem]:[]);
  $('#detail-title').textContent=p.nome;const descricao=$('#detail-description');descricao.textContent=(p.detalhe||'').trim();descricao.hidden=!descricao.textContent;mostrarFoto();dialogo.showModal();
}
$('#detail-close').addEventListener('click',()=>dialogo.close());
$('#detail-prev').addEventListener('click',()=>{fotoAtual=(fotoAtual-1+fotosProduto.length)%fotosProduto.length;mostrarFoto();});
$('#detail-next').addEventListener('click',()=>{fotoAtual=(fotoAtual+1)%fotosProduto.length;mostrarFoto();});
dialogo.addEventListener('click',e=>{if(e.target===dialogo)dialogo.close();});
dialogo.addEventListener('close',()=>{if(origemModal?.isConnected)origemModal.focus();});
dialogo.addEventListener('keydown',e=>{if(fotosProduto.length<2)return;if(e.key==='ArrowLeft'){$('#detail-prev').click();}else if(e.key==='ArrowRight'){$('#detail-next').click();}});
