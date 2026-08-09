/* =========================================================
   CAMADA DE DADOS
   ---------------------------------------------------------
   Este arquivo é a ÚNICA fonte de fotos e galerias usada
   pelo site. Hoje ele lê de dados mockados (abaixo) e do
   localStorage (para simular um "banco de dados" simples
   feito pela área administrativa).

   >>> QUANDO FOR CONECTAR O GOOGLE DRIVE <<<
   Basta reescrever as funções da seção "PROVEDOR DE FOTOS"
   para buscar de uma API (ex: /api/drive-photos?galleryId=..)
   em vez de olhar PHOTOS_MOCK. Nenhuma outra tela precisa
   mudar, porque todas chamam apenas PhotoProvider.getPhotos().
   ========================================================= */

/* ---------- CONFIGURAÇÃO GERAL (edite aqui) ---------- */
const STUDIO_CONFIG = {
  studioName: "MPS Photography",            // <-- nome da fotógrafa / estúdio
  studioTagline: "ensaios & retratos",
  logoInitials: "MPS",                      // usado enquanto não há logo em imagem
  whatsappNumber: "5511914746140"           // número que RECEBE as seleções das clientes — formato: 55 + DDD + número, só dígitos
};

/* ---------- FOTOS DE EXEMPLO (mock) ----------
   Troque as URLs abaixo pelas fotos reais de teste.
   Cada foto segue este formato:
   { id, nome, url, numero }
------------------------------------------------- */
const PHOTOS_MOCK = Array.from({ length: 60 }).map((_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    id: n,
    nome: `IMG_${n}.jpg`,
    url: `https://picsum.photos/seed/ensaio-${n}/520/640`,
    numero: n
  };
});

/* ---------- GALERIAS DE EXEMPLO (mock) ----------
   Isto simula os cadastros que a fotógrafa faria na
   área administrativa. Ficam também salvos no
   localStorage para que o admin consiga criar/editar.
--------------------------------------------------- */
const GALLERIES_SEED = [
  {
    id: "gal-maria-gestante",
    clienteNome: "Maria Fernandes",
    ensaioNome: "Ensaio Gestante",
    data: "2026-07-18",
    senha: "maria2026",
    limiteFotos: 20,
    valorPacote: "100",         // opcional — valor do pacote base (ex: R$ 100 pelas fotos inclusas)
    valorFotoExtra: "5",        // opcional — valor cobrado por foto além do limite
    status: "ativa",           // ativa | inativa
    expiraEm: "",              // opcional, formato YYYY-MM-DD
    fotoIds: PHOTOS_MOCK.slice(0, 45).map(p => p.id),
    selecao: [],
    selecaoEnviada: false
  },
  {
    id: "gal-joao-familia",
    clienteNome: "João e Carla",
    ensaioNome: "Ensaio de Família",
    data: "2026-06-02",
    senha: "familia123",
    limiteFotos: 15,
    valorPacote: "",
    valorFotoExtra: "",
    status: "ativa",
    expiraEm: "",
    fotoIds: PHOTOS_MOCK.slice(4, 60).map(p => p.id),
    selecao: ["005","008","011","014"],
    selecaoEnviada: true
  }
];

/* =========================================================
   BIBLIOTECA DE FOTOS (localStorage) — editável pelo painel
   ---------------------------------------------------------
   Guarda as fotos reais que a fotógrafa adiciona colando um
   link de imagem pelo painel admin (aba "Fotos do ensaio" de
   cada galeria). Começa com as fotos de exemplo (PHOTOS_MOCK)
   e cresce conforme a fotógrafa adiciona fotos reais.
   ========================================================= */
const PhotoLibrary = {
  KEY: "fotoalbum_photo_library",

  _read() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) {
      localStorage.setItem(this.KEY, JSON.stringify(PHOTOS_MOCK));
      return structuredClone(PHOTOS_MOCK);
    }
    try { return JSON.parse(raw); } catch { return structuredClone(PHOTOS_MOCK); }
  },
  _write(list) {
    localStorage.setItem(this.KEY, JSON.stringify(list));
  },
  getAll() {
    return this._read();
  },
  add(url) {
    const list = this._read();
    let n = list.length + 1;
    let id = String(n).padStart(3, "0");
    while (list.some(p => p.id === id)) { n++; id = String(n).padStart(3, "0"); }
    const photo = { id, nome: `foto-${id}.jpg`, url: url.trim(), numero: id };
    list.push(photo);
    this._write(list);
    return photo;
  },
  remove(id) {
    const list = this._read().filter(p => p.id !== id);
    this._write(list);
  }
};

/* =========================================================
   ARMAZENAMENTO (localStorage) — simula o "banco de dados"
   ========================================================= */
const Store = {
  KEY: "fotoalbum_galerias",

  _read() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) {
      localStorage.setItem(this.KEY, JSON.stringify(GALLERIES_SEED));
      return structuredClone(GALLERIES_SEED);
    }
    try { return JSON.parse(raw); } catch { return structuredClone(GALLERIES_SEED); }
  },
  _write(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },
  getAll() {
    return this._read();
  },
  getById(id) {
    return this._read().find(g => g.id === id) || null;
  },
  save(gallery) {
    const all = this._read();
    const idx = all.findIndex(g => g.id === gallery.id);
    if (idx >= 0) all[idx] = gallery; else all.push(gallery);
    this._write(all);
    return gallery;
  },
  remove(id) {
    const all = this._read().filter(g => g.id !== id);
    this._write(all);
  },
  reset() {
    this._write(structuredClone(GALLERIES_SEED));
  }
};

/* =========================================================
   PROVEDOR DE FOTOS
   Troque o corpo de getPhotos() por uma chamada real ao
   Google Drive quando estiver pronto. Todo o resto do site
   continua funcionando sem alterações.
   ========================================================= */
const PhotoProvider = {
  getAllPhotos() {
    return PhotoLibrary.getAll();
  },
  getPhotos(fotoIds) {
    const byId = Object.fromEntries(PhotoLibrary.getAll().map(p => [p.id, p]));
    return fotoIds.map(id => byId[id]).filter(Boolean);
  }
};

function slugify(str) {
  return str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
}
