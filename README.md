# 🌾 PI-S3 — BetterAgri 🇲🇷  
**Plateforme Agricole Intelligente pour la Mauritanie**

---

## 📌 Table des Matières
- [Présentation](#-présentation)
- [Problématique & Vision](#-problématique--vision)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture du Projet](#-architecture-du-projet)
- [Technologies Utilisées](#-technologies-utilisées)
- [Installation & Configuration](#-installation--configuration)
- [Variables d’Environnement](#-variables-denvironnement)
- [Déploiement avec Docker](#-déploiement-avec-docker)
- [Sécurité & Authentification](#-sécurité--authentification)
- [Notifications & Emails](#-notifications--emails)
- [État du Projet](#-état-du-projet)
- [Contribuer](#-contribuer)
- [Licence](#-licence)
- [Contact](#-contact)

---

## 🎯 Présentation

**BetterAgri** est une plateforme numérique intelligente destinée à moderniser le secteur agricole en **Mauritanie** 🇲🇷.

Elle connecte **agriculteurs**, **acheteurs** et **administrateurs** au sein d’un même écosystème, en combinant :
- le **commerce agricole local (Marketplace)**,
- l’**analyse intelligente des cultures (IA)**,
- la **météo prédictive**,
- et des **tableaux de bord analytiques**.

🎓 Ce projet a été réalisé dans le cadre du **Projet Intégré – Semestre 3 (PI-S3)**.

---

## 🌍 Problématique & Vision

### Problématique
- Difficulté de vente directe pour les agriculteurs  
- Manque d’accès à l’information météo et agricole fiable  
- Faible digitalisation du secteur agricole  
- Intermédiaires coûteux entre producteur et consommateur  

### Vision BetterAgri
> Donner aux agriculteurs les outils numériques et intelligents pour produire mieux, vendre directement et sécuriser leurs revenus.

---

## ✨ Fonctionnalités

### 👨‍🌾 Pour les Agriculteurs
- 📸 Analyse IA de la santé des cultures (images)
- 💧 Recommandations intelligentes d’irrigation
- 📊 Tableau de bord (ventes, commandes, revenus)
- 🛒 Publication et gestion des produits
- 🌦 Alertes météo locales en temps réel
- ⭐ Système d’évaluation basé sur les commandes livrées

---

### 🛍 Pour les Acheteurs
- 🛒 Marketplace de produits agricoles locaux
- 📍 Produits par région et agriculteur
- 🧾 Panier & commandes sécurisées
- 📦 Suivi des commandes
- ⭐ Évaluation des agriculteurs
- 🔔 Notifications en temps réel

---

### 🛡 Pour les Administrateurs
- 👥 Gestion des utilisateurs
- 📦 Supervision des produits et commandes
- 📈 Statistiques globales
- 🧹 Modération et contrôle de la plateforme

---

## 🏗 Architecture du Projet

```text
PI-S3/
├── client/                    # Frontend (Next.js 14)
│   ├── app/                   # App Router
│   ├── components/            # UI Components (shadcn/ui)
│   └── services/              # API calls
│
├── server/                    # Backend (Django REST)
│   ├── core/                  # Django project
│   ├── apps/
│   │   ├── accounts/          # Authentification & profils
│   │   ├── marketplace/       # Produits & ventes
│   │   ├── orders/            # Commandes & panier
│   │   ├── notifications/     # Emails & notifications
│   │   ├── weather/           # API météo
│   │   └── analytics/         # Statistiques
│   └── manage.py
│
├── docker-compose.yml
└── README.md
