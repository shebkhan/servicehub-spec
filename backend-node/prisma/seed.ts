import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { slug: 'cleaning' },
      update: {},
      create: { name: 'Cleaning', slug: 'cleaning', icon: 'sparkles', description: 'Home and office cleaning services' },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'beauty' },
      update: {},
      create: { name: 'Beauty & Hair', slug: 'beauty', icon: 'scissors', description: 'Hair styling and beauty services' },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'spa' },
      update: {},
      create: { name: 'Spa & Massage', slug: 'spa', icon: 'heart', description: 'Relaxation and wellness services' },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'repair' },
      update: {},
      create: { name: 'Repair & Maintenance', slug: 'repair', icon: 'wrench', description: 'Home repairs and maintenance' },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'pet-care' },
      update: {},
      create: { name: 'Pet Care', slug: 'pet-care', icon: 'paw', description: 'Pet grooming and care services' },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create global services
  const globalServices = [
    { name: 'Deep Cleaning', slug: 'deep-cleaning', categoryId: categories[0].id, basePrice: 85, duration: 180, icon: 'sparkles' },
    { name: 'Standard Cleaning', slug: 'standard-cleaning', categoryId: categories[0].id, basePrice: 55, duration: 120, icon: 'sparkles' },
    { name: 'Move-in/Move-out Cleaning', slug: 'move-cleaning', categoryId: categories[0].id, basePrice: 120, duration: 240, icon: 'sparkles' },
    { name: 'Haircut', slug: 'haircut', categoryId: categories[1].id, basePrice: 25, duration: 45, icon: 'scissors' },
    { name: 'Hair Coloring', slug: 'hair-coloring', categoryId: categories[1].id, basePrice: 80, duration: 120, icon: 'scissors' },
    { name: 'Full Body Massage', slug: 'full-body-massage', categoryId: categories[2].id, basePrice: 60, duration: 60, icon: 'heart' },
    { name: 'Facial', slug: 'facial', categoryId: categories[2].id, basePrice: 45, duration: 45, icon: 'heart' },
    { name: 'Plumbing Repair', slug: 'plumbing-repair', categoryId: categories[3].id, basePrice: 50, duration: 60, icon: 'wrench' },
    { name: 'AC Servicing', slug: 'ac-servicing', categoryId: categories[3].id, basePrice: 65, duration: 90, icon: 'wrench' },
    { name: 'Pet Grooming', slug: 'pet-grooming', categoryId: categories[4].id, basePrice: 40, duration: 60, icon: 'paw' },
  ];

  for (const svc of globalServices) {
    await prisma.globalService.upsert({
      where: { slug: svc.slug },
      update: {},
      create: svc,
    });
  }

  console.log(`Created ${globalServices.length} global services`);

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Services',
      slug: 'demo',
      primaryColor: '#0066CC',
      plan: 'PROFESSIONAL',
      settings: {
        bookingLeadTime: 60,
        maxAdvanceDays: 30,
        serviceRadius: 25,
        currency: 'USD',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
      },
    },
  });

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { email: 'admin@demo.com', password: hashedPassword, name: 'Admin User', role: 'TENANT_ADMIN' },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: { email: 'customer@demo.com', password: hashedPassword, name: 'John Customer', role: 'CUSTOMER' },
  });

  const provider = await prisma.user.upsert({
    where: { email: 'provider@demo.com' },
    update: {},
    create: { email: 'provider@demo.com', password: hashedPassword, name: 'Sarah Provider', role: 'PROVIDER' },
  });

  // Link users to tenant
  for (const user of [admin, customer, provider]) {
    await prisma.tenantUser.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      update: {},
      create: { userId: user.id, tenantId: tenant.id },
    });
  }

  // Create customer profile
  await prisma.customer.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      tenantId: tenant.id,
      creditBalance: 100,
      defaultAddress: {
        lat: 3.139,
        lng: 101.687,
        fullAddress: '123 Jalan Utama, Kuala Lumpur',
        instructions: 'Call upon arrival',
      },
    },
  });

  // Create provider profile
  await prisma.provider.upsert({
    where: { userId: provider.id },
    update: {},
    create: {
      userId: provider.id,
      tenantId: tenant.id,
      businessName: 'Sarah\'s Cleaning Services',
      bio: 'Professional cleaning service with 5+ years experience',
      isVerified: true,
      verifiedAt: new Date(),
      workingHours: {
        '0': { start: '09:00', end: '17:00' },
        '1': { start: '09:00', end: '18:00' },
        '2': { start: '09:00', end: '18:00' },
        '3': { start: '09:00', end: '18:00' },
        '4': { start: '09:00', end: '18:00' },
        '5': { start: '09:00', end: '18:00' },
        '6': { start: '10:00', end: '14:00' },
      },
      serviceRadius: 25,
      avgRating: 4.8,
      totalReviews: 24,
      totalJobs: 120,
      completedJobs: 115,
    },
  });

  // Create tenant services
  const allGlobal = await prisma.globalService.findMany();
  for (const gs of allGlobal) {
    const cat = categories.find(c => c.id === gs.categoryId);
    await prisma.tenantService.upsert({
      where: { tenantId_globalServiceId_category: { tenantId: tenant.id, globalServiceId: gs.id, category: cat?.name || '' } },
      update: {},
      create: {
        tenantId: tenant.id,
        globalServiceId: gs.id,
        name: gs.name,
        description: gs.description,
        price: gs.basePrice,
        duration: gs.duration,
        category: cat?.name || '',
        requiresAddress: gs.categoryId === categories[0].id,
      },
    });
  }

  // Create promo code
  await prisma.promoCode.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WELCOME20' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'WELCOME20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 50,
      maxDiscount: 30,
      validUntil: new Date('2026-12-31'),
    },
  });

  console.log('Seed completed!');
  console.log('\nDemo accounts:');
  console.log('  Admin:    admin@demo.com / password123');
  console.log('  Customer: customer@demo.com / password123');
  console.log('  Provider: provider@demo.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
