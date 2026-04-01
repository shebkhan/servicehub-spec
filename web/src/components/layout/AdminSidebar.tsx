'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/admin/services', label: 'Services' },
  { href: '/admin/admin/bookings', label: 'Bookings' },
  { href: '/admin/admin/users', label: 'Users' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r min-h-screen p-4">
      <div className="mb-6">
        <Link href="/" className="text-xl font-bold">ServiceHub Admin</Link>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className={cn('w-full justify-start', pathname === item.href && 'bg-muted')}
            asChild
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">← Back to Site</Link>
      </div>
    </aside>
  );
}
