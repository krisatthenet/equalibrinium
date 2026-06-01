# Contractor compliance: DAC7 reporting & KYC — plan

Status: **partially implemented**. This document tracks what is built and what
is deferred. Nothing here constitutes legal advice — the items marked _legal
sign-off_ must be confirmed with an AML/tax lawyer before going live.

## Implemented (v1.102)

Collected as **required** in the contractor registration form
(`apps/web/src/pages/RegistrationPage.jsx`) and stored in a dedicated
owner-scoped `contractor_kyc` collection (migration
`1785200000_create_contractor_kyc.js`) — **not** on `users`, because `users`
is publicly listable and PocketBase returns every field of a listable record.

| Field | `contractor_kyc` field | Validation |
|---|---|---|
| Full name | `users.name` | required (existing) |
| Personal code (asmens kodas) | `personalCode` | 11 digits + checksum (`isValidPersonalCode`) |
| Individual activity / company code | `businessCode` | required, non-empty |
| Bank account for payouts | `iban` | ISO 13616 mod-97 (`isValidIBAN`), LT = 20 chars |

`contractor_kyc` access rules are owner-only (`userId = @request.auth.id` for
list/view/update/delete; create requires auth). Superusers bypass. The record
is written client-side right after `signup()` authenticates the new account.

Validators live in `apps/web/src/lib/ltValidation.js`. IBAN is normalised
(spaces stripped, upper-cased) before storage.

**Note:** owner self-service editing of IBAN/codes later needs an authed flow;
the contractor can read their own `contractor_kyc` record (owner rule), but a
settings UI for it is not yet built.

## Deferred — DAC7 reporting

**Goal:** annually report qualifying contractors to VMI per the DAC7 directive
(EU platform-operator reporting).

Open items before building:
1. **TIN** — for Lithuanian individuals the TIN is generally the asmens kodas,
   so `personalCode` likely doubles as the TIN; **confirm** whether a separate
   `tin` field + country is needed for foreign contractors. Add a `tin` /
   `tinCountry` field at that point.
2. **Qualifying threshold** — DAC7 exempts sellers below 30 transactions AND
   €2,000 per year. Need a query over completed jobs/payouts per contractor per
   calendar year to determine who qualifies.
3. **Report format & submission** — VMI's exact schema (XML/JSON) and
   submission channel (portal upload vs API) must be verified against the
   official VMI/DAC7 spec. **Do not hard-code a format without verification —
   wrong filing carries penalties.**
4. **Where it runs** — annual batch job in `apps/api` (or a PocketBase
   scheduled hook), producing the export for review before submission.
5. **TIN verification** — whether to validate TIN/asmens kodas against an
   official registry, or accept self-declared values (current approach).

## Deferred — KYC / AML level _(legal sign-off)_

Per the original note: **simplified KYC** (name + personal-code check) is likely
sufficient **unless** WorkBee holds or moves money as a payment intermediary —
in which case AML obligations escalate and a lawyer must be consulted. This is a
legal determination, not a code task. Decision needed:

- Does WorkBee custody funds / act as a payment intermediary, or does money flow
  directly between client and contractor (e.g. via Stripe Connect)?
- If intermediary → full KYC/AML programme, ID document verification, sanctions
  screening — scope with counsel.

## Data-protection notes

- `personalCode` and `iban` are sensitive PII — never expose them in public
  list/view rules. The `users` list rule is already restricted
  (`userType = "contractor" || @request.auth.id != ""`); ensure these fields
  are excluded from any public projection and from the contractor public
  profile API.
