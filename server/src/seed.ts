import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📚 Initialisation du catalogue littéraire de WonderWord-UNI...');

  // 1. LE PETIT PRINCE
  const petitPrince = await prisma.book.upsert({
    where: { slug: 'le-petit-prince' },
    update: {},
    create: {
      slug: 'le-petit-prince',
      title: 'Le Petit Prince',
      author: 'Antoine de Saint-Exupéry',
      description: 'Un aviateur tombe en panne dans le désert du Sahara et rencontre un jeune prince venu d\'un astéroïde lointain. Une fable poétique et philosophique sur l\'amour, l\'amitié et le sens de la vie.',
      coverColor: 'soleil',
      publisher: 'Éditions Gallimard (1943)',
      language: 'fr',
      cefrLevel: 'B1',
      year: 1943,
      genre: 'Conte philosophique',
      totalChapters: 3,
      totalWords: 3450,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Chapitre I — Le dessin de boa et les grandes personnes',
            wordCount: 820,
            contentHtml: `
              <p>Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait <em>Histoires Vécues</em>. Ça représentait un serpent boa qui avalait un fauve.</p>
              <p>On disait dans le livre : « Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion. »</p>
              <p>J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, avec un crayon de couleur, à tracer mon premier dessin. Mon dessin numéro 1. Il était comme ça :</p>
              <p>J'ai montré mon chef-d'œuvre aux grandes personnes et je leur ai demandé si mon dessin leur faisait peur. Elles m'ont répondu : « Pourquoi un chapeau ferait-il peur ? »</p>
              <p>Mon dessin ne représentait pas un chapeau. Il représentait un serpent boa qui digérait un éléphant. J'ai alors dessiné l'intérieur du serpent boa, afin que les grandes personnes puissent comprendre. Elles ont toujours besoin d'explications.</p>
              <p>Les grandes personnes m'ont conseillé de laisser de côté les dessins de serpents boas ouverts ou fermés, et de m'intéresser plutôt à la géographie, à l'histoire, au calcul et à la grammaire. C'est ainsi que j'ai abandonné, à l'âge de six ans, une magnifique carrière de peintre.</p>
            `,
          },
          {
            number: 2,
            title: 'Chapitre II — La rencontre dans le désert du Sahara',
            wordCount: 1120,
            contentHtml: `
              <p>J'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert du Sahara, il y a six ans. Quelque chose s'était cassé dans mon moteur. Et comme je n'avais avec moi ni mécanicien, ni passagers, je me préparai à réussir, tout seul, une difficile réparation. C'était pour moi une question de vie ou de mort. J'avais à peine de l'eau de boisson pour huit jours.</p>
              <p>Le premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'Océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait :</p>
              <p>— S'il vous plaît... dessine-moi un mouton !</p>
              <p>— Hein !</p>
              <p>— Dessine-moi un mouton...</p>
              <p>Je sautai sur mes pieds comme si j'avais été frappé par la foudre. Je me frottai bien les yeux. Je regardai bien. Et je vis un petit bonhomme tout à fait extraordinaire qui me considérait gravement. Voici le meilleur portrait que, plus tard, j'ai réussi à faire de lui. Mais mon dessin, bien sûr, est beaucoup moins ravissant que le modèle.</p>
              <p>Ce n'est pas ma faute. J'avais été découragé dans ma carrière de peintre par les grandes personnes à l'âge de six ans, et je n'avais rien appris à dessiner, sauf les boas fermés et les boas ouverts.</p>
              <p>Je regardai donc cette apparition avec des yeux ronds d'étonnement. N'oubliez pas que je me trouvais à mille milles de toute région habitée. Or mon petit bonhomme ne me semblait ni égaré, ni mort de fatigue, ni mort de faim, ni mort de soif, ni mort de peur. Il n'avait en rien l'apparence d'un enfant perdu au milieu du désert, à mille milles de toute région habitée.</p>
              <p>Quand je réussis enfin à parler, je lui dis :</p>
              <p>— Mais... qu'est-ce que tu fais là ?</p>
              <p>Et il me répéta alors, tout doucement, comme une chose très sérieuse :</p>
              <p>— S'il vous plaît... dessine-moi un mouton...</p>
            `,
          },
          {
            number: 3,
            title: 'Chapitre III — L\'astéroïde B 612 et la planète d\'origine',
            wordCount: 950,
            contentHtml: `
              <p>Il me fallut longtemps pour comprendre d'où il venait. Le petit prince, qui me posait beaucoup de questions, ne semblait jamais entendre les miennes. Ce sont des mots prononcés par hasard qui, peu à peu, m'ont tout révélé.</p>
              <p>Ainsi, quand il aperçut pour la première fois mon avion (je ne dessinerai pas mon avion, c'est un dessin beaucoup trop compliqué pour moi) il me demanda :</p>
              <p>— Qu'est-ce que c'est que cette chose-là ?</p>
              <p>— Ce n'est pas une chose. Ça vole. C'est un avion. C'est mon avion.</p>
              <p>Et j'étais fier de lui apprendre que je volais. Alors il s'écria :</p>
              <p>— Comment ! tu es tombé du ciel ?</p>
              <p>— Oui, fis-je modestement.</p>
              <p>— Ah ! ça c'est drôle...</p>
              <p>Et le petit prince eut un très joli éclat de rire qui m'irrita beaucoup. Je désire que l'on prenne mes malheurs au sérieux. Puis il ajouta :</p>
              <p>— Alors, toi aussi tu viens du ciel ! De quelle planète es-tu ?</p>
              <p>J'entrevis aussitôt une lueur, dans le mystère de sa présence, et j'interrogeai brusquement :</p>
              <p>— Tu viens donc d'une autre planète ?</p>
              <p>Mais il ne me répondit pas. Il hochait la tête doucement tout en regardant mon avion :</p>
              <p>— C'est vrai que, sur ça, tu ne peux pas venir de bien loin...</p>
            `,
          },
        ],
      },
    },
  });

  // 2. CANDIDE OU L'OPTIMISME
  await prisma.book.upsert({
    where: { slug: 'candide' },
    update: {},
    create: {
      slug: 'candide',
      title: 'Candide ou l\'Optimisme',
      author: 'Voltaire',
      description: 'Le jeune Candide est chassé du paradisiaque château de Thunder-ten-tronckh et parcourt un monde ravagé par les guerres, les catastrophes et le fanatisme religieux.',
      coverColor: 'prune',
      publisher: 'Domaine Public (1759)',
      language: 'fr',
      cefrLevel: 'B2',
      year: 1759,
      genre: 'Conte philosophique & Satire',
      totalChapters: 1,
      totalWords: 1400,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Chapitre I — Comment Candide fut élevé dans un beau château',
            wordCount: 1400,
            contentHtml: `
              <p>Il y avait en Westphalie, dans le château de monsieur le baron de Thunder-ten-tronckh, un jeune garçon à qui la nature avait donné les mœurs les plus douces. Sa physionomie annonçait son âme. Il avait le jugement assez droit, avec l'esprit le plus simple ; c'est, je crois, pour cette raison qu'on le nommait Candide.</p>
              <p>Les anciens domestiques de la maison soupçonnaient qu'il était fils de la sœur de monsieur le baron et d'un bon et honnête gentilhomme du voisinage, que cette demoiselle ne voulut jamais épouser parce qu'il n'avait pu prouver que soixante et onze quartiers, et que le reste de son arbre généalogique avait été perdu par l'injure du temps.</p>
              <p>Pangloss enseignait la métaphysico-théologo-cosmolonigologie. Il prouvait admirablement qu'il n'y a point d'effet sans cause, et que, dans ce meilleur des mondes possibles, le château de monseigneur le baron était le plus beau des châteaux, et madame la meilleure des baronnes possibles.</p>
              <p>« Il est démontré, disait-il, que les choses ne peuvent être autrement : car, tout étant fait pour une fin, tout est nécessairement pour la meilleure fin. Remarquez bien que les nez ont été faits pour porter des lunettes, aussi avons-nous des lunettes. Les jambes sont visiblement instituées pour être chaussées, et nous avons des chausses. »</p>
            `,
          },
        ],
      },
    },
  });

  // 3. VINGT MILLE LIEUES SOUS LES MERS
  await prisma.book.upsert({
    where: { slug: 'vingt-mille-lieues' },
    update: {},
    create: {
      slug: 'vingt-mille-lieues',
      title: 'Vingt Mille Lieues sous les mers',
      author: 'Jules Verne',
      description: 'L\'expédition du professeur Aronnax à la poursuite d\'un mystérieux monstre marin les mène à bord du Nautilus, le sous-marin révolutionnaire du fascinant Capitaine Nemo.',
      coverColor: 'bleuet',
      publisher: 'Éditions Hetzel (1870)',
      language: 'fr',
      cefrLevel: 'B1',
      year: 1870,
      genre: 'Aventure & Science-fiction classique',
      totalChapters: 1,
      totalWords: 1600,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Chapitre I — Un écueil fuyant',
            wordCount: 1600,
            contentHtml: `
              <p>L'année 1866 fut marquée par un événement bizarre, un phénomène inexpliqué et inexplicable qui n'a certainement été oublié de personne. Depuis quelque temps, plusieurs navires s'étaient rencontrés à la mer avec « une chose énorme », un objet long, fusiforme, parfois phosphorescent, infiniment plus grand et plus rapide qu'une baleine.</p>
              <p>Les faits relatifs à cette apparition, consignés sur différents livres de bord, s'accordaient assez exactement sur la structure de l'objet ou de l'être en question, la vitesse inouïe de ses mouvements, la puissance surprenante de sa locomotion, la vie particulière dont il semblait doué.</p>
            `,
          },
        ],
      },
    },
  });

  // 4. LE TOUR DU MONDE EN 80 JOURS
  await prisma.book.upsert({
    where: { slug: 'tour-du-monde' },
    update: {},
    create: {
      slug: 'tour-du-monde',
      title: 'Le Tour du monde en 80 jours',
      author: 'Jules Verne',
      description: 'Phileas Fogg, gentleman londonien à la ponctualité maniaque, parie vingt mille livres avec ses pairs du Reform Club qu\'il fera le tour de la terre en quatre-vingts jours seulement.',
      coverColor: 'sauge',
      publisher: 'Éditions Hetzel (1872)',
      language: 'fr',
      cefrLevel: 'A2',
      year: 1872,
      genre: 'Aventure géographique',
      totalChapters: 1,
      totalWords: 1200,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Chapitre I — Dans lequel Phileas Fogg et Passepartout s\'acceptent réciproquement',
            wordCount: 1200,
            contentHtml: `
              <p>En l'année 1872, la maison portant le numéro 7 de Saville-row, Burlington Gardens était habitée par Phileas Fogg, esq., l'un des membres les plus singuliers et les plus remarqués du Reform Club de Londres.</p>
              <p>Phileas Fogg était un personnage énigmatique, dont on ne savait rien, sinon que c'était un fort galant homme et l'un des plus beaux gentlemen de la haute société anglaise. Il passait pour être riche, sans que personne sût d'où lui venait sa fortune.</p>
            `,
          },
        ],
      },
    },
  });

  // 5. LES FLEURS DU MAL
  await prisma.book.upsert({
    where: { slug: 'fleurs-du-mal' },
    update: {},
    create: {
      slug: 'fleurs-du-mal',
      title: 'Les Fleurs du Mal',
      author: 'Charles Baudelaire',
      description: 'Chef-d\'œuvre de la poésie moderne française explorant la tension entre le Spleen et l\'Idéal, la beauté cachée dans la douleur et la mélancolie urbaine.',
      coverColor: 'terre',
      publisher: 'Auguste Poulet-Malassis (1857)',
      language: 'fr',
      cefrLevel: 'C1',
      year: 1857,
      genre: 'Poésie symboliste',
      totalChapters: 1,
      totalWords: 600,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Spleen et Idéal — L\'Albatros & Correspondances',
            wordCount: 600,
            contentHtml: `
              <p><strong>L'Albatros</strong></p>
              <p>Souvent, pour s'amuser, les hommes d'équipage<br>
              Prennent des albatros, vastes oiseaux des mers,<br>
              Qui suivent, indolents compagnons de voyage,<br>
              Le navire glissant sur les gouffres amers.</p>
              <p>À peine les ont-ils déposés sur les planches,<br>
              Que ces rois de l'azur, maladroits et honteux,<br>
              Laissent piteusement leurs grandes ailes blanches<br>
              Comme des avirons traîner à côté d'eux.</p>
              <p>Le Poète est semblable au prince des nuées<br>
              Qui hante la tempête et se rit de l'archer ;<br>
              Exilé sur le sol au milieu des huées,<br>
              Ses ailes de géant l'empêchent de marcher.</p>
            `,
          },
        ],
      },
    },
  });

  // 6. Associer Le Petit Prince aux utilisateurs existants (dont luis@paris8.fr)
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: petitPrince.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        bookId: petitPrince.id,
        currentChapter: 2,
        progressPercent: 45.0,
        status: 'reading',
      },
    });
  }

  console.log(`✅ Catalogue alimenté avec succès : 5 œuvres majeures du patrimoine littéraire français.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
