import { hasPermission, type StaffRole, type Permission } from './roles';
export const adminSections: { slug: string; label: string; permission: Permission; description: string }[] = [
  { slug: 'overview', label: 'Overview', permission: 'catalog.read', description: 'Your operator workspace.' },
  { slug: 'catalog', label: 'Products & stops', permission: 'catalog.manage', description: 'Product, supplier and route management will be available here.' },
  { slug: 'departures', label: 'Departures', permission: 'departures.manage', description: 'Schedules and capacity management will be available here.' },
  { slug: 'bookings', label: 'Bookings', permission: 'bookings.read', description: 'Booking operations will be available here.' },
  { slug: 'content', label: 'Website content', permission: 'content.manage', description: 'Page and editorial management will be available here.' },
];
export function navigationFor(role: StaffRole) { return adminSections.filter(section => hasPermission(role, section.permission)); }
