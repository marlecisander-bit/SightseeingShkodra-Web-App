import { hasPermission, type StaffRole, type Permission } from './roles';
export const adminSections: { slug: string; label: string; permission: Permission; description: string }[] = [
  { slug: 'overview', label: 'Overview', permission: 'catalog.read', description: 'Your operator workspace.' },
  { slug: 'catalog', label: 'Products & suppliers', permission: 'catalog.manage', description: 'Manage products and suppliers. Routes, stops and GPS are managed in the live map app.' },
  { slug: 'departures', label: 'Calendar & Pricing', permission: 'departures.manage', description: 'Manage dates, departure times, passenger capacity and category prices.' },
  { slug: 'bookings', label: 'Bookings', permission: 'bookings.read', description: 'Booking operations will be available here.' },
  { slug: 'reviews', label: 'Guest Reviews', permission: 'content.manage', description: 'Curate genuine guest reviews and homepage display settings.' },
  { slug: 'content', label: 'Website content', permission: 'content.manage', description: 'Page and editorial management will be available here.' },
];
export function navigationFor(role: StaffRole) { return adminSections.filter(section => hasPermission(role, section.permission)); }
