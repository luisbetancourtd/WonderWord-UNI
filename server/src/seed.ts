import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📚 Initialisation du catalogue littéraire de WonderWord-UNI...');

  // 1. LE PETIT PRINCE
  const petitPrince = await prisma.book.upsert({
    where: { slug: 'le-petit-prince' },
    update: {
      coverImage: 'https://covers.openlibrary.org/b/id/10708272-M.jpg',
    },
    create: {
      slug: 'le-petit-prince',
      title: 'Le Petit Prince',
      author: 'Antoine de Saint-Exupéry',
      description: 'Un aviateur tombe en panne dans le désert du Sahara et rencontre un jeune prince venu d\'un astéroïde lointain. Une fable poétique et philosophique sur l\'amour, l\'amitié et le sens de la vie.',
      coverColor: 'soleil',
      coverImage: 'https://covers.openlibrary.org/b/id/10708272-M.jpg',
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
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/4650/pg4650.cover.medium.jpg',
    },
    create: {
      slug: 'candide',
      title: 'Candide ou l\'Optimisme',
      author: 'Voltaire',
      description: 'Le jeune Candide est chassé du paradisiaque château de Thunder-ten-tronckh et parcourt un monde ravagé par les guerres, les catastrophes et le fanatisme religieux.',
      coverColor: 'prune',
      coverImage: 'https://www.gutenberg.org/cache/epub/4650/pg4650.cover.medium.jpg',
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
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/5081/pg5081.cover.medium.jpg',
    },
    create: {
      slug: 'vingt-mille-lieues',
      title: 'Vingt Mille Lieues sous les mers',
      author: 'Jules Verne',
      description: 'L\'expédition du professeur Aronnax à la poursuite d\'un mystérieux monstre marin les mène à bord du Nautilus, le sous-marin révolutionnaire du fascinant Capitaine Nemo.',
      coverColor: 'bleuet',
      coverImage: 'https://www.gutenberg.org/cache/epub/5081/pg5081.cover.medium.jpg',
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
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/800/pg800.cover.medium.jpg',
    },
    create: {
      slug: 'tour-du-monde',
      title: 'Le Tour du monde en 80 jours',
      author: 'Jules Verne',
      description: 'Phileas Fogg, gentleman londonien à la ponctualité maniaque, parie vingt mille livres avec ses pairs du Reform Club qu\'il fera le tour de la terre en quatre-vingts jours seulement.',
      coverColor: 'sauge',
      coverImage: 'https://www.gutenberg.org/cache/epub/800/pg800.cover.medium.jpg',
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
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/6099/pg6099.cover.medium.jpg',
    },
    create: {
      slug: 'fleurs-du-mal',
      title: 'Les Fleurs du Mal',
      author: 'Charles Baudelaire',
      description: 'Chef-d\'œuvre de la poésie moderne française explorant la tension entre le Spleen et l\'Idéal, la beauté cachée dans la douleur et la mélancolie urbaine.',
      coverColor: 'terre',
      coverImage: 'https://www.gutenberg.org/cache/epub/6099/pg6099.cover.medium.jpg',
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
            title: "Spleen et Idéal — L'Albatros & Correspondances",
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

  // 6. DIE VERWANDLUNG (Franz Kafka - Allemand B1/B2)
  const dieVerwandlung = await prisma.book.upsert({
    where: { slug: 'die-verwandlung' },
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/22367/pg22367.cover.medium.jpg',
    },
    create: {
      slug: 'die-verwandlung',
      title: 'Die Verwandlung',
      author: 'Franz Kafka',
      description: 'Gregor Samsa, commis voyageur dévoué à sa famille, se réveille un matin métamorphosé en un monstrueux insecte. Un chef-d\'œuvre absolu de la littérature germanophone explorant l\'aliénation, la culpabilité et l\'absurde.',
      coverColor: 'terre',
      coverImage: 'https://www.gutenberg.org/cache/epub/22367/pg22367.cover.medium.jpg',
      publisher: 'Kurt Wolff Verlag (1915) / Domaine Public',
      language: 'de',
      cefrLevel: 'B1',
      year: 1915,
      genre: 'Erzählung & Absurde Literatur',
      totalChapters: 1,
      totalWords: 1250,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Erster Abschnitt — Das Erwachen als ungeheures Ungeziefer',
            wordCount: 1250,
            contentHtml: `
              <p>Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.</p>
              <p>»Was ist mit mir geschehen?«, dachte er. Es war kein Traum. Sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine aufgeschnittene Mustersammlung von Tuchwaren ausgebreitet war — Samsa war Reisender —, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten und in einen hübschen, vergoldeten Rahmen getan hatte. Es stellte eine Dame dar, die, mit einem Pelzhut und einer Pelzboa versehen, aufrecht dasaß und einen schweren Pelzmuff, in dem ihr ganzer Unterarm verschwunden war, dem Beschauer entgegenhob.</p>
              <p>Gregors Blick richtete sich dann zum Fenster, und das trübe Wetter — man hörte Regentropfen auf das Fensterblech aufschlagen — machte ihn ganz melancholisch. »Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Verrücktheiten vergäße«, dachte er, aber das war gänzlich unausführbar, denn er war gewohnt, auf der rechten Seite zu schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in diese Lage bringen. Mit welcher Kraft er sich auch auf die rechte Seite warf, immer wieder schaukelte er in die Rückenlage zurück.</p>
            `,
          },
        ],
      },
    },
  });

  // 7. KINDER- UND HAUSMÄRCHEN : ROTKÄPPCHEN (Brüder Grimm - Allemand A2)
  await prisma.book.upsert({
    where: { slug: 'grimms-maerchen' },
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/5314/pg5314.cover.medium.jpg',
    },
    create: {
      slug: 'grimms-maerchen',
      title: 'Kinder- und Hausmärchen (Rotkäppchen)',
      author: 'Brüder Grimm',
      description: 'Le recueil fondamental des contes populaires allemands collectés par Jacob et Wilhelm Grimm. Une langue limpide, musicale et idéale pour les apprenants francophones au niveau A2.',
      coverColor: 'sauge',
      coverImage: 'https://www.gutenberg.org/cache/epub/5314/pg5314.cover.medium.jpg',
      publisher: 'Realschulbuchhandlung Berlin (1812) / Domaine Public',
      language: 'de',
      cefrLevel: 'A2',
      year: 1812,
      genre: 'Volksmärchen',
      totalChapters: 1,
      totalWords: 950,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Rotkäppchen — Begegnung mit dem Wolf im Wald',
            wordCount: 950,
            contentHtml: `
              <p>Es war einmal eine kleine süße Dirne, die hatte jedermann lieb, der sie nur ansah, am allerliebsten aber ihre Großmutter, die wußte gar nicht, was sie alles dem Kinde geben sollte. Einmal schenkte sie ihm ein Käppchen von rotem Sammet, und weil ihm das so wohl stand, und es nichts anders mehr tragen wollte, hieß es nur das Rotkäppchen.</p>
              <p>Eines Tages sprach seine Mutter zu ihm: »Komm, Rotkäppchen, da hast du ein Stück Kuchen und eine Flasche Wein, bring das der Großmutter hinaus; sie ist krank und schwach und wird sich daran laben. Mach dich auf, bevor es heiß wird, und wenn du hinauskommst, so geh hübsch sittsam und lauf nicht vom Weg ab, sonst fällst du und zerbrichst das Glas, und die Großmutter hat nichts. Und wenn du in ihre Stube kommst, so vergiß nicht, guten Morgen zu sagen, und guck nicht erst in alle Ecken herum.«</p>
              <p>»Ich will schon alles gut machen«, sagte Rotkäppchen zur Mutter, und gab ihr die Hand darauf. Die Großmutter aber wohnte draußen im Wald, eine halbe Stunde vom Dorf. Wie nun Rotkäppchen in den Wald kam, begegnete ihm der Wolf. Rotkäppchen aber wußte nicht, was das für ein böses Tier war, und fürchtete sich nicht vor ihm.</p>
            `,
          },
        ],
      },
    },
  });

  // 8. FAUST : DER TRAGÖDIE ERSTER TEIL (Goethe - Allemand C1)
  await prisma.book.upsert({
    where: { slug: 'faust-goethe' },
    update: {
      coverImage: 'https://www.gutenberg.org/cache/epub/2229/pg2229.cover.medium.jpg',
    },
    create: {
      slug: 'faust-goethe',
      title: 'Faust : Der Tragödie erster Teil',
      author: 'Johann Wolfgang von Goethe',
      description: 'Sommet de la dramaturgie et de la poésie philosophique allemande. Le docteur Faust, désespéré par les limites du savoir humain, conclut un pacte avec Méphistophélès.',
      coverColor: 'prune',
      coverImage: 'https://www.gutenberg.org/cache/epub/2229/pg2229.cover.medium.jpg',
      publisher: 'Cotta\'sche Verlagsbuchhandlung (1808) / Domaine Public',
      language: 'de',
      cefrLevel: 'C1',
      year: 1808,
      genre: 'Klassisches Drama & Tragödie',
      totalChapters: 1,
      totalWords: 750,
      chapters: {
        create: [
          {
            number: 1,
            title: 'Nacht — In einem hochgewölbten, engen gotischen Zimmer',
            wordCount: 750,
            contentHtml: `
              <p><strong>Faust (unruhig auf seinem Sessel am Pulte) :</strong></p>
              <p>Habe nun, ach! Philosophie,<br>
              Juristerei und Medizin,<br>
              Und leider auch Theologie<br>
              Durchaus studiert, mit heißem Bemühn.<br>
              Da steh ich nun, ich armer Tor!<br>
              Und bin so klug als wie zuvor;<br>
              Heiße Magister, heiße Doktor gar<br>
              Und ziehe schon an die zehen Jahr<br>
              Herauf, herab und quer und krumm<br>
              Meine Schüler an der Nase herum —<br>
              Und sehe, daß wir nichts wissen können!<br>
              Das will mir schier das Herz verbrennen.</p>
              <p>Drum hab ich mich der Magie ergeben,<br>
              Ob mir durch Geistes Kraft und Mund<br>
              Nicht manch Geheimnis würde kund;<br>
              Daß ich nicht mehr mit saurem Schweiß<br>
              Zu sagen brauche, was ich nicht weiß;<br>
              Daß ich erkenne, was die Welt<br>
              Im Innersten zusammenhält,<br>
              Schau alle Wirkenskraft und Samen,<br>
              Und tu nicht mehr in Worten kramen.</p>
            `,
          },
        ],
      },
    },
  });

  // Associer les livres phares aux utilisateurs existants (dont luis@paris8.fr)
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

    await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: dieVerwandlung.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        bookId: dieVerwandlung.id,
        currentChapter: 1,
        progressPercent: 10.0,
        status: 'reading',
      },
    });
  }

  console.log(`✅ Catalogue alimenté avec succès : 8 chefs-d'œuvre bilingues (Français & Allemand).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
