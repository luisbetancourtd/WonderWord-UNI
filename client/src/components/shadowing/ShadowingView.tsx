import React, { useState } from 'react';
import { Volume2, Mic, Play, Check, Activity, Sparkles } from 'lucide-react';

export const ShadowingView: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTempo, setSelectedTempo] = useState<'0.75x' | '1.0x' | '1.25x'>('1.0x');
  const [hvptFeedback, setHvptFeedback] = useState<string | null>(null);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleHvptChoice = (choice: 'tu' | 'tout') => {
    if (choice === 'tu') {
      setHvptFeedback("¡Exacto! Has discriminado la vocal anterior redondeada [y] (/ty/), diferenciada de [u] por su F2 elevado.");
    } else {
      setHvptFeedback("Cuidado: el audio nativo pronunció la vocal [y] (labios abocinados y lengua adelantada), no la vocal posterior [u].");
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full px-12 py-12 space-y-10">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-rule">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-terre" />
            <p className="text-[9.5px] uppercase tracking-[0.24em] font-bold text-terre-ink m-0">
              Santuario Auditivo & Articulatorio
            </p>
          </div>
          <h1 className="font-serif text-[42px] font-normal leading-tight text-ink m-0">
            Fonética & Shadowing
          </h1>
        </div>

        {/* Sélecteur de tempo */}
        <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full text-xs font-bold border border-rule-soft self-start sm:self-auto">
          <span className="text-ink-3 px-2 text-[10.5px] uppercase tracking-wider">Tempo</span>
          {(['0.75x', '1.0x', '1.25x'] as const).map((tempo) => (
            <button
              key={tempo}
              type="button"
              onClick={() => setSelectedTempo(tempo)}
              className={`px-2.5 py-1 rounded-full transition-all ${
                selectedTempo === tempo 
                  ? 'bg-paper text-sauge shadow font-extrabold' 
                  : 'text-ink-2 hover:text-ink font-medium'
              }`}
            >
              {tempo}
            </button>
          ))}
        </div>
      </div>

      {/* HERO CARD DE SHADOWING */}
      <div className="bg-paper rounded-3xl p-10 border border-rule shadow-md relative overflow-hidden space-y-8">
        {/* Halo décoratif */}
        <div 
          aria-hidden="true" 
          className="absolute -right-8 -top-8 w-80 h-64 rounded-full bg-sauge-wash pointer-events-none filter blur-2xl opacity-60" 
        />

        {/* Détail d'extrait */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-sauge bg-sauge-wash border border-sauge/25 rounded-full px-3 py-1">
            Français · A2
          </span>
          <span className="text-[13px] text-ink-2">
            De <em>« Le Petit Prince »</em> · Cap. IV (Página 34)
          </span>
        </div>

        {/* Phrase Cible avec Ruby Phonétique */}
        <div className="text-center py-4">
          <h2 className="font-serif text-[34px] md:text-[38px] leading-[2.1] text-ink font-normal m-0 mb-3">
            <ruby className="px-1">J’ai<rt className="font-ipa text-sauge font-bold">ʒe</rt></ruby>{' '}
            <ruby className="px-1">de<rt className="font-ipa text-ink-3">də</rt></ruby>{' '}
            <ruby className="px-1">sérieuses<rt className="font-ipa text-ink-3">seʁjøz</rt></ruby>{' '}
            <ruby className="px-1">raisons<rt className="font-ipa text-ink-3">ʁɛzɔ̃</rt></ruby>{' '}
            <ruby className="px-1">de<rt className="font-ipa text-ink-3">də</rt></ruby>{' '}
            <ruby className="px-1">croire<rt className="font-ipa text-terre-ink font-bold underline">kʁwaʁ</rt></ruby>{' '}
            <ruby className="px-1">que<rt className="font-ipa text-ink-3">kə</rt></ruby>{' '}
            <ruby className="px-1">la<rt className="font-ipa text-ink-3">la</rt></ruby>{' '}
            <ruby className="px-1">planète<rt className="font-ipa text-ink-3">planɛt</rt></ruby>…
          </h2>
          <p className="text-[15px] text-ink-2 italic m-0">
            «Tengo serias razones para creer que el planeta de donde venía el principito…»
          </p>
        </div>

        {/* COURBE MÉLODIQUE & PROSODIE (DTW) */}
        <div className="bg-gradient-to-b from-paper-warm to-paper border border-rule rounded-2xl p-6 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sauge-wash flex items-center justify-center text-sauge">
                <Activity size={14} />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-sauge">
                Curva Melódica & Prosodia (DTW)
              </span>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-ink-2">
              <span>Hablante Nativo: <strong className="text-sauge">2.8s</strong></span>
              <span>Tu Grabación: <strong className="text-terre">3.1s</strong></span>
            </div>
          </div>

          {/* Graphique SVG des Ondes */}
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 800 120" className="w-full h-28 block overflow-visible">
              <defs>
                <linearGradient id="nativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--sauge)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--sauge)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="60" x2="800" y2="60" stroke="rgba(36,29,36,0.08)" strokeDasharray="4 4" />
              
              {/* Aire Natif */}
              <path 
                d="M 20 60 Q 70 20 120 60 T 220 60 T 320 15 T 420 60 T 520 25 T 620 60 T 720 30 T 780 60 L 780 60 L 20 60 Z" 
                fill="url(#nativeGrad)" 
              />

              {/* Ligne Natif */}
              <path 
                d="M 20 60 Q 70 20 120 60 T 220 60 T 320 15 T 420 60 T 520 25 T 620 60 T 720 30 T 780 60" 
                fill="none" 
                stroke="var(--sauge)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />

              {/* Ligne Enregistrement Utilisateur */}
              <path 
                d="M 20 60 Q 75 25 130 60 T 235 60 T 340 30 T 450 60 T 560 20 T 670 60 T 750 35 T 790 60" 
                fill="none" 
                stroke="var(--terre)" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeDasharray="6 3" 
              />

              {/* Encadré d'alerte */}
              <rect x="420" y="8" width="350" height="104" rx="10" fill="rgba(196,99,47,0.08)" stroke="rgba(196,99,47,0.3)" strokeDasharray="4 4" />
              <text x="595" y="105" textAnchor="middle" fontSize="10.5" fontFamily="'Hanken Grotesk',sans-serif" fontWeight="800" fill="var(--terre-ink)">
                ▲ TRAMO DONDE EL RITMO SE DESACELERÓ (+22%)
              </text>
            </svg>
          </div>

          <div className="flex justify-center gap-7 mt-3 text-xs font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-sauge rounded-full" /> Hablante Nativo
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-terre rounded-full border-t border-dashed" /> Tu Intento Grabado
            </span>
          </div>
        </div>

        {/* BOUTONS D'ACTION */}
        <div className="flex justify-center items-center gap-5 pt-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-paper border border-rule text-xs font-bold text-ink hover:bg-paper-warm transition-all shadow-sm"
          >
            <Volume2 size={16} className="text-sauge" />
            <span>Escuchar Nativo</span>
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            className={`inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full text-white text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg ${
              isRecording
                ? 'bg-terre animate-pulse shadow-terre/40 scale-105'
                : 'bg-prune hover:bg-prune-2 shadow-prune/30 hover:-translate-y-0.5'
            }`}
          >
            <Mic size={18} />
            <span>{isRecording ? 'Detener Grabación' : 'Grabar tu Voz (Espacio)'}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-paper border border-rule text-xs font-bold text-ink hover:bg-paper-warm transition-all shadow-sm"
          >
            <Play size={16} className="text-terre" />
            <span>Escuchar Tu Voz</span>
          </button>
        </div>
      </div>

      {/* DIAGNOSTIC HONNÊTE DE 3 AXES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3.5">
          <span className="text-[10px] uppercase tracking-[0.22em] font-extrabold text-ink-3">
            Diagnóstico Honesto de 3 Ejes
          </span>
          <span className="flex-1 h-px bg-rule" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* AXE 1: DIJISTE */}
          <div className="bg-paper rounded-2xl p-6 border border-rule shadow-sm border-l-4 border-l-sauge flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-sauge">
                  1. ¿Qué Dijiste?
                </span>
                <span className="text-[11px] bg-sauge-wash text-sauge px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check size={12} /> Frase Completa
                </span>
              </div>
              <p className="font-serif text-[16px] text-ink mb-1.5 font-normal">
                «J’ai de sérieuses raisons…»
              </p>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                Vosk / Kaldi detectó el 100% de las palabras canónicas sin omisiones ni palabras inventadas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rule-soft text-[11.5px] text-sauge font-bold">
              Puerta P1 superada con éxito.
            </div>
          </div>

          {/* AXE 2: SONÓ */}
          <div className="bg-paper rounded-2xl p-6 border border-rule shadow-sm border-l-4 border-l-soleil flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-soleil-ink">
                  2. ¿Cómo Sonó?
                </span>
                <span className="text-[11px] bg-soleil-wash text-soleil-ink px-2.5 py-0.5 rounded-full font-bold">
                  Ajuste en /ʁ/
                </span>
              </div>
              <p className="font-ipa text-[15px] text-ink mb-1.5 font-normal">
                /ʒe də seʁjøz ʁɛzɔ̃ də <strong className="text-terre-ink underline">kʁwaʁ</strong>/
              </p>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                La consonante <strong>/ʁ/</strong> uvular en <em>croire</em> sonó alveolar (como en español). Dale más fricción uvular posterior.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rule-soft text-[11.5px] text-terre-ink font-bold">
              Sonido diana: /ʁ/ uvular francesa.
            </div>
          </div>

          {/* AXE 3: FLUJÓ */}
          <div className="bg-paper rounded-2xl p-6 border border-rule shadow-sm border-l-4 border-l-terre flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-terre-ink">
                  3. ¿Cómo Fluyó?
                </span>
                <span className="text-[11px] bg-terre-wash text-terre-ink px-2.5 py-0.5 rounded-full font-bold">
                  -22% 2ª mitad
                </span>
              </div>
              <p className="text-[15px] font-bold text-ink mb-1.5">
                Ritmo constante al inicio
              </p>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                Hiciste una micro-pausa antes de <em>«croire que la planète»</em>. Encadena en un solo impulso de aire respiratorio.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rule-soft text-[11.5px] text-prune font-bold">
              Consejo único: encadenar sin pausa.
            </div>
          </div>

        </div>
      </div>

      {/* SECTION DU GYMNASE HVPT (DISCRIMINATION DES VOYELLES) */}
      <div className="bg-paper rounded-3xl p-8 border border-rule shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-bleuet-ink" />
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-bleuet-ink">
                Gimnasio Fonético HVPT (2AFC)
              </span>
            </div>
            <h3 className="font-serif text-[24px] font-normal text-ink m-0">
              Contraste /u/ (ou) vs /y/ (u) en Francés
            </h3>
            <p className="text-[13px] text-ink-2 mt-1">
              Escucha la voz de referencia y selecciona cuál de los dos pares mínimos fue articulado.
            </p>
          </div>

          <button
            type="button"
            className="self-start sm:self-auto bg-sauge hover:bg-sauge-2 text-white font-bold text-[11.5px] px-5 py-2.5 rounded-full flex items-center gap-2 transition-colors shadow"
          >
            <Volume2 size={15} />
            <span>Escuchar Estímulo</span>
          </button>
        </div>

        {/* Cartes de choix */}
        <div className="grid grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => handleHvptChoice('tu')}
            className="bg-paper-warm hover:bg-paper-2 border-2 border-rule hover:border-sauge p-6 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer group shadow-sm"
          >
            <span className="font-serif text-[38px] text-ink group-hover:text-sauge">tu</span>
            <span className="font-ipa text-[18px] text-sauge font-bold">/ty/</span>
            <span className="text-[11.5px] text-ink-3">«tú» (Vocal anterior cerrada redondeada)</span>
          </button>

          <button
            type="button"
            onClick={() => handleHvptChoice('tout')}
            className="bg-paper-warm hover:bg-paper-2 border-2 border-rule hover:border-prune p-6 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer group shadow-sm"
          >
            <span className="font-serif text-[38px] text-ink group-hover:text-prune">tout</span>
            <span className="font-ipa text-[18px] text-prune font-bold">/tu/</span>
            <span className="text-[11.5px] text-ink-3">«todo» (Vocal posterior cerrada)</span>
          </button>
        </div>

        {hvptFeedback && (
          <div className="bg-sauge-wash border-l-4 border-sauge p-4 rounded-r-xl text-[13px] text-ink animate-fade-in">
            {hvptFeedback}
          </div>
        )}
      </div>

    </div>
  );
};
