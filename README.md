# WonderWord-UNI — Polyglotte Social & Laboratoire Phonétique

> **Plateforme Universitaire de Lecture Augmentée, Laboratoire de Phonétique & Shadowing, et Cercles de Lecture avec IA Contextuelle.**  
> *Projet de Master en Humanités Numériques : parcours NET (Numérique : Enjeux et Technologies) — Université Paris 8 (Vincennes - Saint-Denis).*

---

[🇫🇷 Version Française](#-version-française) | [🇪🇸 Versión en Español](#-versión-en-español)

---

## 🇫🇷 Version Française

### 🎯 Vision & Contexte Académique
**WonderWord-UNI** est une plateforme littéraire et linguistique conçue dans le cadre du **Master Humanités Numériques (parcours NET)** à l'**Université Paris 8**. 

Le projet explore l'intersection entre **l'édition numérique**, le **traitement automatique des langues (TAL)** et la **didactique des langues vivantes**, en combinant :
1. **Atelier de Lecture & Shadowing Phonétique** :
   - Expérience de lecture soignée inspirée de la tradition éditoriale française (typographies littéraires, texture de papier pressé et cinq pigments : Prune, Sauge, Soleil, Terre, Bleuet).
   - Gloses phonétiques interactives mot par mot avec l'**API (Alphabet Phonétique International)** via les balises sémantiques `<ruby>` et `<rt>`.
   - **Boucle d'entraînement au Shadowing** : Écoute de référence (TTS naturel), enregistrement audio via l'API Web Audio et retour articulatoire sur les phonèmes critiques du français (voyelles nasales `/ɑ̃/`, `/ɛ̃/`, `/ɔ̃/`, voyelle fermée `/y/`, consonne `/ʁ/` et liaisons obligatoires).
2. **Assistance Contextuelle par IA (Google Gemini 2.0 Flash)** :
   - Définitions en contexte littéraire, décryptage d'idiomatismes, analyse étymologique et quiz d'évaluation générés dynamiquement.
3. **Cercle de Lecture Social & Communauté** :
   - Authentification sécurisée via **Google OAuth 2.0**.
   - Profils publics, étagères de lecture (*En cours*, *À lire*, *Terminés*), citations annotées et commentaires en marge (*marginalia*).
   - Salons thématiques en temps réel (`#general`, `#club-francais`, `#phonetique`) et messagerie directe via WebSockets.
4. **Architecture Déployée & Accès Hybride** :
   - **Application Web** : Déployée sur **Azure for Students** (Static Web Apps, Blob Storage, App Service) sous le domaine [wonderword.luisbetancourt.fr](https://wonderword.luisbetancourt.fr).
   - **Carnet de Bord & Documentation Académique** : Site de documentation propulsé par **VitePress**, documentant les choix techniques et méthodologiques du master, déployé sur **GitHub Pages**.

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
├── docs/            # Site de documentation académique & méthodologique (VitePress pour GitHub Pages)
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
**WonderWord-UNI** es una plataforma literaria y lingüística diseñada en el marco del **Máster en Humanidades Digitales (mención NET: Numérique : Enjeux et Technologies)** de la **Université Paris 8**.

El proyecto investiga la intersección entre la **edición digital**, el **procesamiento del lenguaje natural (PLN)** y la **didáctica de lenguas vivas**, integrando:
1. **Lector Web & Laboratorio de Shadowing Fonético**:
   - Experiencia de lectura inspirada en la tradición editorial francesa (tipografía clásica, textura de papel prensado y cinco pigmentos: Ciruela, Salvia, Sol, Tierra y Aciano).
   - Glosas fonéticas interactivas palabra por palabra con el **IPA (Alfabeto Fonético Internacional)** mediante etiquetas semánticas `<ruby>` y `<rt>`.
   - **Bucle de entrenamiento de Shadowing**: Escucha de referencia (TTS natural), grabación de voz con Web Audio API y diagnóstico articulatorio de fonemas críticos del francés (vocales nasales `/ɑ̃/`, `/ɛ̃/`, `/ɔ̃/`, vocal cerrada `/y/`, consona `/ʁ/` y enlaces obligatorios / *liaisons*).
2. **Asistencia Contextual con IA (Google Gemini 2.0 Flash)**:
   - Definiciones literarias en contexto, explicación de modismos, análisis etimológico y generación interactiva de cuestionarios de comprensión.
3. **Club Social de Lectura y Comunidad**:
   - Autenticación con **Google OAuth 2.0**.
   - Perfil público, estanterías (*Leyendo*, *Por leer*, *Completados*), citas destacadas y notas al margen (*marginalia*).
   - Canales temáticos en tiempo real (`#general`, `#club-francais`, `#fonetica`) y mensajes directos con WebSockets.
4. **Despliegue e Infraestructura Híbrida**:
   - **Aplicación Web**: Desplegada en **Azure for Students** con dominio personalizado [wonderword.luisbetancourt.fr](https://wonderword.luisbetancourt.fr).
   - **Documentación Académica**: Cuaderno de bitácora y justificaciones del máster creados con **VitePress** y desplegados en **GitHub Pages**.
