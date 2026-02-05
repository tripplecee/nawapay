'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingType: string;
  interval: string;
  provider: {
    name: string;
    reputation: number;
  };
}

export default function ServiceList() {
  const { publicKey } = useWallet();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services?active=true');
      const data = await res.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (serviceId: string) => {
    if (!publicKey) return;
    
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: publicKey.toString(),
          serviceId,
        }),
      });

      if (res.ok) {
        alert('Subscribed successfully!');
      }
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading services...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div 
          key={service.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {service.billingType}
            </span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">{service.description}</p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {service.price} {service.currency}
            </span>
            {service.interval && (
              <span className="text-gray-500 dark:text-gray-400">/ {service.interval.toLowerCase()}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>by {service.provider?.name || 'Unknown'}</span>
            <span className="text-yellow-500">★ {service.provider?.reputation || 0}</span>
          </div>
          
          <button
            onClick={() => handleSubscribe(service.id)}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Subscribe
          </button>
        </div>
      ))}
      
      {services.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
          No services available yet. Be the first to create one!
        </div>
      )}
    </div>
  );
}
