# WonderWord-UNI — Polyglotte Social & Laboratoire Phonétique

> **Plateforme Universitaire de Lecture Augmentée, Laboratoire de Phonétique & Shadowing, et Cercles de Lecture avec IA Contextuelle.**  
> *Projet de Master en Humanités Numériques : parcours NET (Numérique : Enjeux et Technologies) — Université Paris 8 (Vincennes - Saint-Denis).*

[![Documentation](https://img.shields.io/badge/Documentation-Carnet_de_Bord-53335a?style=flat-square&logo=github)](https://luisbetancourtd.github.io/WonderWord-UNI/)
[![Université Paris 8](https://img.shields.io/badge/Paris_8-Master_HN_NET-006a64?style=flat-square)](https://www.univ-paris8.fr/)
[![Domaine](https://img.shields.io/badge/Web-wonderword.luisbetancourt.fr-ffcd11?style=flat-square)](https://wonderword.luisbetancourt.fr)

---

[🇫🇷 Version Française](#-version-française) | [🇪🇸 Versión en Español](#-versión-en-español) | [📖 Livraison 01](https://luisbetancourtd.github.io/WonderWord-UNI/index.html) | [☁️ Livraison 02](https://luisbetancourtd.github.io/WonderWord-UNI/index0.html) | [📚 Livraison 03 (Atelier de Lecture)](https://luisbetancourtd.github.io/WonderWord-UNI/index2.html)

---

## 🇫🇷 Version Française

### 🎯 Vision & Contexte Académique
**WonderWord-UNI** est une plateforme littéraire et linguistique née de la passion pour l'apprentissage des langues et de l'amour de la lecture. Le projet se développe dans le cadre du **Master en Humanités Numériques (parcours NET : Numérique : Enjeux et Technologies)** à l'**Université Paris 8**. 

Le projet explore l'intersection entre **l'édition numérique**, le **traitement automatique des langues (TAL)** et la **didactique des langues vivantes**, en articulant :

1. **Atelier de Lecture & Laboratoire de Shadowing Phonétique** :
   - **Interface éditoriale soignée** : Typographie classique (`Libre Caslon Text`, `Hanken Grotesk`), texture de papier pressé et cinq pigments inspirés des reliures d'art (*Prune, Sauge, Soleil, Terre, Bleuet*).
   - **Gloses phonétiques interactives** : Notation mot par mot avec l'**API (Alphabet Phonétique International)** à l'aide de la typographie linguistique `Charis SIL` et des balises sémantiques `<ruby>` et `<rt>`.
   - **Boucle d'entraînement au Shadowing & Analyse Acoustique** : Écoute de référence (synthèse vocale naturelle), capture audio via l'API Web Audio et diagnostic articulatoire en 3 axes (reconnaissance lexicale, formantes $F_1/F_2$ des voyelles critiques `/y/`, `/u/`, consonnes uvulaires `/ʁ/`, voyelles nasales et liaisons obligatoires).
2. **Microservice Phonétique Souverain (Python & Praat / Parselmouth)** :
   - Traitement acoustique 100% automatisé (*headless*) côté serveur via `parselmouth` (moteur Praat en C++ pour Python), calcul formantique et alignement temporel (DTW) sans dépendance d'API payante.
3. **Assistance Contextuelle par IA (Google Gemini 2.0 Flash)** :
   - Définitions adaptées au contexte littéraire, décryptage d'idiomatismes, analyse étymologique et génération dynamique de questionnaires de compréhension.
4. **Cercle Social de Lecture & Communauté** :
   - Authentification sécurisée via **Google OAuth 2.0**.
   - Profil public personnalisable, étagères de lecture (*En cours*, *À lire*, *Terminés*), citations marquantes partagées et annotations au fil du texte (*marginalia*).
   - Salons thématiques en temps réel (`#general`, `#club-francais`, `#fonetique`) et messagerie directe via WebSockets.
5. **Déploiement & Infrastructure Hybride** :
   - **Application Web** : Déployée sur **Azure for Students** (Static Web Apps, Blob Storage, App Service / Linux VM) sous le domaine [wonderword.luisbetancourt.fr](https://wonderword.luisbetancourt.fr).
   - **Documentation & Carnet de Bord** : Carnet de bord scientifique et dossier académique consultables sur **[GitHub Pages](https://luisbetancourtd.github.io/WonderWord-UNI/)**.

---

### 🏗️ Pile Technologique

| Couche | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, `ePub.js`, Web Audio API |
| **Typographies** | `Libre Caslon Text` (Prose), `Hanken Grotesk` (Interface), `Charis SIL` (API Phonétique) |
| **Laboratoire Acoustique** | Python 3.12, `parselmouth` (Moteur Praat), FastAPI, Vosk-FR, DTW |
| **Backend & Temps Réel** | Node.js, Fastify / Express, TypeScript, Socket.io |
| **Base de Données** | PostgreSQL, Prisma ORM |
| **IA & NLP** | Google Gemini 2.0 Flash (`@google/genai`) |
| **Cloud & Hébergement**| Azure Static Web Apps, Azure VM Linux B1s, Azure Blob Storage, GitHub Pages |

---

### 📁 Organisation du Répertoire
```text
WonderWord-UNI/
├── index.html       # Livraison 01 : Genèse, Identité Aquarelle & Prototypes
├── index0.html      # Livraison 02 : Cloud Azure, Docker Compose, SSL, CI/CD & Bibliothèque
├── index2.html      # Livraison 03 : Atelier de Lecture Critique, G2P 5 Langues & Hub FSRS/Shadowing
├── docs/            # Miroir synchronisé du Carnet de Bord académique (GitHub Pages)
│   ├── assets/      # Captures d'écran haute définition des interfaces
│   └── prototype/   # Démos interactives HTML autonomes (Dashboard, Lecteur, Bibliothèque, Shadowing)
├── client/          # Application Web Frontend (React 19 + TypeScript + Tailwind CSS + Nginx)
├── server/          # API REST & Moteur Linguistique G2P (Node.js + Fastify 5 + Prisma ORM)
├── docker-compose.yml # Orchestration multi-conteneurs (PostgreSQL 17, Fastify, React)
└── README.md        # Présentation bilingue officielle du projet
```

---

### 🗺️ Feuilles de Route (Roadmap)
- [x] **Phase 1 (Livraison 01)** : Carnet de bord initial (GitHub Pages) & Démos interactives des 4 prototypes clés (`index.html`).
- [x] **Phase 2 (Livraison 02)** : Infrastructure Cloud Azure (`wonderword.luisbetancourt.fr`), Docker Compose, PostgreSQL + Prisma, Auth (Bcrypt, Resend, Google OAuth 2.0) & Bibliothèque Littéraire connectée à Gutenberg/DraCor (`index0.html`).
- [x] **Phase 3 (Livraison 03)** : Atelier de Lecture Critique complet (`ReaderView.tsx`) avec Studio 2 colonnes (`/reader`), import `.EPUB/.PDF/.TXT`, Visor paginé (`/reader/:id`), moteur G2P 5 langues, liaisons françaises (`‿`), filtre FSRS adaptatif et pont vers le Shadowing (`index2.html`).
- [ ] **Phase 4** : Microservice Python / Praat (`parselmouth`) pour l'analyse formantique acoustique des voyelles et le diagnostic de Shadowing.
- [ ] **Phase 5** : Système social, cercles de lecture, partage de livres annotés et messagerie WebSockets.
- [ ] **Phase 6** : Consolidation finale et soutenance du Master à l'Université Paris 8.

---

## 🇪🇸 Versión en Español

### 🎯 Visión y Contexto Académico
**WonderWord-UNI** es una plataforma literaria y lingüística que nace de la pasión por el aprendizaje de lenguas y el amor por la lectura. El proyecto se desarrolla en el marco del **Máster en Humanidades Digitales (mención NET: Numérique : Enjeux et Technologies)** de la **Université Paris 8**.

El proyecto pretende explorar la intersección entre la **edición digital**, el **procesamiento del lenguaje natural (PLN)** y la **didáctica de lenguas vivas**, integrando:

1. **Lector Web & Laboratorio de Shadowing Fonético**:
   - **UI con diseño editorial**: Tipografía clásica (`Libre Caslon Text`, `Hanken Grotesk`), textura de papel prensado y cinco pigmentos inspirados en la encuadernación tradicional (*Ciruela, Salvia, Sol, Tierra y Aciano*).
   - **Glosas fonéticas interactivas palabra por palabra**: Transcripción con el **IPA (Alfabeto Fonético Internacional)** mediante la fuente `Charis SIL` y las etiquetas semánticas `<ruby>` y `<rt>`.
   - **Bucle de entrenamiento de Shadowing**: Escucha de referencia (TTS natural), grabación de voz con Web Audio API y diagnóstico articulatorio en 3 ejes (precisión léxica, formantes acústicos $F_1/F_2$ en vocales `/y/` vs `/u/`, consonante `/ʁ/`, nasales y *liaisons* obligatorias).
2. **Microservicio Fonético Soberano (Python & Praat / Parselmouth)**:
   - Análisis acústico automatizado (*headless*) en servidor mediante `parselmouth` (Praat en C++ para Python), cálculo de formantes y alineación temporal (DTW) sin dependencia de APIs de pago.
3. **Asistencia Contextual con IA (Google Gemini 2.0 Flash)**:
   - Definiciones literarias en contexto, explicación de modismos, análisis etimológico y generación interactiva de cuestionarios de comprensión.
4. **Club Social de Lectura y Comunidad**:
   - Autenticación segura con **Google OAuth 2.0**.
   - Perfil público, estanterías (*Leyendo*, *Por leer*, *Completados*), citas destacadas y notas al margen (*marginalia*).
   - Canales temáticos en tiempo real (`#general`, `#club-francais`, `#fonetica`) y mensajes directos con WebSockets.
5. **Despliegue e Infraestructura Híbrida**:
   - **Aplicación Web**: Desplegada en **Azure for Students** con dominio personalizado [wonderword.luisbetancourt.fr](https://wonderword.luisbetancourt.fr).
   - **Documentación Académica**: Cuaderno de bitácora y justificaciones del máster consultables en vivo en **[GitHub Pages](https://luisbetancourtd.github.io/WonderWord-UNI/)**.
