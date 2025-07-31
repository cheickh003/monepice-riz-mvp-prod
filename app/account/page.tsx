import Link from 'next/link';

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-app py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon compte</h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mes informations */}
            <Link href="/account/profile" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Mes informations</h2>
                  <p className="text-sm text-gray-600">Gérer vos informations personnelles</p>
                </div>
              </div>
            </Link>

            {/* Mes commandes */}
            <Link href="/account/orders" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-secondary-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Mes commandes</h2>
                  <p className="text-sm text-gray-600">Suivre vos commandes passées</p>
                </div>
              </div>
            </Link>

            {/* Mes adresses */}
            <Link href="/account/addresses" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-accent-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Mes adresses</h2>
                  <p className="text-sm text-gray-600">Gérer vos adresses de livraison</p>
                </div>
              </div>
            </Link>

            {/* Aide */}
            <Link href="/help" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-tertiary-50 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Aide & Contact</h2>
                  <p className="text-sm text-gray-600">Questions fréquentes et support</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Actions rapides */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <Link href="/products" className="block text-primary hover:underline">
                → Continuer mes achats
              </Link>
              <Link href="/account/orders" className="block text-primary hover:underline">
                → Voir mes commandes récentes
              </Link>
              <a href="tel:+2250161888888" className="block text-primary hover:underline">
                → Contacter le service client
              </a>
            </div>
          </div>

          {/* Déconnexion */}
          <div className="mt-6 text-center">
            <button className="text-red-600 hover:underline">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}