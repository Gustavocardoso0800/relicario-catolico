const $ = (selector) => document.querySelector(selector);
const grid = $('#product-grid');
const catalogoOnline = typeof configOK === 'function' && configOK();
if (catalogoOnline) PRODUCTS = [];
let catalogoCarregado = !catalogoOnline;
let category = new URLSearchParams(location.search).get('categoria') || 'Todos';
let search = '';
let cart = {};
let numeroLoja = '5591992247847';
try { const saved = JSON.parse(localStorage.getItem('relicario-carrinho') || '{}'); cart = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}; } catch (_) { cart = {}; }
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const stock = p => Number.isInteger(p.estoque) && p.estoque >= 0 ? p.estoque : null;
const soldOut = p => !!p.vendido || stock(p) === 0;
const price = (value) => value == null ? 'Consultar preço' : value.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalized = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function renderProducts() {
  const list = PRODUCTS.filter(p => (category === 'Todos' || p.categoria === category) && normalized([p.nome,p.autor,p.categoria].join(' ')).includes(normalized(search)));
  grid.innerHTML = list.map(p => `<article class="product-card"><div class="product-image"><span class="badge">${escapeHtml(soldOut(p) ? 'Esgotado' : (p.etiqueta || p.categoria))}</span><button class="product-view-image" data-view="${escapeHtml(p.id)}" aria-label="Visualizar ${escapeHtml(p.nome)}">${(p.imagens?.[0] || p.imagem) ? `<img src="${escapeHtml(p.imagens?.[0] || p.imagem)}" alt="${escapeHtml(p.nome)}">` : `<div class="image-placeholder" aria-label="Foto do produto ainda não disponível"><span>✝</span><small>FOTO EM BREVE</small></div>`}</button></div><div class="product-info"><p class="product-category">${escapeHtml(p.categoria)}</p><h3><button class="product-view-title" data-view="${escapeHtml(p.id)}">${escapeHtml(p.nome)}</button></h3><p class="author">${escapeHtml(p.autor)}</p><p class="product-detail">${escapeHtml(p.detalhe)}</p>${stock(p) !== null && !soldOut(p) ? `<p class="stock-info">${stock(p)} ${stock(p) === 1 ? "unidade disponível" : "unidades disponíveis"}</p>` : ""}<strong class="product-price">${price(p.preco)}</strong><button class="add-button" data-add="${escapeHtml(p.id)}" ${soldOut(p) ? "disabled" : ""}>${soldOut(p) ? "Esgotado" : "Adicionar ao carrinho"} <span>${soldOut(p) ? "" : "+"}</span></button></div></article>`).join('');
  $('#empty-state').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;
}
function saveCart() { try { localStorage.setItem('relicario-carrinho', JSON.stringify(cart)); } catch (_) {} renderCart(); }
function renderCart() {
  const entries = Object.entries(cart).filter(([id,qty]) => byId(id) && !soldOut(byId(id)) && Number.isInteger(qty) && qty > 0).map(([id,qty]) => [id, stock(byId(id)) === null ? qty : Math.min(qty, stock(byId(id)))]);
  cart = Object.fromEntries(entries);
  const count = entries.reduce((n,[,qty]) => n + qty,0);
  $('#cart-count').textContent = count;
  $('#cart-items').innerHTML = entries.length ? entries.map(([id,qty]) => {const p = byId(id); return `<div class="cart-item"><div class="cart-thumb">${(p.imagens?.[0] || p.imagem) ? `<img src="${escapeHtml(p.imagens?.[0] || p.imagem)}" alt="">` : "✝"}</div><div class="cart-item-info"><strong>${escapeHtml(p.nome)}</strong><small>${escapeHtml(p.autor)}</small><b>${price(p.preco)}</b><div class="quantity"><button data-change="${escapeHtml(id)}" data-delta="-1" aria-label="Diminuir quantidade">−</button><span>${qty}</span><button data-change="${escapeHtml(id)}" data-delta="1" aria-label="Aumentar quantidade">+</button><button class="remove" data-remove="${escapeHtml(id)}">Remover</button></div></div></div>`}).join('') : '<div class="cart-empty"><span>✧</span><h3>Seu carrinho está vazio</h3><p>Escolha um item do catálogo para começar.</p></div>';
  const lines = entries.map(([id,qty]) => { const p=byId(id); return `• ${qty}x ${p.nome}${p.preco == null ? ' (preço a consultar)' : ` (${price(p.preco)} cada)`}`; });
  const knownTotal = entries.reduce((n,[id,qty]) => n + (byId(id).preco || 0)*qty,0);
  const hasUnknown = entries.some(([id]) => byId(id).preco == null);
  $('#cart-total').textContent = !entries.length ? price(0) : hasUnknown ? (knownTotal ? price(knownTotal) + ' + a consultar' : 'A consultar') : price(knownTotal);
  $('#total-note').textContent = hasUnknown ? 'Há produtos com preço a consultar. Confirme valores e entrega no WhatsApp.' : 'Entrega e disponibilidade são confirmadas no WhatsApp.';
  $('#clear-cart').disabled = !entries.length;
  const totalLine = entries.length && !hasUnknown ? `\nTotal dos produtos: ${price(knownTotal)}\n` : '';
  const message = `Olá! Gostaria de fazer um pedido no Relicário Católico:\n\n${lines.join('\n')}${totalLine}\nPoderia confirmar a disponibilidade, os valores e a entrega em Breves?`;
  const checkout = $('#checkout');
  checkout.href = entries.length ? `https://wa.me/${numeroLoja}?text=${encodeURIComponent(message)}` : '#';
  checkout.classList.toggle('disabled', !entries.length);
  checkout.setAttribute('aria-disabled', String(!entries.length));
}
function setDrawer(open) { $('#drawer').classList.toggle('open',open); $('#drawer').inert = !open; $('#drawer').setAttribute('aria-hidden',String(!open)); $('#overlay').hidden=!open; document.body.classList.toggle('drawer-open',open); if(open) $('#cart-close').focus(); else $('#cart-open').focus(); }
document.addEventListener('click', e => {
  const view=e.target.closest('[data-view]'); if(view){const p=byId(view.dataset.view);if(p) abrirProduto(p,view);}
  const add=e.target.closest('[data-add]'); if(add && byId(add.dataset.add) && !soldOut(byId(add.dataset.add))){const p=byId(add.dataset.add);if(stock(p)!==null && (cart[p.id]||0)>=stock(p)){ $('#toast').textContent='Quantidade disponível atingida';$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);return;}cart[add.dataset.add]=(cart[add.dataset.add]||0)+1;saveCart();$('#toast').textContent='Produto adicionado ao carrinho';$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
  const change=e.target.closest('[data-change]');if(change){const id=change.dataset.change;cart[id]=(cart[id]||0)+Number(change.dataset.delta);if(byId(id) && stock(byId(id))!==null)cart[id]=Math.min(cart[id],stock(byId(id)));if(cart[id]<=0)delete cart[id];saveCart();}
  const remove=e.target.closest('[data-remove]');if(remove){delete cart[remove.dataset.remove];saveCart();}
  const f=e.target.closest('[data-filter], [data-category]');if(f){category=f.dataset.filter||f.dataset.category;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===category));renderProducts();}
});
$('#checkout').addEventListener('click',e=>{if(e.currentTarget.classList.contains('disabled'))e.preventDefault();});
$('#cart-open').addEventListener('click',()=>setDrawer(true));$('#cart-close').addEventListener('click',()=>setDrawer(false));$('#overlay').addEventListener('click',()=>setDrawer(false));document.addEventListener('keydown',e=>{if(!$('#drawer').classList.contains('open')) return; if(e.key==='Escape') { setDrawer(false); return; } if(e.key==='Tab') { const focusable=[...$('#drawer').querySelectorAll('button, a[href]:not([aria-disabled=\"true\"])')]; const first=focusable[0], last=focusable[focusable.length-1]; if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();} }});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();if(document.body.dataset.page!=='catalogo'){location.href='catalogo.html?busca='+encodeURIComponent($('#search').value.trim());return;}search=$('#search').value.trim();category='Todos';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='Todos'));renderProducts();$('#catalogo').scrollIntoView({behavior:'smooth'});});
$('#search').addEventListener('input',e=>{search=e.target.value.trim();renderProducts();});
let current=0;const slides=[...document.querySelectorAll('.slide')],dots=[...document.querySelectorAll('.dot')];function showSlide(index){current=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current));s.querySelectorAll('a').forEach(a=>a.tabIndex=i===current?0:-1)});dots.forEach((d,i)=>{d.classList.toggle('active',i===current);if(i===current)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')});}$('#prev-slide').addEventListener('click',()=>showSlide(current-1));$('#next-slide').addEventListener('click',()=>showSlide(current+1));dots.forEach((d,i)=>d.addEventListener('click',()=>showSlide(i)));if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(!document.hidden && !document.querySelector('.hero:hover') && !document.querySelector('.hero:focus-within'))showSlide(current+1)},6500);
search=new URLSearchParams(location.search).get('busca') || ''; $('#search').value=search; document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===category)); $('#year').textContent=new Date().getFullYear();showSlide(0);renderProducts();if (!catalogoOnline) renderCart(); else { $('#checkout').classList.add('disabled'); $('#checkout').setAttribute('aria-disabled','true'); }

// Configure o endereço do Instagram quando informado.
function aplicarConfiguracoes(d){
  if (/^\d{10,11}$/.test(d.whatsapp || '')) {
    numeroLoja = '55' + d.whatsapp;
    document.querySelectorAll('a[href^="https://wa.me/"]:not(#checkout)').forEach(a=>{a.href='https://wa.me/'+numeroLoja;});
    const tel=document.querySelector('.footer-inner a[href^="https://wa.me/"]');
    if(tel){const n=d.whatsapp;tel.textContent='('+n.slice(0,2)+') '+n.slice(2,-4)+'-'+n.slice(-4);}
    if (catalogoCarregado) renderCart();
  }
  if (/^[A-Za-z0-9._]{1,30}$/.test(d.instagram || '')) document.querySelectorAll('.instagram-link').forEach(a=>{a.href='https://www.instagram.com/'+d.instagram+'/';a.hidden=false;});
  if (d.titulo) document.querySelector('.slide-one h1').textContent=d.titulo;
  if (d.subtitulo) document.querySelector('.slide-one .hero-copy > p:not(.eyebrow)').textContent=d.subtitulo;
  if (typeof d.destaque1 === 'string') document.querySelector('.slide-one .eyebrow').textContent=d.destaque1;
  if (typeof d.destaque2 === 'string') document.querySelector('.slide-two .eyebrow').textContent=d.destaque2;
  if (d.titulo2) document.querySelector('.slide-two h2').textContent=d.titulo2;
  if (d.subtitulo2) document.querySelector('.slide-two .hero-copy > p:not(.eyebrow)').textContent=d.subtitulo2;
  for (const [seletor,chave] of [['.slide-one','imagem1'],['.slide-two','imagem2']]) {
    const slide=document.querySelector(seletor);let imagem='';
    try {const url=new URL(d[chave]);if(url.origin===CFG.url && url.pathname.startsWith('/storage/v1/object/public/produtos/'))imagem=url.href;}catch(_){}
    slide.classList.toggle('has-banner-image',!!imagem);
    if(imagem) slide.style.backgroundImage='linear-gradient(90deg, rgba(40,13,18,.87), rgba(40,13,18,.28)), url('+JSON.stringify(imagem)+')';
    else slide.style.removeProperty('background-image');
  }
  if (d.sobre) document.querySelector('.story p:not(.eyebrow)').textContent=d.sobre;
}
if (catalogoOnline) requisicao('/rest/v1/configuracoes_loja?id=eq.1&select=*').then(rows=>{if(rows[0])aplicarConfiguracoes(rows[0]);}).catch(()=>{});
const themeButton = $('#theme-toggle');
let theme; try { theme=localStorage.getItem('relicario-tema'); } catch (_) {}
function applyTheme(value){document.documentElement.dataset.theme=value;themeButton.textContent=value==='dark'?'☀':'☾';themeButton.setAttribute('aria-label',value==='dark'?'Ativar modo claro':'Ativar modo escuro');}
applyTheme(theme === 'dark' ? 'dark' : 'light');
themeButton.addEventListener('click',()=>{let next=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem('relicario-tema',next)}catch(_) {}});
$('#clear-cart').addEventListener('click',()=>{cart={};saveCart();});

if (catalogoOnline) { requisicao('/rest/v1/produtos?select=*&order=nome.asc').then(rows=>{PRODUCTS=rows;catalogoCarregado=true;renderProducts();renderCart();}).catch(()=>{PRODUCTS=[];renderProducts();renderCart();$('#empty-state').textContent='Não foi possível carregar o catálogo. Tente novamente mais tarde.';}); }

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
  $('#detail-title').textContent=p.nome;mostrarFoto();dialogo.showModal();
}
$('#detail-close').addEventListener('click',()=>dialogo.close());
$('#detail-prev').addEventListener('click',()=>{fotoAtual=(fotoAtual-1+fotosProduto.length)%fotosProduto.length;mostrarFoto();});
$('#detail-next').addEventListener('click',()=>{fotoAtual=(fotoAtual+1)%fotosProduto.length;mostrarFoto();});
dialogo.addEventListener('click',e=>{if(e.target===dialogo)dialogo.close();});
dialogo.addEventListener('close',()=>{if(origemModal?.isConnected)origemModal.focus();});
dialogo.addEventListener('keydown',e=>{if(fotosProduto.length<2)return;if(e.key==='ArrowLeft'){$('#detail-prev').click();}else if(e.key==='ArrowRight'){$('#detail-next').click();}});
