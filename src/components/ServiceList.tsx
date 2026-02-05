'use client';

import { useState, useEffect } from 'react';

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

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{service.name}</h3>
            <span className="text-sm text-gray-500">{service.billingType}</span>
          </div>
          
          <p className="text-gray-600 mb-4">{service.description}</p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold">{service.price} {service.currency}</span>
            {service.interval && (
              <span className="text-gray-500">/ {service.interval.toLowerCase()}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span>by {service.provider.name}</span>
            <span className="text-yellow-500">★ {service.provider.reputation}</span>
          </div>
          
          <button
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => alert('Subscribe functionality coming soon!')}
          >
            Subscribe
          </button>
        </div>
      ))}
      
      {services.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No services available yet. Be the first to create one!
        </div>
      )}
    </div>
  );
}
