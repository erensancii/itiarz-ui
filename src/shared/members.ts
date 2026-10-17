/** Membership row as returned by GET /api/members (used by team and case assignment). */

/** userId is null until the invitation is accepted. */
export type Member = {
  id: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
};
