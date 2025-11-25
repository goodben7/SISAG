import { useMemo, useState, useEffect, useRef } from 'react';
import { X, CalendarDays, Coins, User, Eye, AlertTriangle } from 'lucide-react';
import { ChevronDown, Info, Users, Globe, Target } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

type Props = {
  projects: Project[];
  onOpenProject?: (id: string) => void;
};

const STATUS_COLOR: Record<Project['status'], string> = {
  completed: '#008000',
  in_progress: '#FF9800',
  delayed: '#DC143C',
  planned: '#6B7280',
  cancelled: '#6B7280'
};

const PROVINCES = [
  'Kinshasa','Kongo Central','Kwango','Kwilu','Mai-Ndombe','Kasaï','Kasaï-Central','Kasaï-Oriental','Lomami','Sankuru','Haut-Uélé','Bas-Uélé','Tshopo','Tshuapa','Équateur','Mongala','Nord-Ubangi','Sud-Ubangi','Ituri','Nord-Kivu','Sud-Kivu','Maniema','Tanganyika','Haut-Lomami','Lualaba','Haut-Katanga'
];

const PROVINCE_AREAS: Record<string, { left: number; top: number; width: number; height: number }> = {
  'Kinshasa': { left: 8, top: 66, width: 5, height: 6 },
  'Kongo Central': { left: 3, top: 72, width: 7, height: 10 },
  'Kwango': { left: 9, top: 64, width: 8, height: 10 },
  'Kwilu': { left: 10, top: 56, width: 9, height: 10 },
  'Mai-Ndombe': { left: 6, top: 48, width: 12, height: 10 },
  'Équateur': { left: 6, top: 36, width: 16, height: 10 },
  'Mongala': { left: 12, top: 28, width: 11, height: 8 },
  'Nord-Ubangi': { left: 9, top: 22, width: 9, height: 6 },
  'Sud-Ubangi': { left: 8, top: 30, width: 9, height: 7 },
  'Tshuapa': { left: 18, top: 46, width: 12, height: 10 },
  'Tshopo': { left: 27, top: 34, width: 14, height: 10 },
  'Bas-Uélé': { left: 34, top: 24, width: 12, height: 8 },
  'Haut-Uélé': { left: 41, top: 26, width: 12, height: 9 },
  'Ituri': { left: 47, top: 35, width: 10, height: 9 },
  'Nord-Kivu': { left: 52, top: 45, width: 8, height: 8 },
  'Sud-Kivu': { left: 51, top: 55, width: 9, height: 10 },
  'Maniema': { left: 42, top: 52, width: 11, height: 11 },
  'Tanganyika': { left: 49, top: 66, width: 12, height: 12 },
  'Haut-Lomami': { left: 42, top: 67, width: 10, height: 10 },
  'Lualaba': { left: 35, top: 70, width: 9, height: 10 },
  'Haut-Katanga': { left: 51, top: 78, width: 12, height: 10 },
  'Kasaï': { left: 26, top: 58, width: 9, height: 9 },
  'Kasaï-Central': { left: 31, top: 60, width: 9, height: 9 },
  'Kasaï-Oriental': { left: 36, top: 58, width: 9, height: 9 },
  'Lomami': { left: 38, top: 64, width: 8, height: 8 },
  'Sankuru': { left: 33, top: 52, width: 10, height: 8 },
};

const PROVINCE_IDS: Record<string, string> = {
  'Kongo Central': 'CDBC',
  'Bas-Uélé': 'CDBU',
  'Équateur': 'CDEQ',
  'Haut-Katanga': 'CDHK',
  'Haut-Lomami': 'CDHL',
  'Haut-Uélé': 'CDHU',
  'Ituri': 'CDIT',
  'Kasaï-Central': 'CDKC',
  'Kasaï-Oriental': 'CDKE',
  'Kwango': 'CDKG',
  'Kwilu': 'CDKL',
  'Kinshasa': 'CDKN',
  'Kasaï': 'CDKS',
  'Lomami': 'CDLO',
  'Lualaba': 'CDLU',
  'Maniema': 'CDMA',
  'Mai-Ndombe': 'CDMN',
  'Mongala': 'CDMO',
  'Nord-Kivu': 'CDNK',
  'Nord-Ubangi': 'CDNU',
  'Sankuru': 'CDSA',
  'Sud-Kivu': 'CDSK',
  'Sud-Ubangi': 'CDSU',
  'Tanganyika': 'CDTA',
  'Tshopo': 'CDTO',
  'Tshuapa': 'CDTU'
};

const CODE_TO_LABEL: Record<string, string> = {
  CDBC: 'Kongo-Central',
  CDBU: 'Bas-Uele',
  CDEQ: 'Equateur',
  CDHK: 'Haut-Katanga',
  CDHL: 'Haut-Lomami',
  CDHU: 'Haut-Uele',
  CDIT: 'Ituri',
  CDKC: 'Kasaï-Central',
  CDKE: 'Kasaï-Oriental',
  CDKG: 'Kwango',
  CDKL: 'Kwilu',
  CDKN: 'Kinshasa',
  CDKS: 'Kasaï',
  CDLO: 'Lomami',
  CDLU: 'Lualaba',
  CDMA: 'Maniema',
  CDMN: 'Maï-Ndombe',
  CDMO: 'Mongala',
  CDNK: 'Nord-Kivu',
  CDNU: 'Nord-Ubangi',
  CDSA: 'Sankuru',
  CDSK: 'Sud-Kivu',
  CDSU: 'Sud-Ubangi',
  CDTA: 'Tanganyika',
  CDTO: 'Tshopo',
  CDTU: 'Tshuapa'
};

function normalizeKey(s: string) {
  const t = (s || '').toString().trim().toLowerCase();
  const n = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const r = n.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return r;
}

const CANONICAL_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const k of Object.keys(PROVINCE_AREAS)) {
    m[normalizeKey(k)] = k;
  }
  return m;
})();

function toCanonicalProvinceName(name: string) {
  const key = normalizeKey(name);
  return CANONICAL_MAP[key] || name;
}

function frStatus(s: Project['status']) {
  if (s === 'completed') return 'Terminé';
  if (s === 'in_progress') return 'En cours';
  if (s === 'delayed') return 'En retard';
  if (s === 'planned') return 'Planifié';
  return 'Annulé';
}

function currencyCDF(n: number) {
  return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function RDCProjectsMap({ projects, onOpenProject }: Props) {
  const map = useMemo(() => {
    const byProv: Record<string, Project[]> = {};
    for (const p of projects) {
      const key = toCanonicalProvinceName(p.province || '');
      if (!key) continue;
      if (!byProv[key]) byProv[key] = [];
      byProv[key].push(p);
    }
    const agg: Record<string, { color: string; count: number; status: Project['status'] | null }> = {};
    const provSet = new Set<string>();
    for (const p of PROVINCES) provSet.add(toCanonicalProvinceName(p));
    for (const k of Object.keys(byProv)) provSet.add(toCanonicalProvinceName(k));
    const allProvs = Array.from(provSet);
    for (const prov of allProvs) {
      const arr = byProv[prov] || [];
      let status: Project['status'] | null = null;
      if (arr.length > 0) {
        const hasDelayed = arr.some(p => p.status === 'delayed');
        const hasInProgress = arr.some(p => p.status === 'in_progress');
        const allCompleted = arr.every(p => p.status === 'completed');
        status = hasDelayed ? 'delayed' : hasInProgress ? 'in_progress' : allCompleted ? 'completed' : arr[0].status;
      }
      agg[prov] = { color: arr.length === 0 ? '#E5E7EB' : STATUS_COLOR[status as Project['status']], count: arr.length, status };
    }
    return { byProv, agg, allProvs };
  }, [projects]);

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const selectedProjects = useMemo(() => selectedProvince ? (map.byProv[selectedProvince] || []) : [], [selectedProvince, map]);

  const [segmentedSvg, setSegmentedSvg] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<{ name: string; cx: number; cy: number } | null>(null);
  const [objectiveOpen, setObjectiveOpen] = useState(false);
  const [whoOpen, setWhoOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [pagOpen, setPagOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/img/cd.svg');
        const txt = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(txt, 'image/svg+xml');
        const svgRoot = doc.documentElement as unknown as SVGSVGElement;
        const vbAttr = svgRoot.getAttribute('viewBox') || svgRoot.getAttribute('viewbox');
        if (!svgRoot.getAttribute('viewBox')) {
          if (vbAttr) svgRoot.setAttribute('viewBox', vbAttr);
          else svgRoot.setAttribute('viewBox', '0 0 1000 994');
        }
        svgRoot.removeAttribute('width');
        svgRoot.removeAttribute('height');
        svgRoot.setAttribute('preserveAspectRatio', svgRoot.getAttribute('preserveAspectRatio') || 'xMidYMid meet');
        const style = svgRoot.getAttribute('style') || '';
        svgRoot.setAttribute('style', `${style};display:block;width:100%;height:auto;`);
        // Toujours charger le SVG; la coloration se fera après insertion dans le DOM
        if (!cancelled) setSegmentedSvg(svgRoot.outerHTML);
      } catch (err) {
        console.error(err);
        if (!cancelled) setSegmentedSvg(null);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!segmentedSvg || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg') as SVGSVGElement | null;
    if (!svgEl) return;
    const vb = svgEl.viewBox && svgEl.viewBox.baseVal ? svgEl.viewBox.baseVal : { x: 0, y: 0, width: svgEl.clientWidth || 1000, height: svgEl.clientHeight || 1000 };

    const usedPaths = new Set<SVGElement>();
    const pathEls = Array.from(svgEl.querySelectorAll('path')) as SVGPathElement[];

    const provinceCenters = Object.fromEntries(Object.entries(PROVINCE_AREAS).map(([prov, area]) => {
      const cx = area.left + area.width / 2;
      const cy = area.top + area.height / 2;
      return [prov, { cx, cy }];
    }));

    const pathCenters: { el: SVGPathElement; cx: number; cy: number }[] = [];
    for (const el of pathEls) {
      try {
        const bb = el.getBBox();
        const cx = ((bb.x + bb.width / 2) / (vb.width || 1)) * 100;
        const cy = ((bb.y + bb.height / 2) / (vb.height || 1)) * 100;
        pathCenters.push({ el, cx, cy });
      } catch { void 0; }
    }

    const mapToNearestPath = (prov: string) => {
      const pc = provinceCenters[prov];
      if (!pc) return null;
      let best: { el: SVGPathElement; d: number } | null = null;
      for (const p of pathCenters) {
        if (usedPaths.has(p.el)) continue;
        const dx = p.cx - pc.cx;
        const dy = p.cy - pc.cy;
        const d = dx * dx + dy * dy;
        if (!best || d < best.d) best = { el: p.el, d };
      }
      return best?.el || null;
    };

    const attach = (prov: string, el: SVGElement | null) => {
      if (!el) return;
      const alreadyBound = (el as SVGElement).getAttribute('data-bound') === '1';
      const count = map.agg[prov]?.count || 0;
      const hasProjects = count > 0;
      if (hasProjects) {
        const color = map.agg[prov]?.color || '#E5E7EB';
        (el as SVGElement).setAttribute('fill', color);
        (el as SVGElement).setAttribute('stroke', 'none');
      } else {
        (el as SVGElement).setAttribute('fill', 'none');
        (el as SVGElement).setAttribute('stroke', '#9CA3AF');
        (el as SVGElement).setAttribute('stroke-width', '0.5');
      }
      (el as SVGElement).style.cursor = hasProjects ? 'pointer' : 'default';
      const code = PROVINCE_IDS[prov];
      const label = (code && CODE_TO_LABEL[code]) || prov;
      (el as SVGElement).setAttribute('title', `${label} • ${count} projet(s)`);
      (el as SVGElement).setAttribute('aria-label', `${label} • ${count} projet(s)`);
      (el as SVGElement).setAttribute('data-count', String(count));
      if (!alreadyBound) {
        usedPaths.add(el);
        const handler = () => {
          const c = Number((el as SVGElement).getAttribute('data-count') || '0');
          if (c > 0) setSelectedProvince(prov);
        };
        el.addEventListener('click', handler);
        el.addEventListener('mouseenter', () => {
          const c = Number((el as SVGElement).getAttribute('data-count') || '0');
          if (c <= 0) return;
          try {
            const bb = (el as SVGGraphicsElement).getBBox();
            const cx = ((bb.x + bb.width / 2) / (vb.width || 1)) * 100;
            const cy = ((bb.y + bb.height / 2) / (vb.height || 1)) * 100;
            setHovered({ name: label, cx, cy });
          } catch {
            const pc = (PROVINCE_AREAS[prov] ? { cx: PROVINCE_AREAS[prov].left + PROVINCE_AREAS[prov].width / 2, cy: PROVINCE_AREAS[prov].top + PROVINCE_AREAS[prov].height / 2 } : null);
            setHovered({ name: label, cx: pc?.cx ?? 50, cy: pc?.cy ?? 50 });
          }
        });
        el.addEventListener('mouseleave', () => { setHovered(null); });
        (el as SVGElement).setAttribute('data-bound', '1');
      }
    };

    // Priorité: identifiants si disponibles, sinon mapping géométrique
    for (const prov of Object.keys(PROVINCE_AREAS)) {
      const id = PROVINCE_IDS[prov];
      const byId = id ? (svgEl.querySelector(`#${id}`) as SVGElement | null) : null;
      if (byId) attach(prov, byId);
      else attach(prov, mapToNearestPath(prov));
    }
  }, [segmentedSvg, map]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 max-w-8xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Carte des projets par province</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="mx-auto w-full max-w-lg md:max-w-6xl lg:max-w-3xl">
          {segmentedSvg ? (
            <div ref={svgContainerRef} className="relative w-full h-auto border rounded">
              <div dangerouslySetInnerHTML={{ __html: segmentedSvg }} />
              {hovered && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-full bg-white border rounded px-2 py-1 text-xs shadow pointer-events-none"
                  style={{ left: `${hovered.cx}%`, top: `${hovered.cy}%` }}
                >
                  {hovered.name}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <img src={'/img/cd.svg'} alt="Carte des provinces de la RDC" className="w-full h-auto border rounded" />
              <div className="absolute inset-0">
                {map.allProvs.map((prov) => {
                  const area = PROVINCE_AREAS[prov];
                  if (!area) return null;
                  const hasProjects = (map.agg[prov]?.count || 0) > 0;
                  if (!hasProjects) return null;
                  const color = map.agg[prov]?.color || '#E5E7EB';
                  return (
                    <button
                      key={prov}
                      style={{ left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%`, backgroundColor: color, opacity: 0.25 }}
                      className="absolute border border-blue-400 cursor-pointer hover:opacity-40 rounded transition-opacity"
                      onClick={() => setSelectedProvince(prov)}
                      onMouseEnter={() => {
                        const name = (PROVINCE_IDS[prov] && CODE_TO_LABEL[PROVINCE_IDS[prov]]) || prov;
                        const cx = area.left + area.width / 2;
                        const cy = area.top + area.height / 2;
                        setHovered({ name, cx, cy });
                      }}
                      onMouseLeave={() => setHovered(null)}
                      title={`${(PROVINCE_IDS[prov] && CODE_TO_LABEL[PROVINCE_IDS[prov]]) || prov} • ${map.agg[prov]?.count || 0} projet(s)`}
                      aria-label={`${(PROVINCE_IDS[prov] && CODE_TO_LABEL[PROVINCE_IDS[prov]]) || prov} • ${map.agg[prov]?.count || 0} projet(s)`}
                    >
                      <span className="absolute -top-3 -right-3 bg-white border border-gray-300 text-[10px] rounded px-1 shadow-sm">{map.agg[prov]?.count || 0}</span>
                    </button>
                  );
                })}
                {hovered && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-full bg-white border rounded px-2 py-1 text-xs shadow pointer-events-none"
                    style={{ left: `${hovered.cx}%`, top: `${hovered.cy}%` }}
                  >
                    {hovered.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-sm border p-4 border-l-4 border-l-[#FF9800]">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#FF9800]" />
              Qu’est-ce que le SISAG&nbsp;?
            </h5>
            <p className="text-sm text-gray-700 mb-3">
              Le Système Intégré de Suivi et d’Administration des Gouvernements (SISAG) est la
              plateforme nationale de suivi des projets publics, permettant de centraliser les informations,
              monitorer l’avancement, et soutenir la prise de décision basée sur des données.
            </p>

            <button
              type="button"
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-2 hover:bg-gray-50 rounded px-2 py-1"
              aria-expanded={objectiveOpen}
              onClick={() => setObjectiveOpen(v => !v)}
            >
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF9800]" />
                <span className={objectiveOpen ? 'text-[#FF9800]' : ''}>Quel est son objectif&nbsp;?</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${objectiveOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${objectiveOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <ul className="text-sm text-gray-700 space-y-1 mb-3 p-3 bg-gray-50 rounded-md border">
                <li>Promouvoir la transparence et la reddition des comptes sur les projets publics.</li>
                <li>Accélérer l’exécution et la livraison des projets prioritaires alignés au PAG.</li>
                <li>Assurer le suivi des budgets, dépenses et résultats avec des indicateurs fiables.</li>
                <li>Faciliter la coordination entre ministères, agences et partenaires.</li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-2 hover:bg-gray-50 rounded px-2 py-1"
              aria-expanded={whoOpen}
              onClick={() => setWhoOpen(v => !v)}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF9800]" />
                <span className={whoOpen ? 'text-[#FF9800]' : ''}>Qui met en œuvre le SISAG&nbsp;?</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${whoOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${whoOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <ul className="text-sm text-gray-700 space-y-1 mb-3 p-3 bg-gray-50 rounded-md border">
                <li>Ministères sectoriels et unités de pilotage des projets.</li>
                <li>Agences et établissements publics responsables de l’exécution.</li>
                <li>Partenaires techniques et financiers lorsque pertinent.</li>
                <li>Services déconcentrés pour la collecte et la validation des données au niveau local.</li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-2 hover:bg-gray-50 rounded px-2 py-1"
              aria-expanded={coverageOpen}
              onClick={() => setCoverageOpen(v => !v)}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FF9800]" />
                <span className={coverageOpen ? 'text-[#FF9800]' : ''}>Couverture et périmètre</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${coverageOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${coverageOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <ul className="text-sm text-gray-700 space-y-1 mb-3 p-3 bg-gray-50 rounded-md border">
                <li>Couverture nationale: 26 provinces avec granularité territoires/communes.</li>
                <li>Multi-sectoriel: infrastructures, santé, éducation, agriculture, énergie, etc.</li>
                <li>Types de projets: programmes et projets publics financés par l’État et partenaires.</li>
                <li>Suivi des phases: planification, exécution, clôture et évaluation.</li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-2 hover:bg-gray-50 rounded px-2 py-1"
              aria-expanded={pagOpen}
              onClick={() => setPagOpen(v => !v)}
            >
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF9800]" />
                <span className={pagOpen ? 'text-[#FF9800]' : ''}>Objectifs du PAG (Programme d'Actions du Gouvernement)</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${pagOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${pagOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <ul className="text-sm text-gray-700 space-y-1 p-3 bg-gray-50 rounded-md border">
                <li>Améliorer la qualité des services publics prioritaires.</li>
                <li>Accélérer la livraison des projets structurants à fort impact.</li>
                <li>Renforcer la gouvernance, la transparence et la reddition des comptes.</li>
                <li>Optimiser l’allocation et l’utilisation des ressources.</li>
                <li>Suivre des résultats mesurables alignés aux axes du PAG.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {selectedProvince && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProvince(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h5 className="text-lg font-semibold text-gray-900">
                    Projets dans le {(PROVINCE_IDS[selectedProvince] && CODE_TO_LABEL[PROVINCE_IDS[selectedProvince]]) || selectedProvince}
                  </h5>
                  <span className="px-2 py-0.5 text-xs rounded border text-gray-700">{selectedProjects.length}</span>
                </div>
                <button
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border hover:bg-gray-50"
                  onClick={() => setSelectedProvince(null)}
                >
                  <X className="w-3.5 h-3.5" />
                  Fermer
                </button>
              </div>

              {selectedProjects.length === 0 ? (
                <p className="text-sm text-gray-600">Aucun projet</p>
              ) : (
                <div className="space-y-4">
                  {selectedProjects.map((p) => {
                    const util = Number(p.budget || 0) > 0 ? (Number(p.spent || 0) / Number(p.budget || 0)) * 100 : 0;
                    const barColor = STATUS_COLOR[p.status];
                    const borderColor = STATUS_COLOR[p.status];
                    return (
                      <div key={p.id} className="rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ borderLeft: `4px solid ${borderColor}` }}>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-gray-900">{p.title}</div>
                                <span className="ml-2 px-2 py-0.5 text-[11px] font-medium rounded border" style={{ borderColor: borderColor, color: borderColor }}>{frStatus(p.status)}</span>
                              </div>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700">
                                <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-gray-400" />Budget: {currencyCDF(Number(p.budget || 0))} • Dépensé: {currencyCDF(Number(p.spent || 0))}</div>
                                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-400" />Début: {new Date(p.start_date).toLocaleDateString('fr-FR')} • Fin: {new Date(p.end_date).toLocaleDateString('fr-FR')}{p.actual_end_date ? ` • Fin réelle: ${new Date(p.actual_end_date).toLocaleDateString('fr-FR')}` : ''}</div>
                                <div className="flex items-center gap-2 col-span-1 md:col-span-2"><User className="w-4 h-4 text-gray-400" />Responsable: {p.responsible_person}</div>
                              </div>
                            </div>
                            <div className="w-24">
                              <div className="w-full bg-gray-200 rounded h-2">
                                <div className="h-2 rounded" style={{ width: `${Math.min(100, util)}%`, backgroundColor: barColor }} />
                              </div>
                              <div className="text-[11px] text-right mt-1">{Math.round(util)}%</div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            {onOpenProject && (
                              <button className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 inline-flex items-center gap-1" onClick={() => onOpenProject(p.id)}>
                                <Eye className="w-3.5 h-3.5" /> Voir plus
                              </button>
                            )}
                            <button
                              className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 inline-flex items-center gap-1"
                              onClick={() => {
                                try {
                                  const url = new URL(window.location.href);
                                  url.searchParams.set('page', 'reporting');
                                  url.searchParams.set('reportProjectId', p.id);
                                  window.location.href = url.toString();
                                } catch {
                                  window.location.href = `/?page=reporting&reportProjectId=${p.id}`;
                                }
                              }}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Signaler un problème
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
