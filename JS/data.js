// ═══════════════════════════════════════════
//  ShimanoServiceCenter · data.js
// ═══════════════════════════════════════════

const CONFIG = {
  API_BASE : 'http://salonsapi.prooktatas.hu',
  API_KEY  : 'velofix2026',
  SLOT_MIN : 30,   // alap slot egység: 30 perc
};

// Fallback szerelők
const FALLBACK_MECHANICS = [
  { id:1, name:'Kovács Péter',  work_start:'08:00', work_end:'17:00', title:'Shimano Master Technician' },
  { id:2, name:'Nagy Balázs',   work_start:'08:00', work_end:'17:00', title:'E-Bike Specialist'         },
  { id:3, name:'Horváth Dávid', work_start:'08:00', work_end:'17:00', title:'Race & Performance Expert' },
];

// Szervíztípusok névvel és időtartammal (perc)
const SERVICES = [
  { name: 'Általános szervíz',                duration: 120 },
  { name: 'E-bike diagnosztika',               duration:  60 },
  { name: 'Kerékcsere / defektragasztás',      duration:  30 },
  { name: 'Fékrendszer beállítás',             duration:  30 },
  { name: 'Átvizsgálás + kenés',               duration:  30 },
  { name: 'Versenykerékpár optimalizálás',     duration: 120 },
  { name: 'Egyedi festés',                     duration:  30 },
  { name: 'Egyéb',                             duration:  30 },
];