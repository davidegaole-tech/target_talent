/* ---------- DATA ---------- */
const EU = [
 {id:'alfabetica', nome:'Alfabetica funzionale', short:'Alfabetica', color:'#2f4b7c'},
 {id:'multilingue', nome:'Multilinguistica', short:'Multilingue', color:'#2f6f9f'},
 {id:'stem', nome:'Matematica, scienze e tecnologie', short:'STEM', color:'#0e6b6b'},
 {id:'digitale', nome:'Digitale', short:'Digitale', color:'#5b4b8a'},
 {id:'personale', nome:'Personale e sociale', short:'Personale', color:'#a61b3f'},
 {id:'cittadinanza', nome:'Cittadinanza', short:'Cittadinanza', color:'#7a2e4a'},
 {id:'imprenditoriale', nome:'Imprenditoriale', short:'Imprendit.', color:'#b0576e'},
 {id:'cultura', nome:'Consapevolezza culturale', short:'Cultura', color:'#4f7a5a'}
];
const DIMS = [
 {id:'essere', nome:'Essere', short:'Essere', color:'#5b4b8a', desc:'Chi sei: valori, carattere, motivazioni'},
 {id:'fare', nome:'Fare', short:'Fare', color:'#0e6b6b', desc:'Cosa realizzi: progetti, attività, risultati'},
 {id:'lavorare', nome:'Lavorare', short:'Lavorare', color:'#a61b3f', desc:'Come operi: metodo, team, leadership'}
];
const COMP_TO_DIM = {alfabetica:'fare',multilingue:'fare',stem:'fare',digitale:'lavorare',personale:'essere',cittadinanza:'essere',imprenditoriale:'lavorare',cultura:'essere'};
const COL = Object.fromEntries(EU.map(c=>[c.id,c.color]));
const MESI=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
function fmtDate(iso){const d=new Date(iso);return d.getDate()+' '+MESI[d.getMonth()];}
function scoreOf(id){const n=state.prove[id]||0;return n?Math.min(96,30+n*8):0;}
function dimCount(id){return state.evidences.reduce((a,e)=>a+((e.dims||[]).includes(id)?1:0),0);}
function dimScore(id){const n=dimCount(id);return n?Math.min(96,25+n*12):0;}
function dimsOf(comp){return [...new Set((comp||[]).map(id=>COMP_TO_DIM[id]).filter(Boolean))];}

const ICONS = {
 passport:'<path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="10" r="3"/><path d="M8.5 17h7"/>',
 plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
 lock:'<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
 chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
 alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
 sparkles:'<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
 text:'<path d="M4 6h16M4 12h12M4 18h8"/>',
 mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/>',
 trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
 calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.9"/><path d="M12 17h.01"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'
};
function icon(n,s=18){return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n]||'')+'</svg>';}

const state = {
  role:'studente',
  route:'passaporto',
  prove:{alfabetica:4,multilingue:2,stem:6,digitale:7,personale:5,cittadinanza:2,imprenditoriale:3,cultura:2},
  evidences:[
   {id:'e1',ambito:'scuola',evidenza:true,titolo:'Robot per la gara regionale',tipo:'foto',data:'2026-11-06',descrizione:'Con il gruppo di laboratorio ho montato e programmato un robot con Arduino. Io ho gestito i sensori e i test.',comp:['stem','digitale'],dims:['fare','lavorare'],conf:'alta',perche:'Progettazione tecnica, programmazione e lavoro di squadra su un obiettivo concreto.'},
   {id:'e2',ambito:'extra',titolo:'Volontaria alla biblioteca di quartiere',tipo:'testo',data:'2026-11-02',descrizione:'Due pomeriggi al mese aiuto a catalogare i libri e a leggere ai bambini delle elementari.',comp:['cittadinanza','personale'],dims:['essere'],conf:'alta',perche:'Impegno civico continuativo e responsabilità verso gli altri.'},
   {id:'e3',ambito:'scuola',titolo:'Podcast in inglese con studenti spagnoli',tipo:'link',data:'2026-10-27',descrizione:'Episodio di 12 minuti registrato con una classe di Valencia sul tema del clima. Ho scritto la scaletta e montato l\'audio.',comp:['multilingue','digitale'],dims:['fare','lavorare'],conf:'alta',perche:'Uso reale di una lingua straniera e produzione audio digitale.'},
   {id:'e4',ambito:'extra',evidenza:true,titolo:'Mercatino solidale di Natale',tipo:'foto',data:'2026-10-20',descrizione:'Ho coordinato un gruppo di 6 persone: budget, contatti con i negozi, turni e comunicazione sui social.',comp:['imprenditoriale','personale'],dims:['lavorare','essere'],conf:'alta',perche:'Iniziativa, gestione di un budget e coordinamento di un gruppo.'},
   {id:'e5',ambito:'scuola',titolo:'Recensione di "La coscienza di Zeno"',tipo:'testo',data:'2026-10-14',descrizione:'Recensione di 900 parole pubblicata sul giornalino scolastico.',comp:['alfabetica'],dims:['fare'],conf:'media',perche:'Produzione di un testo argomentativo destinato a un pubblico reale.'},
   {id:'e6',ambito:'scuola',titolo:'Locandina per la mostra fotografica',tipo:'foto',data:'2026-10-08',descrizione:'Ho progettato la locandina della mostra della classe usando Photoshop e i colori della scuola.',comp:['cultura','digitale'],dims:['essere','lavorare'],conf:'alta',perche:'Alfabetizzazione visiva e uso consapevole di strumenti di design.'},
   {id:'e7',ambito:'extra',titolo:'Capitana della squadra di pallavolo',tipo:'testo',data:'2026-09-30',descrizione:'Gestisco gli allenamenti quando l\'allenatore è assente e tengo i rapporti con le altre squadre.',comp:['personale','cittadinanza'],dims:['essere'],conf:'media',perche:'Leadership, costanza e gestione delle relazioni.'}
  ],
  pending:null,
  prefill:null,
  profilo:{
   nome:'Giulia', cognome:'Ferrari', nascita:'2009-03-14', citta:'Bologna', email:'', telefono:'',
   scuola:'Liceo Scientifico opzione Scienze Applicate', classe:'4B', anno:'2026/27',
   presentazione:'', lingue:'Italiano (madrelingua); Inglese (B2); Spagnolo (A2)',
   digitali:'Arduino, Python di base, Photoshop, Audacity', interessi:'Robotica, fotografia, podcast',
   sport:'Pallavolo'
  },
  ruolo:null,
  passView:'owner',
  recapPeriodo:'mese',
  docEvidenza:[],
  planner:[
   {id:'p1',tipo:'attivita',titolo:'Corso di primo soccorso con la Croce Rossa',note:'Tre incontri il sabato mattina',data:'2026-12-05',comp:['cittadinanza','personale'],perche:'impegno verso gli altri e responsabilità',fonte:'esempio',fatto:false},
   {id:'p2',tipo:'obiettivo',titolo:'Certificazione Cambridge C1',note:'Preparare reading e writing',data:'2027-05-30',comp:['multilingue'],perche:'uso di una lingua straniera a livello avanzato',fonte:'esempio',fatto:false}
  ],
  privacy:{tutor:true,orientatore:false,ai:false,export:true},
  diarioFilter:null,
  radarValues:null,
  justAdded:false,
  shareWithTutor:false,
  streak:5,
  lastActive:'2026-11-10',
  dailyTip:'Oggi prova a documentare un\'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.',
  theme:'light',
  isSample:true,
  sampleBanner:true,
  portfolioAt:null,
  textSize:'normale',
  materie:[
   {id:'m1',nome:'Matematica',color:'#2f4b7c',voti:[{v:8,tipo:'scritto',data:'2026-10-02'},{v:7.5,tipo:'orale',data:'2026-10-15'},{v:9,tipo:'scritto',data:'2026-11-05'}]},
   {id:'m2',nome:'Italiano',color:'#a61b3f',voti:[{v:7,tipo:'orale',data:'2026-10-10'},{v:8,tipo:'scritto',data:'2026-11-02'}]},
   {id:'m3',nome:'Scienze',color:'#0e6b6b',voti:[{v:6.5,tipo:'pratico',data:'2026-10-20'},{v:7.5,tipo:'scritto',data:'2026-11-08'}]}
  ]
};

/* ---------- AI ANALYSIS ---------- */
const RULES=[
 {keys:['robot','arduino','codice','programm','python','sensore','stampante','cad','laboratorio','fisica','matematica','algoritmo','dati','meccanica'], comp:[['stem',.92],['digitale',.72]], why:'progettazione tecnica, logica e uso di strumenti digitali'},
 {keys:['volontari','biblioteca','aiuto','comunita','comunità','raccolta','ambiente','ricicl','rappresentante','cittadin','quartiere'], comp:[['cittadinanza',.9],['personale',.68]], why:'impegno civico, responsabilità e lavoro con gli altri'},
 {keys:['inglese','spagnolo','francese','tedesco','scambio','erasmus','lingua','podcast'], comp:[['multilingue',.9],['digitale',.5]], why:'uso di una lingua straniera in un contesto reale'},
 {keys:['teatro','musica','disegno','foto','mostra','cortometraggio','concerto','arte','locandina'], comp:[['cultura',.9],['personale',.55]], why:'espressione creativa e consapevolezza culturale'},
 {keys:['progetto','startup','mercatino','evento','organizz','vendita','squadra','gruppo','coordin','budget','capitana'], comp:[['imprenditoriale',.88],['personale',.62]], why:'iniziativa, organizzazione e gestione di un progetto'},
 {keys:['libro','lettura','giornalino','dibattito','tema','saggio','recensione','scritt'], comp:[['alfabetica',.9]], why:'produzione e comprensione di testi'},
 {keys:['allenamento','sport','pallavolo','calcio','corsa','tempo','pianific','studio'], comp:[['personale',.86]], why:'costanza, autoregolazione e gestione del tempo'},
 {keys:['app','sito','video','photoshop','canva','social','montaggio','design','audio'], comp:[['digitale',.9],['cultura',.5]], why:'produzione digitale e alfabetizzazione visiva'}
];
function analizza(testo){
  const t=testo.toLowerCase();
  const matched=[];
  const scores={};
  RULES.forEach(r=>{
    const hits=r.keys.filter(k=>t.includes(k));
    if(hits.length){
      matched.push(...hits);
      r.comp.forEach(([id,p])=>{
        const boosted = Math.min(0.99, p + (hits.length-1)*0.04);
        if(!scores[id]||boosted>scores[id]) scores[id]=boosted;
      });
    }
  });
  let comp=Object.entries(scores).map(([id,p])=>({id,p})).sort((a,b)=>b.p-a.p).slice(0,2);
  if(comp.length===0){
    comp=[{id:'personale',p:0.55},{id:'imprenditoriale',p:0.5}];
    matched.push('interesse generale');
  }
  const maxp=comp[0].p;
  const conf = maxp>=0.85?'alta':maxp>=0.6?'media':'bassa';
  const why = RULES.find(r=>r.comp.some(c=>c[0]===comp[0].id))?.why || 'segnali trasversali';
  const segnali=[...new Set(matched)].slice(0,5);
  const dims=dimsOf(comp.map(c=>c.id));
  return {comp,dims,perche:why,segnali,conf};
}
function topComp(n){
  return EU.map(c=>({id:c.id,nome:c.short,val:scoreOf(c.id)})).sort((a,b)=>b.val-a.val).slice(0,n);
}
function bottomComp(n){
  return EU.map(c=>({id:c.id,nome:c.short,val:scoreOf(c.id)})).sort((a,b)=>a.val-b.val).slice(0,n);
}
function topDim(n){
  return DIMS.map(d=>({id:d.id,nome:d.nome,val:dimScore(d.id),count:dimCount(d.id)})).sort((a,b)=>b.val-a.val).slice(0,n);
}