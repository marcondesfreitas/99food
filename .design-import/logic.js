
const CHECK = ['Status de internet', 'Localização', 'Status do perfil', 'Análise de documentos', 'Status da solicitação', 'Configurações da solicitação'];
const NOMES = [['Marina Alves', 'MA', 4.88, 243], ['Rafael Souza', 'RS', 4.93, 128], ['Cléo Bastos', 'CB', 4.72, 33], ['Diego Nunes', 'DN', 4.81, 205]];

const VERT = [-49, 23, 95, 167, 239, 311, 383, 455];
const HORIZ = [-40, 46, 132, 218, 304, 390, 476, 562, 648, 734, 820, 906];
const CX = 5, CY = 4.5;
const HOME = [167 + CX, 562 + CY];
function vx(i) { return i + CX; }
function hy(i) { return i + CY; }
function diag(x) { return 534 - 0.6333 * (x - 23); }

const METRO_PX = 6;
const ROTAS = [
  {
    origem: 'Avenida Paes de Barros, 1815, Mooca', destino: 'Rua Augusta, 2205, Jardins',
    buscar: [HOME, [vx(167), hy(476)], [vx(95), hy(476)]],
    viagem: [[vx(95), hy(476)], [vx(95), hy(304)], [vx(167), hy(304)], [vx(167), hy(218)], [vx(239), hy(218)], [vx(239), hy(132)], [vx(311), hy(132)]]
  },
  {
    origem: 'Rua da Mooca, 2450, Mooca', destino: 'Avenida Rebouças, 1980, Pinheiros',
    buscar: [HOME, [vx(239), hy(562)], [vx(239), hy(476)]],
    viagem: [[vx(239), hy(476)], [vx(311), hy(476)], [vx(311), hy(304)], [vx(239), hy(304)], [vx(239), hy(218)], [vx(167), hy(218)], [vx(167), hy(132)], [vx(95), hy(132)]]
  },
  {
    origem: 'Avenida Celso Garcia, 3200, Tatuapé', destino: 'Rua Vergueiro, 3185, Vila Mariana',
    buscar: [HOME, [vx(167), hy(648)], [vx(95), hy(648)]],
    viagem: [[vx(95), hy(648)], [vx(95), diag(vx(95))], [vx(167), diag(vx(167))], [vx(239), diag(vx(239))], [vx(311), diag(vx(311))], [vx(311), hy(218)], [vx(383), hy(218)]]
  },
  {
    origem: 'Rua Bresser, 1490, Mooca', destino: 'Praça Silvio Romero, 90, Tatuapé',
    buscar: [HOME, [vx(239), hy(562)], [vx(311), hy(562)]],
    viagem: [[vx(311), hy(562)], [vx(311), hy(476)], [vx(239), hy(476)], [vx(239), hy(390)], [vx(167), hy(390)]]
  },
  {
    origem: 'Rua Javari, 220, Mooca', destino: 'Avenida Sapopemba, 4100, Vila Prudente',
    buscar: [HOME, [vx(95), hy(562)], [vx(95), hy(304)], [vx(23), hy(304)]],
    viagem: [[vx(23), hy(304)], [vx(23), hy(476)], [vx(95), hy(476)], [vx(95), hy(562)], [vx(167), hy(562)], [vx(167), hy(648)], [vx(239), hy(648)], [vx(239), hy(734)], [vx(311), hy(734)], [vx(311), hy(648)], [vx(383), hy(648)]]
  }
];

const CLUSTERS = [
  { id: 'c1', x: -40, y: 104, base: 8.5, cells: [[0, 0], [1, 0], [0, 1]] },
  { id: 'c2', x: 246, y: 268, base: 11, cells: [[0, 0], [0, 1]] },
  { id: 'c3', x: 18, y: 424, base: 6, cells: [[0, 0]] },
  { id: 'c4', x: 168, y: 556, base: 8, cells: [[0, 0], [1, 0]] },
  { id: 'c5', x: -74, y: 688, base: 4.5, cells: [[0, 0]] }
];
const PAX = [[vx(167), hy(218)], [vx(311), hy(390)], [vx(95), hy(734)]];

const CATEGORIAS = {
  MOTO: ['Rota Moto', 'Rota Entrega Moto', 'Rota Moto Promocional', 'Rota Entrega Moto Empresas', 'Rota Food'],
  CARRO: ['Pop', 'Entrega Carro', 'Negocia', 'Pop Expresso'],
  BIKE: ['Rota Bike', 'Rota Entrega Bike']
};
const TIPOS_CONTA = ['Conta corrente', 'Conta-poupança', 'Conta de ganhos', 'Instituição de pagamento'];
const TILES = [['Pagar boleto', true], ['Transferências', false], ['Recarregar celular', false], ['Gift Card', false]];
const PUSH_TELAS = ['prefsolic', 'prefservicos', 'teste', 'central', 'carteira', 'pix', 'perfil', 'config', 'conta', 'veiculos'];
const DUR_BUSCAR = 12, DUR_VIAGEM = 20;

function fmt(n) { return 'R$ ' + n.toFixed(2).replace('.', ','); }
function um(n) { return n.toFixed(1).replace('.', ','); }
function faixaFmt(a, b) { return um(a) + 'X–' + um(b) + 'X'; }

function preparar(pts) {
  const s = [pts[0].slice()];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(d / 12));
    for (let k = 1; k <= n; k++) s.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  const cum = [0];
  for (let i = 1; i < s.length; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  let d = 'M' + s[0][0].toFixed(1) + ' ' + s[0][1].toFixed(1);
  for (let i = 1; i < s.length; i++) d += ' L' + s[i][0].toFixed(1) + ' ' + s[i][1].toFixed(1);
  return { s, cum, d, len: cum[cum.length - 1], vertices: pts.length };
}

function emT(prep, t) {
  const alvo = Math.max(0, Math.min(1, t)) * prep.len;
  const c = prep.cum;
  let lo = 0, hi = c.length - 1;
  while (lo < hi - 1) { const m = (lo + hi) >> 1; if (c[m] <= alvo) lo = m; else hi = m; }
  const seg = c[hi] - c[lo];
  const f = seg === 0 ? 0 : (alvo - c[lo]) / seg;
  const a = prep.s[lo], b = prep.s[hi];
  const ad = prep.s[Math.min(prep.s.length - 1, hi + 2)];
  return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, bearing: Math.atan2(ad[0] - a[0], -(ad[1] - a[1])) * 180 / Math.PI };
}

const TRAJETOS = ROTAS.map(r => {
  const pb = preparar(r.buscar), pv = preparar(r.viagem);
  return {
    origem: r.origem, destino: r.destino, pb, pv,
    km: Math.round(pv.len * METRO_PX / 100) / 10,
    kmOrigem: Math.round(pb.len * METRO_PX / 100) / 10,
    min: Math.max(3, Math.round(pv.len * METRO_PX / 1000 * 2.7)),
    minOrigem: Math.max(2, Math.round(pb.len * METRO_PX / 1000 * 2.7))
  };
});

const QUADRAS = [
  { key: 'parque', left: vx(239) + 5, top: hy(132) + 4.5, w: 67, h: 81, raio: 12, cor: '#CDE3C4' },
  { key: 'agua', left: vx(23) + 5, top: hy(734) + 4.5, w: 67, h: 81, raio: 14, cor: '#BFDDEA' },
  { key: 'q1', left: vx(95) + 18, top: hy(218) + 18, w: 40, h: 48, raio: 6, cor: '#E1DDD5' },
  { key: 'q2', left: vx(311) + 16, top: hy(476) + 20, w: 44, h: 44, raio: 6, cor: '#E1DDD5' },
  { key: 'q3', left: vx(167) + 20, top: hy(648) + 18, w: 38, h: 46, raio: 6, cor: '#E1DDD5' },
  { key: 'q4', left: vx(-49) + 16, top: hy(46) + 18, w: 44, h: 50, raio: 6, cor: '#E1DDD5' },
  { key: 'q5', left: vx(383) + 14, top: hy(304) + 16, w: 46, h: 52, raio: 6, cor: '#E1DDD5' },
  { key: 'parque2', left: vx(311) + 8, top: hy(820) + 6, w: 62, h: 74, raio: 12, cor: '#CDE3C4' }
];
const ROTULOS = [
  { key: 'radial', left: 60, top: diag(60) - 16, txt: 'AV. RADIAL LESTE', cor: '#8d8a84', rot: -32.33 },
  { key: 'paes', left: vx(239) + 14, top: hy(476) - 12, txt: 'AV. PAES DE BARROS', cor: '#8d8a84', rot: 0 },
  { key: 'mooca', left: vx(95) + 14, top: hy(648) - 12, txt: 'R. DA MOOCA', cor: '#8d8a84', rot: 0 },
  { key: 'bresser', left: vx(167) + 12, top: hy(304) + 16, txt: 'R. BRESSER', cor: '#8d8a84', rot: 90 },
  { key: 'parque', left: vx(239) + 12, top: hy(132) + 60, txt: 'PARQUE DA MOOCA', cor: '#7e9a76', rot: 0 },
  { key: 'agua', left: vx(23) + 12, top: hy(734) + 60, txt: 'REPRESA', cor: '#6f92a1', rot: 0 }
];

class Component extends DCLogic {
  state = {
    tela: 'splash', status: 'OFFLINE', drawer: null, oferta: null, fase: 'ativo',
    corrida: null, corridaStatus: null, prog: 0, ang: 0, snap: 1, slide: 0, rotaIdx: 0,
    offX: 0, offY: 0, zoom: 1, arrastando: false, segue: true, chegada: null,
    testeStep: 0, facial: 'verificando', ganhos: 0, dinamico: 0, historico: [],
    estrelas: 0, banner: true, camada: true, chuva: false, evento: false, zonas: [],
    resumo: null, resumoValor: 0, destinoOn: false,
    foto: 'ok', sheetFoto: false, modalVeiculo: false, catsOff: [],
    pushX: 0, pushArrasto: false, pushSeq: 0,
    veiculos: [
      { tipo: 'MOTO', modelo: 'YAMAHA XTZ 250 LANDER', placa: 'SRE5J51 (BEGE)', arte: 'foto moto' },
      { tipo: 'CARRO', modelo: 'Sem modelo', placa: 'GFRH', arte: 'foto carro' },
      { tipo: 'BIKE', modelo: 'Sem modelo', placa: 'TGDY', arte: 'foto bike' }
    ],
    ativo: 0, novoTipo: 'MOTO', novoPlaca: '', novoModelo: '', novoCor: '',
    contaNome: 'Diogo Marques', contaEmail: 'diogo.marques@exemplo.com', contaTel: '+55 11 98432-1170', contaSalvo: false,
    pixNome: '', pixCpf: '', pixConta: '', pixDigito: '', pixAgencia: '', pixTipo: 'Conta corrente'
  };

  timers = [];
  at(fn, ms) { const id = setTimeout(fn, ms); this.timers.push(id); return id; }
  limpar() { this.timers.forEach(clearTimeout); this.timers = []; }

  componentDidMount() {
    this.zonas = this.criarZonas();
    this.tickDemanda();
    this.demandaId = setInterval(() => this.tickDemanda(), 2400);
    this.at(() => this.setState({ tela: 'mapa' }), 1200);
  }
  componentWillUnmount() { this.limpar(); clearInterval(this.demandaId); cancelAnimationFrame(this.loopId); cancelAnimationFrame(this.raf); }

  criarZonas() { return CLUSTERS.map(c => ({ id: c.id, x: c.x, y: c.y, cells: c.cells, base: c.base, pax: 3, mot: 3, mult: 1 })); }

  tickDemanda() {
    const fator = this.props.demandaBase ?? 1.4;
    const chuva = this.state.chuva ? 1.7 : 1;
    this.zonas.forEach((z, i) => {
      const evento = this.state.evento && i === 1 ? 3 : 1;
      z.pax = z.base * fator * chuva * evento * (0.78 + Math.random() * 0.44);
      const quente = z.mult >= 1.4;
      z.mot = Math.max(1, Math.min(14, z.mot + (quente ? 0.8 : -0.35) + (Math.random() - 0.5)));
      const razao = z.pax / (z.mot + 1);
      const novo = Math.min(2.5, Math.round((1 + Math.log2(Math.max(razao, 1)) * 0.5) * 10) / 10);
      z.mult = Math.round((z.mult + (novo - z.mult) * 0.25) * 100) / 100;
    });
    this.setState({ zonas: this.zonas.map(z => ({ ...z })) });
  }

  faixaDe(z) {
    const min = Math.max(1, Math.round(z.mult * 10) / 10);
    return [min, Math.min(2.6, Math.round((min + 0.4) * 10) / 10)];
  }
  zonaQuente() { return this.zonas.reduce((a, b) => (b.mult > a.mult ? b : a), this.zonas[0]) || { mult: 1 }; }

  trajeto() { return TRAJETOS[this.state.rotaIdx] || TRAJETOS[0]; }
  prepAtual() { return this.state.corridaStatus === 'INDO_BUSCAR' ? this.trajeto().pb : this.trajeto().pv; }

  alvoCamera(pt) {
    const z = this.state.zoom;
    return { x: 195 - (195 + (pt.x - 195) * z), y: 380 - (422 + (pt.y - 422) * z) };
  }

  iniciarLoop() {
    cancelAnimationFrame(this.loopId);
    this.ultimo = performance.now();
    const passo = agora => {
      const dt = Math.min(0.05, (agora - this.ultimo) / 1000);
      this.ultimo = agora;
      const s = this.state;
      if (!s.corrida) return;
      const move = (s.corridaStatus === 'INDO_BUSCAR' || s.corridaStatus === 'EM_VIAGEM') && !s.chegada;
      const dur = s.corridaStatus === 'INDO_BUSCAR' ? DUR_BUSCAR : DUR_VIAGEM;
      let prog = s.prog;
      if (move) prog = Math.min(1, prog + dt / dur);
      const pt = emT(this.prepAtual(), prog);
      let ang = s.ang;
      if (move) {
        const d = ((pt.bearing - ang + 540) % 360) - 180;
        ang = ang + d * (1 - Math.exp(-dt / 0.12));
      }
      const patch = { prog, ang };
      if (s.segue) {
        const alvo = this.alvoCamera(pt);
        const k = 1 - Math.exp(-dt / 0.4);
        patch.offX = s.offX + (alvo.x - s.offX) * k;
        patch.offY = s.offY + (alvo.y - s.offY) * k;
      }
      this.setState(patch);
      if (move && prog >= 1) this.chegar();
      this.loopId = requestAnimationFrame(passo);
    };
    this.loopId = requestAnimationFrame(passo);
  }

  chegar() {
    this.setState({ chegada: 'pulse' });
    this.at(() => this.setState({ chegada: 'pin' }), 400);
    this.at(() => this.setState({ chegada: 'botao' }), 800);
  }

  panDown(e) {
    if (this.state.tela !== 'mapa') return;
    this.pan0 = { x: e.clientX, y: e.clientY, px: this.state.offX, py: this.state.offY, t: performance.now() };
    this.vel = { x: 0, y: 0 };
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    this.setState({ arrastando: true, segue: false });
  }
  panMove(e) {
    if (!this.pan0) return;
    const lim = this.state.corrida ? 340 : 180;
    const nx = Math.max(-lim, Math.min(lim, this.pan0.px + (e.clientX - this.pan0.x)));
    const ny = Math.max(-lim, Math.min(lim, this.pan0.py + (e.clientY - this.pan0.y)));
    const dt = Math.max(16, performance.now() - this.pan0.t);
    this.vel = { x: (nx - this.state.offX) / dt, y: (ny - this.state.offY) / dt };
    this.pan0.t = performance.now();
    this.setState({ offX: nx, offY: ny });
  }
  panUp() {
    if (!this.pan0) return;
    this.pan0 = null;
    const v = this.vel || { x: 0, y: 0 };
    const lim = this.state.corrida ? 340 : 180;
    this.setState({
      arrastando: false,
      offX: Math.max(-lim, Math.min(lim, this.state.offX + v.x * 140)),
      offY: Math.max(-lim, Math.min(lim, this.state.offY + v.y * 140))
    });
  }
  zoomDuplo() {
    if (this.state.tela !== 'mapa') return;
    this.setState({ zoom: this.state.zoom >= 1.7 ? 1 : Math.round((this.state.zoom + 0.35) * 100) / 100, arrastando: false });
  }
  recentrar() {
    if (this.state.corrida) return this.setState({ segue: true, arrastando: false });
    this.setState({ offX: 0, offY: 0, zoom: 1, segue: true, arrastando: false });
  }

  bordaDown(e) {
    this.borda0 = e.clientX;
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    this.setState({ pushArrasto: true });
  }
  bordaMove(e) { if (this.borda0 != null) this.setState({ pushX: Math.max(0, e.clientX - this.borda0) }); }
  bordaUp() {
    if (this.borda0 == null) return;
    const soltar = this.state.pushX > 90;
    this.borda0 = null;
    this.setState({ pushArrasto: false, pushX: 0 });
    if (soltar) this.voltarPush();
  }

  push(tela) {
    this.limpar();
    this.setState(s => ({ tela, drawer: null, oferta: null, modalVeiculo: false, sheetFoto: false, pushX: 0, pushArrasto: false, pushSeq: s.pushSeq + 1 }));
    if (tela === 'teste') { this.setState({ testeStep: 0 }); this.rodarTeste(); }
  }
  voltarPush() {
    const t = this.state.tela;
    if (t === 'prefservicos') return this.push('prefsolic');
    if (t === 'carteira' || t === 'pix') return this.push('central');
    if (t === 'config') return this.push('perfil');
    if (t === 'teste') return this.push('prefsolic');
    this.setState({ tela: 'mapa', drawer: null, pushX: 0 });
  }

  irPara(id) {
    this.limpar();
    cancelAnimationFrame(this.loopId);
    const base = { drawer: null, oferta: null, corrida: null, corridaStatus: null, resumo: null, prog: 0, ang: 0, chegada: null, slide: 0, modalVeiculo: false, sheetFoto: false, offX: 0, offY: 0, zoom: 1, segue: true };
    if (PUSH_TELAS.indexOf(id) !== -1) { this.setState(base); return this.push(id); }
    if (id === 'splash') { this.setState({ ...base, tela: 'splash', status: 'OFFLINE' }); this.at(() => this.setState({ tela: 'mapa' }), 1200); return; }
    if (id === 'mapa') return this.setState({ ...base, tela: 'mapa', status: 'OFFLINE' });
    if (id === 'menu') return this.setState({ ...base, tela: 'mapa', drawer: 'esq' });
    if (id === 'facial') { this.setState({ ...base, tela: 'facial', facial: 'verificando' }); return this.rodarFacial(); }
    if (id === 'buscando') { this.setState({ ...base, tela: 'mapa', status: 'BUSCANDO' }); return this.agendarOferta(4500); }
    if (id === 'oferta') return this.setState({ ...base, tela: 'mapa', status: 'BUSCANDO' }, () => this.gerarOferta());
    if (id === 'corrida') return this.setState({ ...base, tela: 'mapa', status: 'BUSCANDO' }, () => { this.gerarOferta(); this.at(() => this.aceitar(), 60); });
    if (id === 'resumo') return this.setState({ ...base, tela: 'mapa', status: 'BUSCANDO' }, () => { this.gerarOferta(); this.at(() => { this.aceitar(); this.at(() => this.finalizar(), 80); }, 60); });
    return this.setState({ ...base, tela: id });
  }

  conectar() {
    this.setState({ status: 'CARREGANDO' });
    this.at(() => { this.setState({ tela: 'facial', facial: 'verificando' }); this.rodarFacial(); }, 1400);
  }
  rodarFacial() {
    this.at(() => {
      this.setState({ facial: 'sucesso' });
      this.at(() => { this.setState({ tela: 'mapa', status: 'BUSCANDO' }); this.agendarOferta(3400); }, 900);
    }, 6100);
  }
  rodarTeste() { for (let i = 1; i <= 6; i++) this.at(() => this.setState({ testeStep: i }), i * 1150); }
  agendarOferta(ms) { this.at(() => { if (this.state.status === 'BUSCANDO' && !this.state.oferta && !this.state.corrida) this.gerarOferta(); }, ms || 4200); }

  gerarOferta() {
    const [nome, iniciais, nota, corridas] = NOMES[Math.floor(Math.random() * NOMES.length)];
    const idx = Math.floor(Math.random() * TRAJETOS.length);
    const t = TRAJETOS[idx];
    const [fmin, fmax] = this.faixaDe(this.zonaQuente());
    const mult = Math.round((fmin + (fmax - fmin) * Math.random()) * 100) / 100;
    const base = Math.round((6.5 + t.km * 1.05 + t.min * 0.32) * 20) / 20;
    const valor = Math.round(base * mult * 20) / 20;
    const dur = this.props.duracaoOferta ?? 15;
    const oferta = {
      nome, iniciais, nota: nota.toFixed(2).replace('.', ','), corridas,
      valor, base, mult, km: t.km, min: t.min, faixa: faixaFmt(fmin, fmax),
      valorFmt: fmt(valor), porKm: fmt(valor / t.km) + '/km',
      dinamicoFmt: fmt(Math.round((valor - base) * 100) / 100),
      tempoOrigem: t.minOrigem + 'min (' + um(t.kmOrigem) + 'km)',
      tempoDestino: t.min + 'min (' + um(t.km) + 'km)',
      enderecoOrigem: t.origem, enderecoDestino: t.destino
    };
    const pt = emT(t.pb, 0);
    this.setState({ oferta, rotaIdx: idx, fase: 'ativo', status: 'BUSCANDO', tela: 'mapa', offX: 0, offY: 0, zoom: 1, segue: true, prog: 0, ang: pt.bearing, chegada: null });
    this.at(() => this.setState({ fase: 'expirando' }), Math.max(500, (dur - 3) * 1000));
    this.at(() => this.recusar(), dur * 1000);
  }

  recusar() { this.limpar(); this.setState({ oferta: null, fase: 'ativo' }); this.agendarOferta(4200); }

  aceitar() {
    this.limpar();
    const o = this.state.oferta;
    if (!o) return;
    const pt = emT(this.trajeto().pb, 0);
    this.setState({ corrida: o, corridaStatus: 'INDO_BUSCAR', oferta: null, prog: 0, snap: 1, ang: pt.bearing, chegada: null, segue: true });
    this.iniciarLoop();
  }

  avancarCorrida() {
    const st = this.state.corridaStatus;
    if (st === 'INDO_BUSCAR') {
      cancelAnimationFrame(this.loopId);
      const pt = emT(this.trajeto().pv, 0);
      this.setState({ corridaStatus: 'AGUARDANDO', prog: 0, chegada: 'botao', ang: pt.bearing });
      this.iniciarLoop();
      return;
    }
    if (st === 'AGUARDANDO') {
      this.setState({ corridaStatus: 'EM_VIAGEM', prog: 0, chegada: null, segue: true });
      this.iniciarLoop();
    }
  }

  finalizar() {
    this.limpar();
    cancelAnimationFrame(this.loopId);
    const o = this.state.corrida || this.state.oferta;
    if (!o) return;
    const dinamico = Math.round((o.valor - o.base) * 100) / 100;
    const hora = 19 + this.state.historico.length % 4;
    const historico = this.state.historico.concat([{
      hora: hora + ':' + String((12 + this.state.historico.length * 9) % 60).padStart(2, '0'),
      endereco: o.enderecoDestino.split(',')[0], valorFmt: fmt(o.valor), valor: o.valor, h: hora
    }]);
    this.setState({
      tela: 'resumo', resumo: { baseFmt: fmt(o.base), dinamicoFmt: fmt(dinamico), faixa: o.faixa, km: um(o.km), min: o.min },
      resumoValor: 0, estrelas: 0, corrida: null, corridaStatus: null, chegada: null,
      ganhos: Math.round((this.state.ganhos + o.valor) * 100) / 100,
      dinamico: Math.round((this.state.dinamico + dinamico) * 100) / 100,
      historico, slide: 0, offX: 0, offY: 0, segue: true
    });
    const inicio = performance.now();
    const anim = () => {
      const t = Math.min(1, (performance.now() - inicio) / 900);
      this.setState({ resumoValor: o.valor * (1 - Math.pow(1 - t, 3)) });
      if (t < 1) this.raf = requestAnimationFrame(anim);
    };
    this.raf = requestAnimationFrame(anim);
  }

  slideDown(e) { this.arrSlide = true; this.x0 = e.clientX; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); }
  slideMove(e) { if (this.arrSlide) this.setState({ slide: Math.max(0, Math.min(302, e.clientX - this.x0)) }); }
  slideUp() {
    this.arrSlide = false;
    if (this.state.slide > 250) { this.setState({ slide: 302 }); this.finalizar(); }
    else this.setState({ slide: 0 });
  }

  renderVals() {
    const s = this.state;
    const oferta = s.oferta, corrida = s.corrida;
    const emCorrida = !!corrida;
    const mapaBase = s.tela === 'mapa';
    const dur = this.props.duracaoOferta ?? 15;
    const [zmin, zmax] = this.zonas.length ? this.faixaDe(this.zonaQuente()) : [1, 1.4];
    const z = s.zoom;
    const t = this.trajeto();
    const andando = emCorrida && (s.corridaStatus === 'INDO_BUSCAR' || s.corridaStatus === 'EM_VIAGEM') && !s.chegada;
    const prep = emCorrida ? this.prepAtual() : t.pb;
    const pt = emCorrida || oferta ? emT(prep, emCorrida ? s.prog : 0) : { x: HOME[0], y: HOME[1], bearing: 0 };
    const totalBase = Math.round((s.ganhos - s.dinamico) * 100) / 100;
    const horas = [16, 17, 18, 19, 20, 21, 22, 23];
    const maxHora = Math.max(1, ...horas.map(h => s.historico.filter(x => x.h === h).reduce((a, b) => a + b.valor, 0)));
    const maxPax = Math.max(0, Math.min(3, this.props.passageirosVisiveis ?? 3));
    const tipoAtivo = (s.veiculos[s.ativo] || s.veiculos[0]).tipo;
    const temFoto = s.foto === 'ok';
    const pushAberto = PUSH_TELAS.indexOf(s.tela) !== -1;
    const claro = s.tela === 'prefsolic' || s.tela === 'prefservicos';

    const hexes = [], pills = [];
    s.zonas.forEach(zn => {
      const [mi, ma] = this.faixaDe(zn);
      if (mi < 1.1) return;
      const cor = mi >= 2.2 ? '#E9635B' : '#EF7D76';
      zn.cells.forEach((c, ci) => {
        hexes.push({ key: zn.id + '_' + ci, left: zn.x + c[0] * 150 + (c[1] % 2 ? 75 : 0), top: zn.y + c[1] * 129, cor, op: 0.55, dur: 3 + (ci % 3) * 0.4 });
      });
      const px = Math.max(10, Math.min(250, zn.x + 18)), py = Math.max(120, zn.y + 22);
      pills.push({ key: zn.id, left: 195 + (px - 195) * z, top: 422 + (py - 422) * z, faixa: faixaFmt(mi, ma) });
    });

    const nav = [
      ['splash', 'Splash'], ['mapa', 'Mapa · malha viária'], ['menu', 'Menu lateral'], ['prefsolic', 'Pref. solicitações ⤢'],
      ['prefservicos', 'Pref. de serviços ⤢'], ['teste', 'Teste de status ⤢'], ['facial', 'Facial oval'], ['buscando', 'Mapa · buscando'],
      ['oferta', 'Oferta · rota nas ruas'], ['corrida', 'Corrida · piloto automático'], ['resumo', 'Resumo'], ['central', 'Central de ganhos ⤢'],
      ['carteira', 'Conta RF ⤢'], ['pix', 'Transferência Pix ⤢'], ['perfil', 'Perfil ⤢'], ['config', 'Config. de perfil ⤢'],
      ['conta', 'Editar conta ⤢'], ['veiculos', 'Veículos ⤢']
    ];
    const telaAtiva = oferta ? 'oferta' : emCorrida ? 'corrida' : s.tela === 'mapa' ? (s.drawer === 'esq' ? 'menu' : s.status === 'BUSCANDO' ? 'buscando' : 'mapa') : s.tela;
    const estadoDebug = oferta ? 'OFERTA_ATIVA' : emCorrida ? s.corridaStatus : s.tela === 'resumo' ? 'RESUMO_GANHOS' : s.tela !== 'mapa' ? s.tela.toUpperCase() : s.status;
    const pixOk = s.pixNome.trim().length > 2 && s.pixCpf.trim().length > 5 && s.pixConta.trim().length > 3;
    const soltou = emCorrida && !s.segue;
    const foraDoCentro = !emCorrida && (Math.abs(s.offX) > 8 || Math.abs(s.offY) > 8 || z !== 1);

    return {
      navItens: nav.map(([id, label], i) => ({
        key: id, n: String(i + 1).padStart(2, '0'), label, ir: () => this.irPara(id),
        bg: telaAtiva === id ? '#2c2a33' : 'transparent', cor: telaAtiva === id ? '#F8D60B' : '#b6b4bb'
      })),
      ruasV: VERT.map(x => ({ key: 'v' + x, left: x })),
      ruasH: HORIZ.map(y => ({ key: 'h' + y, top: y })),
      quadras: QUADRAS, rotulos: ROTULOS,
      hexes, pills,
      passageiros: PAX.slice(0, maxPax).map((p, i) => ({ key: i, left: 195 + (p[0] - 195) * z, top: 422 + (p[1] - 422) * z })),
      hexVisivel: mapaBase && s.camada && !oferta && !emCorrida,
      hexSplash: [{ key: 'a', left: -50, top: 40 }, { key: 'b', left: 120, top: 40 }, { key: 'c', left: 290, top: 40 }, { key: 'd', left: 30, top: 168 }, { key: 'e', left: 200, top: 168 }, { key: 'f', left: -50, top: 296 }, { key: 'g', left: 120, top: 296 }, { key: 'h', left: 290, top: 296 }, { key: 'i', left: 30, top: 424 }, { key: 'j', left: 200, top: 424 }, { key: 'k', left: -50, top: 552 }, { key: 'l', left: 120, top: 552 }, { key: 'm', left: 290, top: 552 }, { key: 'n', left: 30, top: 680 }, { key: 'o', left: 200, top: 680 }],
      carroX: 195 + (pt.x - 195) * z, carroY: 422 + (pt.y - 422) * z,
      anguloMarcador: Math.round(s.ang * 10) / 10,
      animMarcador: s.chegada === 'pulse' ? 'chegou 400ms ease-out both' : 'none',
      haloVisivel: !andando || s.corridaStatus === 'AGUARDANDO',
      rotaPath: prep.d,
      dashArray: prep.len.toFixed(1) + ' ' + prep.len.toFixed(1),
      dashOffset: (-(emCorrida ? s.prog : 0) * prep.len).toFixed(1),
      animRota: 'fadein 700ms ease-out both',
      origemX: t.pv.s[0][0], origemY: t.pv.s[0][1],
      destinoX: t.pv.s[t.pv.s.length - 1][0], destinoY: t.pv.s[t.pv.s.length - 1][1],
      animPinOrigem: s.chegada === 'pin' && s.corridaStatus === 'INDO_BUSCAR' ? 'bouncepin 400ms ease-out both' : 'pinin 320ms cubic-bezier(.2,.8,.2,1) 220ms both',
      animPinDestino: s.chegada === 'pin' && s.corridaStatus === 'EM_VIAGEM' ? 'bouncepin 400ms ease-out both' : 'pinin 320ms cubic-bezier(.2,.8,.2,1) 340ms both',
      rotaVisivel: mapaBase && (!!oferta || emCorrida),
      transformMapa: 'translate(' + s.offX.toFixed(1) + 'px, ' + s.offY.toFixed(1) + 'px) scale(' + z + ')',
      transformOverlay: 'translate(' + s.offX.toFixed(1) + 'px, ' + s.offY.toFixed(1) + 'px)',
      transicaoMapa: s.arrastando || (emCorrida && s.segue) ? 'none' : 'transform 600ms cubic-bezier(.16,1,.3,1)',
      cursorMapa: mapaBase && !oferta ? (s.arrastando ? 'grabbing' : 'grab') : 'default',
      mostrarRecentrar: mapaBase && !oferta && (soltou || foraDoCentro),
      fabBottom: emCorrida ? 348 : 216,
      recentrar: () => this.recentrar(),
      panDown: e => this.panDown(e), panMove: e => this.panMove(e), panUp: () => this.panUp(), zoomDuplo: () => this.zoomDuplo(),
      emCorrida,
      mostrarUiMapa: mapaBase && !oferta && !emCorrida,
      bannerVisivel: mapaBase && !oferta && !emCorrida && s.banner && (this.props.mostrarBanner ?? true),
      bgCamada: s.camada ? '#EFEDF1' : '#FFFFFF', corCamada: s.camada ? '#1C1A1F' : '#9D9CA1',
      slotConectar: s.status === 'OFFLINE', slotCarregando: s.status === 'CARREGANDO', slotBuscando: s.status === 'BUSCANDO',
      ganhosFmt: fmt(s.ganhos), saldoFmt: s.ganhos.toFixed(2).replace('.', ','), baseFmt: fmt(totalBase), dinamicoFmt: fmt(s.dinamico),
      pctBase: s.ganhos > 0 ? Math.round((totalBase / s.ganhos) * 100) : 0,
      pctDin: s.ganhos > 0 ? Math.round((s.dinamico / s.ganhos) * 100) : 0,
      temOferta: !!oferta, oferta: oferta || {}, duracao: dur,
      animValor: s.fase === 'expirando' ? 'pulseval 900ms ease-in-out infinite' : 'none',
      corrida: corrida || {}, categoriaAtiva: CATEGORIAS[tipoAtivo][0],
      alturaSheet: s.snap === 0 ? 150 : s.snap === 1 ? 330 : 470,
      alternarSnap: () => this.setState({ snap: (s.snap + 1) % 3 }),
      rotuloStatus: s.corridaStatus === 'INDO_BUSCAR' ? 'A caminho' : s.corridaStatus === 'AGUARDANDO' ? 'No local' : 'Em viagem',
      corBadgeStatus: s.corridaStatus === 'EM_VIAGEM' ? '#26292E' : '#FEF8CC',
      corTextoBadge: s.corridaStatus === 'EM_VIAGEM' ? '#FFFFFF' : '#7a6a00',
      rotuloTrecho: s.corridaStatus === 'EM_VIAGEM' ? 'Destino' : 'Embarque',
      corTrechoAtual: s.corridaStatus === 'EM_VIAGEM' ? '#EE542C' : '#24D279',
      enderecoTrecho: s.corridaStatus === 'EM_VIAGEM' ? (corrida ? corrida.enderecoDestino : '') : (corrida ? corrida.enderecoOrigem : ''),
      botaoAndando: emCorrida && andando,
      botaoSimples: emCorrida && !andando && s.corridaStatus !== 'EM_VIAGEM',
      botaoDeslizar: emCorrida && !andando && s.corridaStatus === 'EM_VIAGEM',
      rotuloAndando: s.corridaStatus === 'EM_VIAGEM' ? 'Em viagem' : 'A caminho da origem',
      rotuloBotao: s.corridaStatus === 'AGUARDANDO' ? 'Iniciar viagem' : 'Cheguei',
      corBotaoAcao: s.corridaStatus === 'AGUARDANDO' ? '#24D279' : '#F8D60B',
      corTextoBotao: s.corridaStatus === 'AGUARDANDO' ? '#FFFFFF' : '#1C1A1F',
      slidePx: s.slide, opacidadeRotulo: Math.max(0, 1 - s.slide / 180),
      slideDown: e => this.slideDown(e), slideMove: e => this.slideMove(e), slideUp: () => this.slideUp(),
      avancarCorrida: () => this.avancarCorrida(),
      drawerEsq: s.drawer === 'esq',
      corToggle: s.destinoOn ? '#F8D60B' : '#DCDAE0', posToggle: s.destinoOn ? 'flex-end' : 'flex-start',
      toggleDestino: () => this.setState({ destinoOn: !s.destinoOn }),
      pillFase: tipoAtivo.charAt(0) + tipoAtivo.slice(1).toLowerCase() + ' • Fase 1',
      tipoAtivo: tipoAtivo.charAt(0) + tipoAtivo.slice(1).toLowerCase(),
      pushAberto, pushVeu: pushAberto, pushX: s.pushX,
      transicaoPush: s.pushArrasto ? 'none' : 'transform 300ms cubic-bezier(.2,.8,.2,1)',
      animPush: s.pushSeq % 2 === 0 ? 'pushin 300ms ease-out both' : 'pushin2 300ms ease-out both',
      transformBase: pushAberto ? 'translateX(-30%)' : 'translateX(0)',
      transicaoBase: 'transform 300ms ease-out',
      bordaDown: e => this.bordaDown(e), bordaMove: e => this.bordaMove(e), bordaUp: () => this.bordaUp(),
      cursorBorda: s.pushArrasto ? 'grabbing' : 'grab',
      voltarPush: () => this.voltarPush(),
      telaPrefSolic: s.tela === 'prefsolic', telaPrefServicos: s.tela === 'prefservicos',
      categorias: CATEGORIAS[tipoAtivo].map(nome => {
        const on = s.catsOff.indexOf(nome) === -1;
        return {
          key: nome, nome, bg: on ? '#1C1A1F' : '#DCDAE0', pos: on ? 'flex-end' : 'flex-start',
          toggle: () => this.setState({ catsOff: on ? s.catsOff.concat([nome]) : s.catsOff.filter(x => x !== nome) })
        };
      }),
      telaTeste: s.tela === 'teste', testeRodando: s.tela === 'teste' && s.testeStep < 6, testeCompleto: s.testeStep >= 6,
      anelOffset: 377 - 377 * (s.testeStep / 6), anelTexto: s.testeStep + '/6',
      checklist: CHECK.map((nome, i) => ({
        key: nome, nome, ok: i < s.testeStep, testando: i === s.testeStep, pendente: i > s.testeStep,
        cor: i < s.testeStep ? '#1C1A1F' : '#9D9CA1'
      })),
      reiniciarTeste: () => { this.limpar(); this.setState({ testeStep: 0 }); this.rodarTeste(); },
      telaFacial: s.tela === 'facial',
      facialVerificando: s.facial === 'verificando', facialSucesso: s.facial === 'sucesso', facialFalha: s.facial === 'falha',
      corOval: s.facial === 'sucesso' ? '#24D279' : s.facial === 'falha' ? '#EB312B' : '#2445A6',
      animOval: s.facial === 'falha' ? 'tremer 300ms ease-in-out both' : s.facial === 'sucesso' ? 'bateu 400ms ease-out both' : 'none',
      animBateu: s.facial === 'sucesso' ? 'bateu 400ms ease-out both' : 'none',
      facialTexto: s.facial === 'falha' ? 'Não conseguimos verificar. Tentar novamente.' : s.facial === 'sucesso' ? 'Tudo certo!' : 'Por favor, olhe diretamente para a câmera e posicione seu rosto dentro do oval.',
      reiniciarFacial: () => { this.limpar(); this.setState({ facial: 'verificando' }); this.rodarFacial(); },
      temFoto, semFoto: !temFoto, fotoEnviando: s.foto === 'enviando',
      avatarBg: temFoto ? 'repeating-linear-gradient(135deg, #DED9E2 0 7px, #CFC9D4 7px 14px)' : '#26292E',
      avatarConteudo: temFoto ? '' : 'DM', avatarMini: temFoto ? '' : 'DM',
      avatarOpacidade: s.foto === 'enviando' ? 0.5 : 1,
      sheetFoto: s.sheetFoto,
      abrirSheetFoto: () => this.setState({ sheetFoto: true }),
      fecharSheetFoto: () => this.setState({ sheetFoto: false }),
      tirarFoto: () => { this.setState({ sheetFoto: false, foto: 'enviando' }); this.at(() => this.setState({ foto: 'ok' }), 1400); },
      removerFoto: () => this.setState({ sheetFoto: false, foto: 'vazio' }),
      telaResumo: s.tela === 'resumo', resumo: s.resumo || {}, resumoValorFmt: fmt(s.resumoValor),
      estrelasLista: [1, 2, 3, 4, 5].map(n => ({ key: n, cor: n <= s.estrelas ? '#F8D60B' : '#DCDAE0', set: () => this.setState({ estrelas: n }) })),
      concluirResumo: () => { this.setState({ tela: 'mapa', status: 'BUSCANDO', resumo: null }); this.agendarOferta(4000); },
      telaCentral: s.tela === 'central', telaCarteira: s.tela === 'carteira', telaPix: s.tela === 'pix',
      telaPerfil: s.tela === 'perfil', telaConfig: s.tela === 'config', telaConta: s.tela === 'conta', telaVeiculos: s.tela === 'veiculos',
      historico: s.historico.map((h, i) => ({ ...h, key: i })), semHistorico: s.historico.length === 0,
      totalCorridas: s.historico.length,
      grafico: horas.map(h => {
        const v = s.historico.filter(x => x.h === h).reduce((a, b) => a + b.valor, 0);
        return { key: h, hora: h + 'h', h: Math.max(4, Math.round((v / maxHora) * 92)), cor: v > 0 ? '#F8D60B' : '#EFEDF1' };
      }),
      tiles: TILES.map(x => ({ key: x[0], nome: x[0], badge: x[1] })),
      distribuicao: [[5, 92, 94], [4, 6, 6], [3, 2, 2], [2, 0, 0], [1, 0, 0]].map(d => ({ key: d[0], n: d[0], pct: d[1], qtd: d[2] })),
      camposPessoais: [
        { key: 'tel', nome: 'Número de telefone', valor: s.contaTel },
        { key: 'mail', nome: 'E-mail', valor: s.contaEmail },
        { key: 'cidade', nome: 'Cidade', valor: 'São Paulo' },
        { key: 'senha', nome: 'Senha', valor: '••••••••' }
      ],
      contaNome: s.contaNome, contaEmail: s.contaEmail, contaTel: s.contaTel,
      setContaNome: e => this.setState({ contaNome: e.target.value, contaSalvo: false }),
      setContaEmail: e => this.setState({ contaEmail: e.target.value, contaSalvo: false }),
      setContaTel: e => this.setState({ contaTel: e.target.value, contaSalvo: false }),
      rotuloSalvarConta: s.contaSalvo ? 'Alterações salvas ✓' : 'Salvar Alterações',
      salvarConta: () => this.setState({ contaSalvo: true }),
      veiculos: s.veiculos.map((v, i) => ({
        key: v.placa + i, tipo: v.tipo, modelo: v.modelo, placa: v.placa, arte: v.arte,
        borda: i === s.ativo ? '#F8D60B' : '#DCDAE0',
        marca: i === s.ativo ? '✓' : '○',
        status: i === s.ativo ? 'Veículo ativo' : 'Tocar para ativar',
        corStatus: i === s.ativo ? '#24D279' : '#9D9CA1', pesoStatus: i === s.ativo ? 600 : 400,
        ativar: () => this.setState({ ativo: i, catsOff: [] })
      })),
      modalVeiculo: s.modalVeiculo,
      abrirModalVeiculo: () => this.setState({ modalVeiculo: true, novoPlaca: '', novoModelo: '', novoCor: '' }),
      fecharModalVeiculo: () => this.setState({ modalVeiculo: false }),
      abasVeiculo: ['MOTO', 'CARRO', 'BIKE'].map(x => ({
        key: x, nome: x.charAt(0) + x.slice(1).toLowerCase(),
        bg: s.novoTipo === x ? '#FFFFFF' : 'transparent', sombra: s.novoTipo === x ? '0 1px 3px rgba(0,0,0,.16)' : 'none',
        peso: s.novoTipo === x ? 700 : 500, cor: s.novoTipo === x ? '#1C1A1F' : '#9D9CA1',
        set: () => this.setState({ novoTipo: x })
      })),
      novoPlaca: s.novoPlaca, novoModelo: s.novoModelo, novoCor: s.novoCor,
      setNovoPlaca: e => this.setState({ novoPlaca: e.target.value }),
      setNovoModelo: e => this.setState({ novoModelo: e.target.value }),
      setNovoCor: e => this.setState({ novoCor: e.target.value }),
      salvarVeiculo: () => {
        const placa = (s.novoPlaca || 'NOVO000').toUpperCase();
        const cor = s.novoCor ? ' (' + s.novoCor.toUpperCase() + ')' : '';
        const arte = s.novoTipo === 'CARRO' ? 'foto carro' : s.novoTipo === 'BIKE' ? 'foto bike' : 'foto moto';
        this.setState({
          veiculos: s.veiculos.concat([{ tipo: s.novoTipo, modelo: s.novoModelo || 'Sem modelo', placa: placa + cor, arte }]),
          ativo: s.veiculos.length, modalVeiculo: false, catsOff: []
        });
      },
      pixNome: s.pixNome, pixCpf: s.pixCpf, pixConta: s.pixConta, pixDigito: s.pixDigito, pixAgencia: s.pixAgencia,
      setPixNome: e => this.setState({ pixNome: e.target.value }),
      setPixCpf: e => this.setState({ pixCpf: e.target.value }),
      setPixConta: e => this.setState({ pixConta: e.target.value }),
      setPixDigito: e => this.setState({ pixDigito: e.target.value }),
      setPixAgencia: e => this.setState({ pixAgencia: e.target.value }),
      tiposConta: TIPOS_CONTA.map(x => ({
        key: x, nome: x, cor: s.pixTipo === x ? '#1C1A1F' : '#DCDAE0',
        dot: s.pixTipo === x ? '#1C1A1F' : 'transparent', set: () => this.setState({ pixTipo: x })
      })),
      bgContinuar: pixOk ? '#F8D60B' : '#DCDAE0', corContinuar: pixOk ? '#1C1A1F' : '#9D9CA1',
      enviarPix: () => { if (pixOk) this.push('carteira'); },
      telaSplash: s.tela === 'splash', animSplash: s.tela === 'splash' ? 'fadeout 800ms ease-in-out 400ms forwards' : 'none',
      corStatusBar: claro ? '#FFFFFF' : '#1C1A1F', statusBarClara: claro, statusBarEscura: !claro,
      scrimStatus: mapaBase && s.tela !== 'splash',
      corHomeIndicator: oferta ? '#FFFFFF' : '#1C1A1F',
      abrirEsq: () => this.setState({ drawer: 'esq' }),
      fecharDrawer: () => this.setState({ drawer: null }),
      fecharBanner: () => this.setState({ banner: false }),
      toggleCamada: () => this.setState({ camada: !s.camada }),
      conectar: () => this.conectar(), aceitar: () => this.aceitar(), recusar: () => this.recusar(),
      irTeste: () => this.push('teste'), irCentral: () => this.push('central'), irCarteira: () => this.push('carteira'),
      irPix: () => this.push('pix'), irPerfil: () => this.push('perfil'), irConfig: () => this.push('config'),
      irConta: () => this.push('conta'), irVeiculos: () => this.push('veiculos'),
      irPrefSolic: () => this.push('prefsolic'), irPrefServicos: () => this.push('prefservicos'),
      voltarMapa: () => this.setState({ tela: 'mapa', drawer: null, pushX: 0 }),
      mostrarDebug: this.props.mostrarDebug ?? true,
      estadoDebug,
      debugRota: (s.rotaIdx + 1) + '/5 · ' + t.pv.vertices + ' vért. · ' + um(t.km) + 'km',
      debugProgresso: Math.round(s.prog * 100) + '% · ' + Math.round(s.ang) + '°',
      debugCamera: emCorrida ? (s.segue ? 'seguindo' : 'solta (arraste)') : foraDoCentro ? 'deslocada' : 'centrada',
      corDebugCamera: emCorrida && !s.segue ? '#F4C372' : '#fff',
      zonaDebug: faixaFmt(zmin, zmax) + ' · ' + (zmin >= 2.2 ? 'muito quente' : zmin >= 1.4 ? 'quente' : 'aquecida'),
      bgChuva: s.chuva ? '#4A90D9' : '#26242b', corChuva: s.chuva ? '#FFFFFF' : '#DCDAE0', rotuloChuva: s.chuva ? 'ON' : 'off',
      bgEvento: s.evento ? '#EE542C' : '#26242b', corEvento: s.evento ? '#FFFFFF' : '#DCDAE0', rotuloEvento: s.evento ? 'ON' : 'off',
      toggleChuva: () => this.setState({ chuva: !s.chuva }, () => this.tickDemanda()),
      toggleEvento: () => this.setState({ evento: !s.evento }, () => this.tickDemanda()),
      forcarOferta: () => { this.limpar(); cancelAnimationFrame(this.loopId); this.setState({ tela: 'mapa', status: 'BUSCANDO', corrida: null, corridaStatus: null, chegada: null }, () => this.gerarOferta()); },
      proximoTrajeto: () => this.setState({ rotaIdx: (s.rotaIdx + 1) % TRAJETOS.length, prog: 0, chegada: null }),
      pularChegada: () => { if (andando) this.setState({ prog: 0.985 }); },
      resetar: () => {
        this.limpar(); cancelAnimationFrame(this.loopId); this.zonas = this.criarZonas();
        this.setState({ tela: 'splash', status: 'OFFLINE', ganhos: 0, dinamico: 0, historico: [], banner: true, camada: true, chuva: false, evento: false, oferta: null, corrida: null, corridaStatus: null, resumo: null, chegada: null, prog: 0, ang: 0, offX: 0, offY: 0, zoom: 1, segue: true, foto: 'ok', ativo: 0, catsOff: [], rotaIdx: 0, zonas: this.zonas.map(zz => ({ ...zz })) });
        this.at(() => this.setState({ tela: 'mapa' }), 1200);
      }
    };
  }
}

