'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const mockBookings = [
  { id: '1', serviceName: 'Home Cleaning', date: '2026-04-05', time: '10:00', status: 'confirmed', price: 99 },
  { id: '2', serviceName: 'Plumbing Repair', date: '2026-04-08', time: '14:00', status: 'pending', price: 79 },
  { id: '3', serviceName: 'Electrical Work', date: '2026-03-28', time: '09:00', status: 'completed', price: 89 },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function BookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState(mockBookings);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const cancelBooking = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    toast.success('Booking cancelled');
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!user) return null;

  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Manage your service bookings</p>
        </div>
        <Button asChild>
          <Link href="/services">Book New Service</Link>
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="history">History ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeBookings.length > 0 ? (
            <div className="grid gap-4">
              {activeBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{booking.serviceName}</CardTitle>
                        <CardDescription>Booking #{booking.id}</CardDescription>
                      </div>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p><span className="font-medium">Date:</span> {booking.date}</p>
                        <p><span className="font-medium">Time:</span> {booking.time}</p>
                        <p><span className="font-medium">Price:</span> ${booking.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Details</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                              <DialogDescription>Booking #{booking.id}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 mt-4">
                              <p><span className="font-medium">Service:</span> {booking.serviceName}</p>
                              <p><span className="font-medium">Date:</span> {booking.date}</p>
                              <p><span className="font-medium">Time:</span> {booking.time}</p>
                              <p><span className="font-medium">Price:</span> ${booking.price}</p>
                              <p><span className="font-medium">Status:</span> {booking.status}</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {booking.status !== 'completed' && (
                          <Button variant="destructive" size="sm" onClick={() => cancelBooking(booking.id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No active bookings</p>
              <Button asChild><Link href="/services">Browse Services</Link></Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {pastBookings.length > 0 ? (
            <div className="grid gap-4">
              {pastBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{booking.serviceName}</CardTitle>
                        <CardDescription>Booking #{booking.id}</CardDescription>
                      </div>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p><span className="font-medium">Date:</span> {booking.date}</p>
                    <p><span className="font-medium">Time:</span> {booking.time}</p>
                    <p><span className="font-medium">Price:</span> ${booking.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No booking history</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
