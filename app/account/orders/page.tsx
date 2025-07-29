import Link from 'next/link';

export default function OrdersPage() {
  // Commandes simulées
  const orders = [
    {
      id: 'MEP12345678',
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'delivered',
      statusText: 'Livrée',
      items: 12,
      total: 15750,
    },
    {
      id: 'MEP12345677',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      status: 'delivered',
      statusText: 'Livrée',
      items: 8,
      total: 9500,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-app py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mes commandes</h1>
          <p className="text-gray-600 mt-2">Retrouvez l&apos;historique de toutes vos commandes</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune commande</h2>
            <p className="text-gray-600 mb-6">Vous n&apos;avez pas encore passé de commande</p>
            <Link href="/products" className="btn-primary">
              Commencer mes courses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Commande {order.id}</h3>
                    <p className="text-sm text-gray-600">Passée le {order.date}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.statusText}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">{order.items} articles</p>
                    <p className="font-semibold">{order.total.toLocaleString('fr-FR')} F CFA</p>
                  </div>
                  <Link href={`/account/orders/${order.id}`} className="btn-outline text-sm">
                    Voir les détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}