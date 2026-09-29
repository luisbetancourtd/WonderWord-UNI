# WonderWord-UNI — Polyglotte Social & Laboratoire Phonétique

> **Plateforme Universitaire de Lecture Augmentée, Laboratoire de Phonétique & Shadowing, et Cercles de Lecture avec IA Contextuelle.**  
> *Projet de Master en Humanités Numériques : parcours NET (Numérique : Enjeux et Technologies) — Université Paris 8 (Vincennes - Saint-Denis).*

---

[🇫🇷 Version Française](#-version-française) | [🇪🇸 Versión en Español](#-versión-en-español)

---

## 🇫🇷 Version Française

### 🎯 Vision & Contexte Académique
**WonderWord-UNI** est une plateforme littéraire et linguistique née de la passion pour l'apprentissage des langues et de l'amour de la lecture. Le projet se développe dans le cadre du **Master en Humanités Numériques (parcours NET : Numérique : Enjeux et Technologies)** à l'**Université Paris 8**. 

Le projet se positionne à l'intersection entre **l'édition numérique**, le **traitement automatique des langues (TAL)** et la **didactique des langues vivantes**, en intégrant :

1. **Atelier de Lecture & Laboratoire de Shadowing Phonétique** :
   - **Interface éditoriale soignée** : Typographie classique (`Libre Caslon Text`, `Hanken Grotesk`), texture de papier pressé et cinq pigments inspirés des reliures d'art (*Prune, Sauge, Soleil, Terre, Bleuet*).
   - **Gloses phonétiques interactives** : Notation mot par mot avec l'**API (Alphabet Phonétique International)** à l'aide de la typographie linguistique `Charis SIL` et des balises sémantiques `<ruby>` et `<rt>`.
   - **Boucle d'entraînement au Shadowing** : Écoute de référence (synthèse vocale TTS naturelle), enregistrement audio via l'API Web Audio et diagnostic articulatoire sur les phonèmes critiques du français (voyelles nasales `/ɑ̃/`, `/ɛ̃/`, `/ɔ̃/`, voyelle fermée `/y/`, consonne `/ʁ/` et liaisons obligatoires).
2. **Assistance Contextuelle par IA (Google Gemini 2.0 Flash)** :
   - Définitions adaptées au contexte littéraire, décryptage d'idiomatismes, analyse étymologique et génération dynamique de questionnaires de compréhension.
3. **Cercle Social de Lecture & Communauté** :
   - Authentification sécurisée via **Google OAuth 2.0**.
   - Profil public personnalisable, étagères de lecture (*En cours*, *À lire*, *Terminés*), citations marquantes partagées et annotations au fil du texte (*marginalia*).
   - Salons thématiques en temps réel (`#general`, `#club-francais`, `#fonetique`) et messagerie directe via WebSockets.
4. **Déploiement & Infrastructure Hybride** :
   - **Application Web** : Déployée sur **Azure for Students** (Static Web Apps, Blob Storage, App Service) sous le domaine personnalisé [wonderword.luisbetancourt.fr](https://wonderword.luisbetancourt.fr).
   - **Documentation Académique** : Carnet de bord et dossier d'évaluation du Master conçus avec **VitePress** et déployés sur **GitHub Pages**.

---

### 🏗️ Pile Technologique

| Couche | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, `ePub.js`, Web Audio API |
| **Typographies** | `Libre Caslon Text` (Prose), `Hanken Grotesk` (Interface), `Charis SIL` (API Phonétique) |
| **Documentation**| VitePress, Markdown, GitHub Actions & GitHub Pages |
| **Backend** | Node.js, Fastify / Express, TypeScript, Socket.io |
| **Base de Données** | PostgreSQL, Prisma ORM |
| **IA & TAL** | Google Gemini 2.0 Flash (`@google/genai`), Web Speech API |
| **Cloud & Hébergement**| Azure Static Web Apps, Azure Blob Storage, Azure App Service, GitHub Pages |

---

### 📁 Organisation du Répertoire
```text
WonderWord-UNI/
├── docs/            # Documentation académique & carnet de bord (VitePress pour GitHub Pages)
├── client/          # Application Web Frontend (React + TypeScript + Tailwind)
├── server/          # API REST & Serveur WebSockets en temps réel (Node.js + Fastify)
├── prisma/          # Schéma de base de données relationnelle & migrations (PostgreSQL)
└── README.md        # Présentation bilingue du projet
```

---

### 🗺️ Feuilles de Route (Roadmap)
- [ ] **Phase 1** : Documentation initiale (VitePress + GitHub Pages) & Initialisation du modèle de données (Prisma + PostgreSQL).
- [ ] **Phase 2** : Interface utilisateur (React + Tailwind) reprenant le système des 5 pigments et la texture papier.
- [ ] **Phase 3** : Module de lecture interactive avec notation phonétique API (`<ruby><rt>`) et intégration d'ePub.js.
- [ ] **Phase 4** : Studio de Shadowing (capture audio, forme d'onde, comparaison phonétique et retours Gemini).
- [ ] **Phase 5** : Réseau social, étagères virtuelles, citations publiques et salons de discussion Socket.io.
- [ ] **Phase 6** : Déploiement en production sur Azure (`wonderword.luisbetancourt.fr`) et soutenance du Master.

---

## 🇪🇸 Versión en Español

### 🎯 Visión y Contexto Académico
**WonderWord-UNI** es una plataforma literaria y lingüística que nace de la pasión por el aprendizaje de lenguas y el amor por la lectura. El proyecto se desarrolla en el marco del **Máster en Humanidades Digitales (mención NET: Numérique : Enjeux et Technologies)** de la **Université Paris 8**.

El proyecto pretende explorar la intersección entre la **edición digital**, el **procesamiento del lenguaje natural (PLN)** y la **didáctica de lenguas vivas**, integrando:

1. **Lector Web & Laboratorio de Shadowing Fonético**:
   - **UI con diseño editorial**: Tipografía clásica (`Libre Caslon Text`, `Hanken Grotesk`), textura de papel prensado y cinco pigmentos inspirados en la encuadernación tradicional (*Ciruela, Salvia, Sol, Tierra y Aciano*).
   - **Glosas fonéticas interactivas palabra por palabra**: Transcripción fonética con el **IPA (Alfabeto Fonético Internacional)** mediante la fuente especializada `Charis SIL` y las etiquetas semánticas `<ruby>` y `<rt>`.
   - **Bucle de entrenamiento de Shadowing**: Escucha de referencia (TTS natural), grabación de voz con Web Audio API y diagnóstico articulatorio de fonemas críticos del francés (vocales nasales `/ɑ̃/`, `/ɛ̃/`, `/ɔ̃/`, vocal cerrada `/y/`, consonante `/ʁ/` y enlaces obligatorios / *liaisons*).
2. **Asistencia Contextual con IA (Google Gemini 2.0 Flash)**:
   - Definiciones literarias en contexto, explicación de modismos, análisis etimológico y generación interactiva de cuestionarios de comprensión.
3. **Club Social de Lectura y Comunidad**:
   - Autenticación segura con **Google OAuth 2.0**.
   - Perfil público personalizable, estanterías (*Leyendo*, *Por leer*, *Completados*), citas destacadas públicas y notas al margen (*marginalia*).
   - Canales temáticos en tiempo real (`#general`, `#club-francais`, `#fonetica`) y mensajes directos con WebSockets.
4. **Despliegue e Infraestructura Híbrida**:
   - **Aplicación Web**: Desplegada en **Azure for Students** con dominio personalizado [wonderword.luisbetancourt.fr](https://wonderword.luisbetancourt.fr).
   - **Documentación Académica**: Cuaderno de bitácora y justificaciones del máster creados con **VitePress** y desplegados en **GitHub Pages**.
