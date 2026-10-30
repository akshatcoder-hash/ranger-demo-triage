/**
 * Support escalation queue.
 *
 * The success team works the queue in the morning and expects, for the
 * current exports:
 *   - a ticket is escalated when the customer tier is "enterprise" and the
 *     ticket has been open STRICTLY more than 24 hours (a ticket open for
 *     exactly 24 hours is not escalated yet),
 *   - the queue is sorted by ticket priority (urgent, high, normal, low),
 *     then by hours open, most open first.
 *
 * Exports arrive as arrays of records; see README.md for the columns.
 */

export const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 };

export const ESCALATION_AGE_HOURS = 24;

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

export function joinCustomers(tickets, customers) {
  const byEmail = new Map();
  for (const customer of customers) byEmail.set(normalizeEmail(customer.email), customer);
  return tickets.map((ticket) => ({ ...ticket, customer: byEmail.get(normalizeEmail(ticket.requester_email)) ?? null }));
}

export function hoursOpen(ticket, asOf) {
  const createdAt = Date.parse(ticket.created_at);
  if (Number.isNaN(createdAt)) return null;
  return (Date.parse(asOf) - createdAt) / 3_600_000;
}

export function escalationQueue(tickets, customers, asOf) {
  const joined = joinCustomers(tickets, customers);
  const flagged = joined.filter((ticket) => {
    const tier = ticket.customer?.tier;
    const hours = hoursOpen(ticket, asOf);
    return tier === 'enterprise' && hours !== null && hours >= ESCALATION_AGE_HOURS;
  });
  return flagged.sort((a, b) => hoursOpen(b, asOf) - hoursOpen(a, asOf));
}
