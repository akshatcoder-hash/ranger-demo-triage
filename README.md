# support-triage

Escalation queue for the support team. Two CSV exports come in every morning:
tickets (`ticket_id, subject, requester_email, status, priority, created_at`)
and CRM customers (`email, company, tier, account_owner`).

The rule the success team works by:

- A ticket is escalated when the customer tier is `enterprise` **and** the
  ticket has been open **strictly more than 24 hours** as of
  `2026-03-10T12:00:00Z`. A ticket open for exactly 24 hours is not escalated.
- The queue is ordered by priority (`urgent`, `high`, `normal`, `low`), then by
  hours open, most open first.
- Tickets from customers outside the export, and customers on other tiers, are
  never escalated.

Run the tests with:

```sh
npm test
```
