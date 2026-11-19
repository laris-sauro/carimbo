const $ = seletor => document.querySelector(seletor);

function formatarData(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

// Cria o cartão "polaroid" de uma memória
function criarCard(m) {
  const a = document.createElement('a');
  a.className = 'polaroid';
  a.href = `detalhe.html?id=${m.id}`;

  if (m.foto) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(m.foto);
    img.alt = m.titulo;
    a.appendChild(img);
  } else {
    const sem = document.createElement('div');
    sem.className = 'sem-foto';
    sem.textContent = '📷';
    a.appendChild(sem);
  }

  const legenda = document.createElement('div');
  legenda.className = 'legenda';
  legenda.textContent = (m.favorita ? '★ ' : '') + m.titulo;
  a.appendChild(legenda);

  const data = document.createElement('div');
  data.className = 'carimbo';
  data.textContent = formatarData(m.data);
  a.appendChild(data);

  return a;
}

function renderizar(container, lista, msgVazia) {
  container.textContent = '';
  if (lista.length === 0) {
    const p = document.createElement('p');
    p.className = 'vazio nota';
    p.textContent = msgVazia;
    container.appendChild(p);
    return;
  }
  lista.forEach(m => container.appendChild(criarCard(m)));
}


function redimensionar(arquivo, max = 1280) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const esc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc);
      c.height = Math.round(img.height * esc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
    };
    img.onerror = () => resolve(arquivo);
    img.src = url;
  });
}


async function paginaInicio() {
  const nome = await lerPref('nome');
  if (nome) $('.papel.fita h2').textContent = `Bem-vindo, ${nome}!`;
  const lista = await listarMemorias();
  renderizar($('#ultimas'), lista.slice(0, 4), 'Nenhuma memória ainda. Que tal criar a primeira?');
}


function paginaNova() {
  $('#data').value = new Date().toISOString().slice(0, 10);

  $('#foto').addEventListener('change', e => {
    const arq = e.target.files[0];
    const previa = $('#previa');
    if (arq) {
      previa.src = URL.createObjectURL(arq);
      previa.hidden = false;
    } else {
      previa.hidden = true;
    }
  });

  $('#form-memoria').addEventListener('submit', async e => {
    e.preventDefault();
    const arq = $('#foto').files[0];

    const memoria = {
      titulo: $('#titulo').value.trim(),
      data: $('#data').value,
      nota: $('#nota').value.trim(),
      foto: arq ? await redimensionar(arq) : null,
      coords: window.coordsAtuais || null, 
      favorita: false,
      criadaEm: Date.now()
    };

    await salvarMemoria(memoria);
    location.href = 'album.html';
  });
}


async function paginaAlbum() {
  const todas = await listarMemorias();
  const container = $('#lista-memorias');

  const mostrarTodas = () => renderizar(container, todas, 'Seu álbum está vazio por enquanto.');
  const mostrarFavs = () =>
    renderizar(container, todas.filter(m => m.favorita), 'Nenhuma favorita ainda. Abra uma memória e toque em ★.');

  $('#filtro-todas').addEventListener('click', e => { e.preventDefault(); mostrarTodas(); });
  $('#filtro-fav').addEventListener('click', e => { e.preventDefault(); mostrarFavs(); });
  mostrarTodas();
}


async function paginaDetalhe() {
  const id = Number(new URLSearchParams(location.search).get('id'));
  const area = $('#memoria');
  let m = id ? await buscarMemoria(id) : null;

  if (!m) {
    area.textContent = 'Memória não encontrada.';
    $('#btn-favoritar').hidden = true;
    $('#btn-excluir').hidden = true;
    return;
  }

  area.textContent = '';

  if (m.foto) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(m.foto);
    img.alt = m.titulo;
    img.className = 'foto-detalhe';
    area.appendChild(img);
  }

  const h2 = document.createElement('h2');
  h2.textContent = m.titulo;
  area.appendChild(h2);

  const data = document.createElement('p');
  data.className = 'carimbo';
  data.textContent = formatarData(m.data);
  area.appendChild(data);

  if (m.nota) {
    const nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = m.nota;
    area.appendChild(nota);
  }

  if (m.coords) {
    const loc = document.createElement('p');
    loc.className = 'carimbo';
    loc.textContent = `📍 ${m.coords.lat.toFixed(5)}, ${m.coords.lng.toFixed(5)} `;
    const link = document.createElement('a');
    link.href = `https://www.openstreetmap.org/?mlat=${m.coords.lat}&mlon=${m.coords.lng}#map=16/${m.coords.lat}/${m.coords.lng}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '(ver no mapa)';
    loc.appendChild(link);
    area.appendChild(loc);
  }

  const btnFav = $('#btn-favoritar');
  const atualizarBotao = () => {
    btnFav.textContent = m.favorita ? '★ Favorita (remover)' : '☆ Favoritar';
  };
  atualizarBotao();

  btnFav.addEventListener('click', async () => {
    m.favorita = !m.favorita;
    await atualizarMemoria(m);
    atualizarBotao();
  });

  $('#btn-excluir').addEventListener('click', async () => {
    if (confirm('Excluir esta memória?')) {
      await excluirMemoria(m.id);
      location.href = 'album.html';
    }
  });
}


async function paginaConfig() {
  $('#nome').value = await lerPref('nome', '');
  $('#form-perfil').addEventListener('submit', async e => {
    e.preventDefault();
    await salvarPref('nome', $('#nome').value.trim());
    alert('Perfil salvo!');
  });
}


if ($('#ultimas'))        paginaInicio();
if ($('#form-memoria'))   paginaNova();
if ($('#lista-memorias')) paginaAlbum();
if ($('#memoria'))        paginaDetalhe();
if ($('#form-perfil'))    paginaConfig();