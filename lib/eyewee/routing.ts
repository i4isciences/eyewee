// Organize (PI-facing) readiness hook -- docs/DEVELOPMENT_PLAN.md §6.7 item 4. eyewee-standalone
// is account-free and serves only postdocs today, so there's no user schema to hang a persisted
// `role` field on here (that decision -- schema-agnostic in the sense that Organize's own account
// model is still unspecified -- likely belongs in `postdocworks`, which does have accounts; see
// docs/DEVELOPMENT_PLAN.md §8.2 item 6). What's cheap and worth doing now regardless: a single,
// explicit role-check call site before any conversation-logic branch, so adding a PI/Organize
// branch later means adding a case here, not threading a new check through every call site that
// currently assumes "postdoc" implicitly.
export type EyeweeRole = "postdoc" | "pi";

export function getRoleForRequest(): EyeweeRole {
  return "postdoc";
}
