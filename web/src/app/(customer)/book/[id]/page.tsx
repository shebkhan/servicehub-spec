'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const services = [
  { id: '1', name: 'Home Cleaning', price: 99, duration: 180 },
  { id: '2', name: 'Deep Cleaning', price: 149, duration: 240 },
  { id: '3', name: 'Plumbing Repair', price: 79, duration: 60 },
  { id: '4', name: 'Electrical Work', price: 89, duration: 60 },
  { id: '5', name: 'AC Maintenance', price: 119, duration: 90 },
  { id: '6', name: 'Garden Landscaping', price: 99, duration: 180 },
];

const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookServicePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [service, setService] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const found = services.find(s => s.id === params.id);
    setService(found);
  }, [params.id]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('Please select a date and time');
      return;
    }
    setSubmitting(true);
    // Simulate booking - in real app, this would call Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Booking confirmed!');
    router.push('/bookings');
  };

  if (loading || !service) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Book Service</h1>
        <p className="text-muted-foreground mb-8">Fill in the details to book your service</p>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription>${service.price} • {service.duration} minutes</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time Slot</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={time === slot ? 'default' : 'outline'}
                        onClick={() => setTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Input 
                    id="notes" 
                    placeholder="Any special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
