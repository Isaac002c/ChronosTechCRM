# TODO: Fix API Route Mismatches (Approved Plan)

## Current Progress
- [x] Analysis complete - identified frontend inconsistencies
- [x] Plan approved by user
- [ ] 1. Create TODO.md ✅ DONE

## Steps to Complete
1. **Fix sellersAPI.js** - Remove double /api → `${API_BASE_URL}/api/sellers`
2. **Fix targetsAPI.js** - Standardize to API_BASE_URL pattern
3. **Standardize clientsAPI.js** - Ensure consistent BASE_URL + /api/clients
4. **Standardize contractsAPI.js** - Ensure consistent BASE_URL + /api/contracts
5. **Standardize servicesAPI.js** - Ensure consistent BASE_URL + /api/services
6. **Fix remaining lib/*.js** - usersAPI, finesAPI, documentsAPI, saasAPI (check each)
7. **Test backend server** - cd saas-multitenant/backend && node app.js
8. **Test frontend calls** - Check browser Network tab for /api/api/ → gone
9. **attempt_completion** - All APIs consistent

Next step: Edit sellersAPI.js
