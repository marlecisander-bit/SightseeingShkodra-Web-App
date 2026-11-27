# Website tracking

The public Route page uses Leaflet and reads published geometry and current tracking from the existing tracking Supabase project. The homepage uses the same status endpoint. The admin map workspace uses the existing tracking account and publication operations.

The former iframe bridge is retained for the local paired preview. SharedMap and the earlier vehicle_positions reader remain available to their development and regression consumers. See [the audit implementation evidence](../../../docs/END-TO-END-AUDIT-IMPLEMENTATION-2026-11-27.md).
