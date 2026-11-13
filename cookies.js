(() => {
  const nome = 'relicario_aviso_cookies';
  if (document.cookie.split(';').some(item => item.trim().startsWith(nome + '='))) return;
  const aviso = document.createElement('section');
  aviso.className = 'cookie-notice';
  aviso.setAttribute('aria-label', 'Aviso de privacidade');
  aviso.innerHTML = '<div><strong>Sua privacidade</strong><p>Usamos o armazenamento do navegador para lembrar seu carrinho e o tema escolhido. Um cookie também guarda que você leu este aviso.</p></div><button type="button">Entendi</button>';
  aviso.querySelector('button').addEventListener('click', () => {
    const seguro = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = nome + '=1; Max-Age=31536000; Path=/; SameSite=Lax' + seguro;
    aviso.remove();
  });
  document.body.append(aviso);
})();
