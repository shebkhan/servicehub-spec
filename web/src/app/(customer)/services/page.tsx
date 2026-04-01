'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const services = [
  { id: '1', name: 'Home Cleaning', description: 'Professional home cleaning including all rooms, kitchen, and bathrooms', price: 99, duration: 180, category: 'Cleaning' },
  { id: '2', name: 'Deep Cleaning', description: 'Thorough deep cleaning for a spotless home', price: 149, duration: 240, category: 'Cleaning' },
  { id: '3', name: 'Plumbing Repair', description: 'Expert plumber for leaks, clogs, and repairs', price: 79, duration: 60, category: 'Repair' },
  { id: '4', name: 'Electrical Work', description: 'Licensed electrician for all electrical needs', price: 89, duration: 60, category: 'Repair' },
  { id: '5', name: 'AC Maintenance', description: 'Air conditioning service and maintenance', price: 119, duration: 90, category: 'HVAC' },
  { id: '6', name: 'Garden Landscaping', description: 'Professional garden design and maintenance', price: 99, duration: 180, category: 'Outdoor' },
];

export default function ServicesPage() {
  const [search, setSearch] = useState('');

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Our Services</h1>
          <p className="text-muted-foreground">Find the perfect service for your needs</p>
        </div>
        <Input 
          placeholder="Search services..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">${service.price}</span>
                </div>
              </div>
              <CardDescription className="mt-2">{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Duration: {service.duration} minutes</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/book/${service.id}`}>Book Now</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services found matching your search.</p>
        </div>
      )}
    </div>
  );
}
