import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const featuredServices = [
  { id: '1', name: 'Home Cleaning', description: 'Professional home cleaning services', price: 99, category: 'Cleaning' },
  { id: '2', name: 'Plumbing', description: 'Expert plumbing repairs and installation', price: 79, category: 'Repair' },
  { id: '3', name: 'Electrical', description: 'Licensed electrical services', price: 89, category: 'Repair' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Find the Best Service Professionals</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book trusted professionals for all your service needs. Easy booking, quality guaranteed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/services"><Button size="lg">Browse Services</Button></Link>
            <Link href="/register"><Button variant="outline" size="lg">Sign Up</Button></Link>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="secondary" className="mb-2">{service.category}</Badge>
                      <CardTitle>{service.name}</CardTitle>
                    </div>
                    <span className="text-2xl font-bold">${service.price}</span>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href={`/book/${service.id}`}>Book Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services"><Button variant="outline">View All Services</Button></Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">1. Browse Services</h3>
              <p className="text-muted-foreground">Explore our wide range of professional services</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">2. Book Online</h3>
              <p className="text-muted-foreground">Select a time that works for you and book instantly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">3. Get Service</h3>
              <p className="text-muted-foreground">Receive quality service from trusted professionals</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
