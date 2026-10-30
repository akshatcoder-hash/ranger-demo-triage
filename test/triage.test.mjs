import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escalationQueue, hoursOpen } from '../src/triage.mjs';

const AS_OF = '2026-03-10T12:00:00Z';

const customers = [
  { email: 'Dana@Acme.com ', company: 'Acme', tier: 'enterprise', account_owner: 'sam' },
  { email: 'leo@beta.dev', company: 'Beta', tier: 'growth', account_owner: 'sam' },
  { email: 'priya@gamma.io', company: 'Gamma', tier: 'enterprise', account_owner: 'ana' },
];

const tickets = [
  // 72 hours open, enterprise, urgent
  { ticket_id: 'T-1042', subject: 'SSO login loop', requester_email: 'dana@acme.com', status: 'open', priority: 'urgent', created_at: '2026-03-07T12:00:00Z' },
  // exactly 24 hours open, enterprise, high: NOT escalated yet
  { ticket_id: 'T-1043', subject: 'Invoice copy needed', requester_email: 'priya@gamma.io', status: 'open', priority: 'high', created_at: '2026-03-09T12:00:00Z' },
  // 30 hours open, enterprise, normal
  { ticket_id: 'T-1044', subject: 'Seat count wrong', requester_email: 'priya@gamma.io', status: 'open', priority: 'normal', created_at: '2026-03-09T06:00:00Z' },
  // 48 hours open, growth tier: never escalated
  { ticket_id: 'T-1045', subject: 'API key rotation', requester_email: 'leo@beta.dev', status: 'open', priority: 'urgent', created_at: '2026-03-08T12:00:00Z' },
  // 26 hours open, enterprise, urgent: newest of the two urgent ones
  { ticket_id: 'T-1046', subject: 'Data export stuck', requester_email: 'PRIYA@gamma.io', status: 'open', priority: 'urgent', created_at: '2026-03-09T10:00:00Z' },
];

test('counts hours open from the ticket timestamp', () => {
  assert.equal(hoursOpen(tickets[0], AS_OF), 72);
});

test('joins customers by email, case and whitespace insensitive', () => {
  const queue = escalationQueue(tickets, customers, AS_OF);
  assert.equal(queue.find((ticket) => ticket.ticket_id === 'T-1046')?.customer?.company, 'Gamma');
});

test('escalates only enterprise tickets open strictly more than 24 hours', () => {
  const ids = escalationQueue(tickets, customers, AS_OF).map((ticket) => ticket.ticket_id);
  assert.deepEqual(ids, ['T-1042', 'T-1046', 'T-1044']);
});

test('sorts by priority first, then by hours open descending', () => {
  const queue = escalationQueue(tickets, customers, AS_OF);
  assert.deepEqual(
    queue.map((ticket) => `${ticket.priority}:${ticket.ticket_id}`),
    ['urgent:T-1042', 'urgent:T-1046', 'normal:T-1044'],
  );
});
