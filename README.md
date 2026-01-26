# PI-S3 - BetterAgri 🇲🇷

## 🌾 Table des Matières
- [Présentation](#présentation)  
- [Fonctionnalités](#fonctionnalités)  
- [Architecture du Projet](#architecture-du-projet)  
- [Technologies Utilisées](#technologies-utilisées)  
- [Installation & Configuration](#installation--configuration)  
- [Déploiement avec Docker](#déploiement-avec-docker)  
- [Contribuer](#contribuer)  
- [Licence](#licence)  
- [Contact](#contact)  

---

## 🎯 Présentation

**BetterAgri** est une plateforme agricole intelligente pour la Mauritanie. Elle combine :  
- un **marketplace** pour connecter producteurs et acheteurs,  
- des **outils d'IA** pour analyser les cultures et optimiser l’irrigation,  
- des **alertes météo locales**,  
- et un **tableau de bord analytique** pour suivre les performances agricoles.  

💡 Objectifs :  
- Améliorer la productivité agricole locale  
- Faciliter la vente directe des produits  
- Offrir des recommandations intelligentes basées sur les données  

---

## ✨ Fonctionnalités

### Pour les Agriculteurs
- Analyse IA des cultures via photo  
- Gestion de l’eau et recommandations d’irrigation  
- Tableau de bord de performance  
- Vente directe sur le marketplace  
- Alertes météo personnalisées  

### Pour les Acheteurs
- Marketplace de produits agricoles locaux  
- Recherche par région ou type de produit  
- Traçabilité directe du producteur  
- Paiements et livraisons sécurisés  

### Pour les Administrateurs
- Gestion des utilisateurs et commandes  
- Modération des contenus et produits  
- Statistiques et rapports détaillés  

---

## 🏗 Architecture du Projet

```text
PI-S3/
├── client/           # Frontend Next.js
├── server/           # Backend Django + AI services
│   ├── core/         # Django project
│   └── ai_service/   # FastAPI AI microservice
├── docker-compose.yml
└── README.md
