import React, { useState } from 'react';
import { Volume2, Bookmark, Highlighter, Sparkles, X } from 'lucide-react';

interface SelectedWord {
  word: string;
  ipa: string;
  translation: string;
  definition: string;
  grammatical: string;
}

export const ReaderView: React.FC = () => {
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);

  const handleWordClick = (word: string, ipa: string, translation: string, definition: string, grammatical: string) => {
    setSelectedWord({ word, ipa, translation, definition, grammatical });
  };

  return (
    <div className="max-w-[1080px] mx-auto w-full px-10 py-10 space-y-8 relative">
      
      {/* Barre d'outils du Lecteur */}
      <div className="bg-paper border border-rule rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-sauge bg-sauge-wash px-2.5 py-1 rounded-full">
            Édition Critique · Français B1
          </span>
          <span className="text-xs text-ink-2 font-medium">
            Antoine de Saint-Exupéry
          </span>
        </div>

        {/* Contrôles de lecture */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm text-xs font-semibold text-ink-2 transition-colors"
          >
            <Bookmark size={13} />
            <span>Marcadores</span>
          </button>

          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm text-xs font-semibold text-ink-2 transition-colors"
          >
            <Highlighter size={13} />
            <span>Subrayar</span>
          </button>

          <span className="w-px h-4 bg-rule" />

          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sauge-wash text-sauge font-bold text-xs hover:bg-sauge/20 transition-colors"
          >
            <Volume2 size={14} />
            <span>Audio V.O.</span>
          </button>
        </div>
      </div>

      {/* Papel de Lectura Principal */}
      <div className="bg-paper border border-rule rounded-3xl p-12 md:p-16 shadow-lg min-h-[600px] relative">
        
        {/* Titre du Chapitre */}
        <div className="text-center mb-12 border-b border-rule/60 pb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-ink-3 mb-2">
            Chapitre II
          </p>
          <h1 className="font-serif text-[42px] font-normal text-ink m-0">
            Le Petit Prince
          </h1>
        </div>

        {/* Prosa con Lettrine y Ruby IPA interactivo */}
        <div className="font-serif text-[22px] md:text-[24px] leading-[2.2] text-ink text-justify space-y-8 select-text">
          <p>
            <span className="drop-cap">J</span>
            'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert de{' '}
            <ruby 
              className="target-word" 
              onClick={() => handleWordClick('Sahara', '/sa.a.ʁa/', 'Sáhara', 'Grand désert situé dans la partie nord du continent africain.', 'Nom propre géographique')}
            >
              Sahara<rt>/sa.a.ʁa/</rt>
            </ruby>
            , il y a six ans. Quelque chose s'était cassé dans mon moteur. Et comme je n'avais avec moi ni mécanicien, ni passagers, je me préparais à essayer de réussir, tout seul, une{' '}
            <ruby 
              className="target-word"
              onClick={() => handleWordClick('réparation', '/ʁe.pa.ʁa.sjɔ̃/', 'reparación', 'Action de remettre en bon état un mécanisme endommagé.', 'Nom féminin')}
            >
              réparation<rt>/ʁe.pa.ʁa.sjɔ̃/</rt>
            </ruby>{' '}
            difficile. C'était pour moi une question de vie ou de mort. J'avais de l'eau à boire à peine pour huit jours.
          </p>

          <p>
            Le premier soir je me suis donc endormi sur le sable à{' '}
            <ruby 
              className="target-word"
              onClick={() => handleWordClick('mille', '/mil/', 'mil', 'Nombre désignant dix fois cent. Note : le groupe "ll" se prononce /l/ et non /j/.', 'Adjectif numéral')}
            >
              mille<rt>/mil/</rt>
            </ruby>{' '}
            milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait :
          </p>

          <blockquote className="pl-6 border-l-2 border-soleil my-6 italic text-ink-2 space-y-2">
            <p>
              — S'il vous plaît…{' '}
              <ruby 
                className="target-word"
                onClick={() => handleWordClick('dessine-moi', '/de.sin.mwa/', 'dibújame', 'Forme impérative du verbe dessiner avec pronom personnel réfléchi.', 'Verbe transitif')}
              >
                dessine-moi<rt>/de.sin.mwa/</rt>
              </ruby>{' '}
              un mouton !
            </p>
            <p>— Hein !</p>
            <p>— Dessine-moi un mouton…</p>
          </blockquote>
        </div>
      </div>

      {/* PANNEAU FLOTTANT (WORDPANEL) LORS D'UN CLIC SUR UN MOT */}
      {selectedWord && (
        <div className="fixed right-10 bottom-10 w-[360px] bg-paper rounded-2xl border border-rule shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-sauge bg-sauge-wash px-2 py-0.5 rounded">
                {selectedWord.grammatical}
              </span>
              <h3 className="font-serif text-[28px] font-normal text-ink m-0 mt-1">
                {selectedWord.word}
              </h3>
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedWord(null)}
              className="text-ink-3 hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="font-ipa text-[16px] text-sauge font-bold">
              {selectedWord.ipa}
            </span>
            <span className="text-sm font-semibold text-terre-ink">
              « {selectedWord.translation} »
            </span>
          </div>

          <p className="text-[13.5px] text-ink-2 leading-relaxed mb-4 border-t border-rule-soft pt-3">
            {selectedWord.definition}
          </p>

          <div className="flex gap-2">
            <button 
              type="button"
              className="flex-1 bg-prune hover:bg-prune-2 text-white font-bold text-xs py-2.5 rounded-full transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Analyse Contextuelle IA</span>
            </button>
            <button 
              type="button"
              className="px-3 bg-paper-warm hover:bg-paper-2 border border-rule rounded-full text-ink text-xs font-bold transition-colors"
              title="Écouter la prononciation"
            >
              <Volume2 size={15} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
