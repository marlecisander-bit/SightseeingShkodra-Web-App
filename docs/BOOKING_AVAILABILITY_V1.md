# Availability and pricing V1

Shared server API: getAvailability in src/modules/booking/availability-server.ts. Request: `{version:1, operatorId, productId, date:"2030-06-01", guests:2}`. The response includes database asOf, EUR unitPrice/total in integer cents and departures with local startTime, remaining seats and available for the requested quantity. HTTP adapters belong to Phase 2F; no public HTTP route exists yet.

Published van_tour products must explicitly configure capacity_rules as `{"version":1,"model":"departure_seats"}` and pricing_rules as `{"version":1,"model":"per_guest","currency":"EUR","unit_price":1500}`. The price is illustrative, not an approved business price. Unknown pricing fields/models fail closed. One guest uses one seat. No age bands, discounts, fees, currency conversion or fallback price are inferred. Existing draft fixtures are not promoted to saleable products.

Only scheduled departures on the requested date whose start instant is in the future are returned. Local departure times use the operator timezone. No additional sales cutoff/horizon is implemented. These are explicit initial conventions, not imported legacy rules.

Remaining seats = max(0, capacity - confirmed item quantities - active hold quantities with expiry strictly after statement time). Consumed/released/expired holds are excluded. Pending items require holds in the later checkout implementation. Confirmation must atomically consume holds and confirm items. The single SQL statement reads one consistent snapshot but does not lock or reserve seats. Phase 2B must recheck capacity transactionally.

Errors: INVALID_REQUEST, NOT_FOUND (including unpublished/unsupported product), INVALID_CONFIGURATION, UNAVAILABLE. The server adapter suppresses provider errors and disables fetch caching. The SQL function is invoker-rights and service-role only, explicitly tenant/product scoped; it returns no customer/session details. No new client table permissions are granted.
