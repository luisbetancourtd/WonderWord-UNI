import type { ViewType } from '../../types';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-12 py-14 space-y-12">
      {/* 1. HERO GREETING */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-rule">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-terre-ink mb-3">
            Vendredi 28 août 2026
          </p>
          <h1 className="font-serif text-[54px] md:text-[64px] font-normal leading-none tracking-tight text-ink m-0">
            Bienvenido, Kevin.
          </h1>
        </div>

        {/* Métriques */}
        <div className="flex items-end gap-0 self-start md:self-auto">
          <div className="px-6 text-right">
            <p className="font-serif text-[28px] font-normal text-ink m-0 tabular-nums">1.284</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">Palabras</p>
          </div>
          <span className="w-px h-10 bg-rule" />
          <div className="px-6 text-right">
            <p className="font-serif text-[28px] font-normal text-ink m-0 tabular-nums">7</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">Libros</p>
          </div>
          <span className="w-px h-10 bg-rule" />
          <div className="pl-6 text-right">
            <p className="font-serif text-[28px] font-normal text-terre-ink m-0 tabular-nums">14</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">Racha</p>
          </div>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (2 COLUMNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.66fr_1fr] gap-12 items-start">
        
        {/* Columna Izquierda: Lectura en Curso & Palabra del Día */}
        <div className="space-y-12">
          
          {/* SECCIÓN: LECTURA EN CURSO */}
          <section>
            <div className="flex items-center gap-3.5 mb-6">
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-sauge relative">
                Lectura en curso
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sauge/20" />
              </span>
              <span className="flex-1 h-px bg-rule" />
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Couverture du Livre */}
              <div className="w-36 flex-shrink-0">
                <div className="aspect-[2/3] bg-soleil rounded-r-xl rounded-l-sm p-4 flex flex-col justify-between shadow-md border-l-2 border-black/10">
                  <p className="text-[8px] uppercase tracking-widest font-semibold text-soleil-ink opacity-70">
                    Gallimard
                  </p>
                  <div>
                    <span className="block w-full h-px bg-black/20 mb-2" />
                    <p className="font-serif text-[17px] leading-tight text-soleil-ink font-normal">
                      Le Petit Prince
                    </p>
                    <p className="text-[9px] text-soleil-ink opacity-80 mt-1">
                      A. de Saint-Exupéry
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9.5px] uppercase tracking-wider font-bold text-sauge border border-sauge rounded-full px-2.5 py-0.5">
                    Français
                  </span>
                  <span className="text-[10px] text-ink-3">1943</span>
                </div>

                {/* Progression Circulaire */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg viewBox="0 0 52 52" className="w-14 h-14 -rotate-90">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="var(--rule-soft)" strokeWidth="5" />
                      <circle 
                        cx="26" cy="26" r="22" 
                        fill="none" 
                        stroke="var(--sauge)" 
                        strokeWidth="5" 
                        strokeLinecap="round" 
                        strokeDasharray="138.2" 
                        strokeDashoffset="91.2" 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-[13px] text-ink">
                      34%
                    </span>
                  </div>
                  <span className="text-[11px] leading-tight text-ink-2">
                    Página 34<br />de 98
                  </span>
                </div>
              </div>

              {/* Détails et Extrait avec Phonétique */}
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-[38px] font-normal leading-tight text-ink m-0 mb-1">
                  Le Petit Prince
                </h2>
                <p className="text-[13px] text-ink-2 mb-6">
                  Antoine de Saint-Exupéry · Chapitre IV
                </p>

                {/* Carte "Retomas aquí" */}
                <div className="bg-paper p-5 rounded-2xl border border-rule shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-ink-3 mb-2.5">
                    Retomas aquí
                  </p>
                  <p className="font-serif text-[20px] leading-[2.2] text-ink m-0">
                    <ruby>J’ai<rt>ʒe</rt></ruby> <ruby>de<rt>də</rt></ruby> <ruby>sérieuses<rt>seʁjøz</rt></ruby> <ruby>raisons<rt>ʁɛzɔ̃</rt></ruby> <ruby>de<rt>də</rt></ruby> <ruby>croire<rt>kʁwaʁ</rt></ruby> <ruby>que<rt>kə</rt></ruby> <ruby>la<rt>la</rt></ruby> <ruby>planète<rt>planɛt</rt></ruby>…
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center gap-6 mt-6">
                  <button
                    type="button"
                    onClick={() => onNavigate('reader')}
                    className="bg-prune hover:bg-prune-2 text-white text-[11px] font-bold uppercase tracking-widest px-7 py-3 rounded-full shadow transition-all"
                  >
                    Continuar lectura
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('shadowing')}
                    className="text-[11px] font-bold uppercase tracking-widest text-ink-2 border-b border-rule hover:border-ink pb-0.5 transition-colors"
                  >
                    Entraîner au Shadowing
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN: PALABRA DEL DÍA */}
          <section className="bg-paper p-6 rounded-2xl border border-rule shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9.5px] uppercase tracking-widest font-bold text-bleuet-ink bg-soleil-wash px-2.5 py-0.5 rounded">
                Palabra del día
              </span>
              <span className="text-xs text-ink-3">· Liaison obligatoire</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-serif text-[32px] text-ink leading-tight flex items-baseline gap-2">
                  <span className="text-[20px] text-ink-3">le</span>
                  <span>les</span>
                  <span className="text-terre font-bold">‿</span>
                  <span>hommes</span>
                </div>
                <p className="font-ipa text-sauge text-[14px] mt-1 font-bold">
                  /le.z‿ɔm/
                </p>
                <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                  «Los hombres». La <em>s</em> muda se pronuncia <span className="font-bold text-terre">/z/</span> al enlazar con la vocal siguiente (liaison obligatoire).
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('shadowing')}
                className="self-start sm:self-auto bg-paper-warm hover:bg-paper-2 border border-rule text-ink text-[11px] font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
              >
                Practicar liaison
              </button>
            </div>
          </section>

        </div>

        {/* Columna Derecha: Sistema de Repaso (SRS) & Metas */}
        <div className="space-y-8">
          
          {/* Carte de Répétition Espacée */}
          <div className="bg-paper p-7 rounded-2xl border border-rule shadow-sm">
            <span className="inline-block bg-soleil text-soleil-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-4">
              Vencidas hoy
            </span>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-serif text-[56px] font-normal text-ink leading-none">
                12
              </span>
              <span className="text-[13px] text-ink-3">
                tarjetas de 348 en tu mazo
              </span>
            </div>

            <p className="text-[13px] text-ink-2 mb-6">
              Cinco minutos bastan para consolidar tu retención a largo plazo.
            </p>

            <div className="space-y-2.5 text-[12.5px] border-t border-rule/60 pt-4 mb-6">
              <div className="flex justify-between text-ink-2">
                <span>Nuevas</span>
                <span className="font-bold text-ink">4</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>En aprendizaje</span>
                <span className="font-bold text-ink">3</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>En repaso</span>
                <span className="font-bold text-ink">4</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>Reaprendiendo</span>
                <span className="font-bold text-terre-ink">1</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('vocabulary')}
              className="w-full bg-sauge hover:bg-sauge-2 text-white font-bold text-[12px] uppercase tracking-wider py-3 rounded-full transition-all shadow"
            >
              Empezar sesión
            </button>
          </div>

          {/* Langues & Niveaux */}
          <div className="bg-paper p-6 rounded-2xl border border-rule shadow-sm space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-ink-3 m-0">
              Tus Rutas Lingüísticas
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Français (A2)</span>
                  <span className="text-sauge">7 / 24</span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div className="h-full bg-sauge rounded-full w-[29%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Deutsch (A1)</span>
                  <span className="text-bleuet-ink">3 / 18</span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div className="h-full bg-bleuet-ink rounded-full w-[16%]" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
