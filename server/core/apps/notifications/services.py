import json
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend
import os
from django.conf import settings
from django.utils import timezone
import requests


class WebPushService:
    """Service de notifications push utilisant Web Push API native"""

    def __init__(self):
        # Générer ou charger les clés VAPID
        self.vapid_private_key, self.vapid_public_key = (
            self._load_or_generate_vapid_keys()
        )
        self.vapid_claims = {
            "sub": "mailto:contact@betteragri.mr",
            "exp": int(timezone.now().timestamp()) + 86400,  # 24h
        }

    def _load_or_generate_vapid_keys(self):
        """Charger ou générer les clés VAPID"""
        keys_path = os.path.join(settings.BASE_DIR, "vapid_keys.json")

        try:
            if os.path.exists(keys_path):
                with open(keys_path, "r") as f:
                    keys = json.load(f)
                    private_key = serialization.load_pem_private_key(
                        keys["private_key"].encode(),
                        password=None,
                        backend=default_backend(),
                    )
                    public_key = serialization.load_pem_public_key(
                        keys["public_key"].encode(), backend=default_backend()
                    )
                    return private_key, public_key
        except:
            pass

        # Générer de nouvelles clés
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()

        # Sauvegarder
        keys = {
            "private_key": private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ).decode(),
            "public_key": public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ).decode(),
        }

        with open(keys_path, "w") as f:
            json.dump(keys, f)

        return private_key, public_key

    def get_vapid_public_key(self):
        """Obtenir la clé publique VAPID au format base64 URL safe"""
        public_key_bytes = self.vapid_public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )

        # Web Push utilise le format base64 URL safe sans padding
        return base64.urlsafe_b64encode(public_key_bytes).decode().strip("=")

    def send_push_notification(self, subscription_info, title, body, data=None):
        """Envoyer une notification push"""
        try:
            # Endpoint du service push (du navigateur)
            endpoint = subscription_info.get("endpoint")

            if not endpoint:
                return False

            # Clés de chiffrement du client
            p256dh = base64.urlsafe_b64decode(
                subscription_info.get("keys", {}).get("p256dh") + "==="
            )
            auth = base64.urlsafe_b64decode(
                subscription_info.get("keys", {}).get("auth") + "==="
            )

            # Créer le payload
            payload = {
                "title": title,
                "body": body,
                "icon": "/icon-192x192.png",
                "badge": "/badge-72x72.png",
                "timestamp": int(timezone.now().timestamp() * 1000),
            }

            if data:
                payload["data"] = data

            payload_json = json.dumps(payload)
            payload_bytes = payload_json.encode("utf-8")

            # Chiffrer le payload (simplifié - en production utiliser webpush library)
            # Pour le moment, on envoie sans chiffrement pour le POC
            encrypted_payload = payload_bytes

            # Préparer les headers
            headers = {
                "Content-Type": "application/octet-stream",
                "Content-Encoding": "aes128gcm",
                "TTL": "86400",  # 24h
                "Urgency": "normal",
            }

            # Ajouter l'en-tête d'autorisation VAPID
            vapid_header = self._generate_vapid_header(endpoint)
            headers["Authorization"] = vapid_header

            # Envoyer la requête
            response = requests.post(
                endpoint, data=encrypted_payload, headers=headers, timeout=10
            )

            return response.status_code == 201

        except Exception as e:
            print(f"Erreur envoi push: {e}")
            return False

    def _generate_vapid_header(self, endpoint):
        """Générer l'en-tête d'autorisation VAPID"""
        # Simplifié pour le POC
        # En production, utiliser la librairie webpush ou py-vapid
        return f"vapid t={self.get_vapid_public_key()}, k={self.get_vapid_public_key()}"

    def subscribe_user(self, user, subscription_info):
        """Enregistrer un abonnement push pour un utilisateur"""
        from .models import PushSubscription

        try:
            # Vérifier si déjà abonné
            existing = PushSubscription.objects.filter(
                user=user, endpoint=subscription_info["endpoint"]
            ).first()

            if existing:
                existing.subscription_info = subscription_info
                existing.save()
            else:
                PushSubscription.objects.create(
                    user=user,
                    endpoint=subscription_info["endpoint"],
                    subscription_info=subscription_info,
                )

            return True
        except Exception as e:
            print(f"Erreur subscription: {e}")
            return False

    def unsubscribe_user(self, user, endpoint):
        """Désabonner un utilisateur"""
        from .models import PushSubscription

        try:
            PushSubscription.objects.filter(user=user, endpoint=endpoint).delete()
            return True
        except Exception as e:
            print(f"Erreur unsubscription: {e}")
            return False


class ServiceWorkerService:
    """Service pour gérer le Service Worker et le cache"""

    @staticmethod
    def generate_service_worker_js():
        """Générer le code du Service Worker"""
        return """
// Service Worker pour BetterAgri Mauritanie
const CACHE_NAME = 'betteragri-v1';
const OFFLINE_URL = '/offline.html';

// Assets à mettre en cache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch avec cache puis réseau
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Pour les requêtes d'API, stratégie réseau puis cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mettre en cache les réponses API réussies
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // En cas d'erreur réseau, chercher dans le cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Pour les assets, stratégie cache puis réseau
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Mettre en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si échec et c'est une navigation, retourner page offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Ressource non disponible hors ligne', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BetterAgri', options)
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  
  if (notificationData && notificationData.url) {
    event.waitUntil(
      clients.openWindow(notificationData.url)
    );
  } else if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  } else if (event.action === 'close') {
    // Fermer la notification
  } else {
    // Action par défaut
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncOrders() {
  try {
    const cache = await caches.open('sync-data');
    const orders = await cache.match('pending-orders');
    
    if (orders) {
      const response = await fetch('/api/orders/sync/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: orders
      });

      if (response.ok) {
        await cache.delete('pending-orders');
        self.registration.showNotification('Synchronisation réussie', {
          body: 'Vos commandes ont été synchronisées',
          icon: '/icon-192x192.png'
        });
      }
    }
  } catch (error) {
    console.error('Erreur sync orders:', error);
  }
}

async function syncMessages() {
  try {
    const cache = await caches.open('sync-data');
    const messages = await cache.match('pending-messages');
    
    if (messages) {
      const response = await fetch('/api/messaging/sync/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: messages
      });

      if (response.ok) {
        await cache.delete('pending-messages');
      }
    }
  } catch (error) {
    console.error('Erreur sync messages:', error);
  }
}
"""

    @staticmethod
    def generate_manifest_json():
        """Générer le manifeste PWA"""
        return {
            "name": "BetterAgri Mauritanie",
            "short_name": "BetterAgri",
            "description": "Plateforme agricole mauritanienne",
            "start_url": "/",
            "display": "standalone",
            "background_color": "#4CAF50",
            "theme_color": "#4CAF50",
            "icons": [
                {"src": "/icon-72x72.png", "sizes": "72x72", "type": "image/png"},
                {"src": "/icon-96x96.png", "sizes": "96x96", "type": "image/png"},
                {"src": "/icon-128x128.png", "sizes": "128x128", "type": "image/png"},
                {"src": "/icon-144x144.png", "sizes": "144x144", "type": "image/png"},
                {"src": "/icon-152x152.png", "sizes": "152x152", "type": "image/png"},
                {"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "/icon-384x384.png", "sizes": "384x384", "type": "image/png"},
                {"src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png"},
            ],
        }
