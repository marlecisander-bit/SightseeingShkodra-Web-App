# Implement 16 November SEO audit priorities

The audited site exposed duplicate public .app pages and conflicting seasonal/ticket promises. Add permanent scoped marketing redirects to www.com, improve the existing /book page with server-rendered published tour information, and describe visible Organization/TouristTrip entities while preserving guide breadcrumbs and transactional routes.

A guarded operator-scoped content migration corrects exact audited CMS copy, attraction metadata and vehicle alt text. Production data is unchanged until that migration is separately approved/applied. No prices, inventory, refund/payment rules or historical reviews change. Existing product query URLs stay canonicalized to /book.

Validation:755 local tests,14 focused SEO checks, types and Webpack production build pass. Lint passes with one pre-existing untracked audit-script warning excluded; default Turbopack stalled locally. Desktop/mobile fixture reviewed with no horizontal overflow. Remote exact-head CI is required before approval.

Vercel deployment is disabled only for this exact review branch via vercel.json. No merge, deployment, DNS, Search Console or hosted data change is authorized. Deployment dependencies, legacy mappings, external listing discrepancies and exact Google follow-up are documented in docs/SEO-PRIORITY-FIXES-2026-11-16.md.
