
const CORES = [
  ['#A63A32', '#F3EBDD'], ['#F3EBDD', '#5A3A2A'], ['#D9A23B', '#5A3A2A'],
  ['#6B7A3A', '#F3EBDD'], ['#5C7A99', '#F3EBDD'], ['#5A3A2A', '#F3EBDD']
];
const FONTES = ['Playfair Display', 'Special Elite', 'Caveat', 'Georgia'];

function montarRecorte(el) {
  const texto = el.dataset.texto || el.textContent;
  el.textContent = '';
  [...texto].forEach((letra, i) => {
    const s = document.createElement('span');
    if (letra === ' ') {
      s.className = 'espaco';
    } else {
      const [bg, cor] = CORES[(i * 7 + letra.charCodeAt(0)) % CORES.length];
      s.textContent = letra;
      s.style.background = bg;
      s.style.color = cor;
      s.style.fontFamily = FONTES[(i * 3 + letra.charCodeAt(0)) % FONTES.length];
      s.style.transform = `rotate(${((i * 37) % 9) - 4}deg)`;
    }
    el.appendChild(s);
  });
}
document.querySelectorAll('.recorte').forEach(montarRecorte);

 
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker registrado!'))
    .catch(erro => console.error('Erro ao registrar:', erro));
}