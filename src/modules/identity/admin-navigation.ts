import { hasPermission, type StaffRole, type Permission } from './roles';
export const adminSections: { slug: string; label: string; permission: Permission; description: string }[] = [
  { slug: 'notifications', label: 'Notifications', permission: 'bookings.read', description: 'Operational alerts, push devices and your notification preferences.' },
  { slug: 'email', label: 'Email & Notifications', permission: 'integrations.manage', description: 'Check booking messages and email service status.' },
  { slug: 'overview', label: 'Overview', permission: 'catalog.read', description: 'Your website and daily tour operations.' },
  { slug: 'catalog', label: 'Products & suppliers', permission: 'catalog.manage', description: 'Manage your experiences and business partners.' },
  { slug: 'departures', label: 'Calendar & Pricing', permission: 'departures.manage', description: 'Manage dates, departure times, passenger capacity and category prices.' },
  { slug: 'bookings', label: 'Bookings', permission: 'bookings.read', description: 'Find bookings, check guests in and record meeting-point payments.' },
  { slug: 'reviews', label: 'Guest Reviews', permission: 'content.manage', description: 'Curate genuine guest reviews and homepage display settings.' },
  { slug: 'content', label: 'Website content', permission: 'content.manage', description: 'Choose what visitors see, edit images and preview your changes.' },
];
export function navigationFor(role: StaffRole) { return adminSections.filter(section => hasPermission(role, section.permission)); }
