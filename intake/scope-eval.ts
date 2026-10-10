import { classifyIntake, decideRoute, getApiKey, MissingKeyError, type Scope } from "./classify.ts";

/** Hand-written out-of-scope / non-English requests. expect_in = should route to maintenance (not out_of_scope_handover). */
export const SCOPE_CASES: { id: string; text: string; scope: Scope[]; in_scope: boolean }[] = [
  { id: "rent_arrears", text: "Hi, I'm two weeks behind on rent after my hours were cut. Can I agree a payment plan with the landlord?", scope: ["tenancy_finance"], in_scope: false },
  { id: "deposit_dispute", text: "We moved out in March and the landlord is keeping £600 of our deposit for 'cleaning'. We think that's unfair and want it back.", scope: ["tenancy_finance", "tenancy_legal_or_dispute"], in_scope: false },
  { id: "neighbour_noise", text: "The flat upstairs plays loud music until 3am every night. I've asked them to stop and nothing changes. What can the agency do?", scope: ["neighbour_or_antisocial"], in_scope: false },
  { id: "polish_leak", text: "Dzień dobry, z sufitu w łazience kapie woda, a na ścianie robi się mokra plama. Proszę o przysłanie hydraulika.", scope: ["maintenance_repair"], in_scope: true },
  { id: "spanish_boiler", text: "Hola, la caldera no funciona desde ayer y no tenemos agua caliente ni calefacción. ¿Pueden enviar a alguien?", scope: ["maintenance_repair"], in_scope: true },
  { id: "agency_complaint", text: "I want to make a formal complaint about how your agency handled my tenancy. Nobody returned my calls for three weeks and I'm considering the ombudsman.", scope: ["tenancy_legal_or_dispute"], in_scope: false },
  { id: "gas_smell", text: "There's a strong smell of gas in the kitchen near the cooker. We've opened the windows.", scope: ["emergency_safety"], in_scope: true },
  { id: "insurance_claim", text: "A tree fell on the garage last night. Does the landlord's insurance cover my belongings that were damaged? How do I make a claim?", scope: ["tenancy_legal_or_dispute", "other_non_property"], in_scope: false },
  { id: "cp12_expiring", text: "Hi, our gas safety certificate (CP12) for 14 Alder Way expires in 9 days and the landlord has not booked the annual check. Can the agency arrange a Gas Safe engineer?", scope: ["compliance_renewal"], in_scope: true },
  { id: "eicr_c2", text: "The EICR report for 3 Mill Row came back unsatisfactory with two C2 potentially dangerous observations on the consumer unit. We need an electrician to do the remedial work.", scope: ["compliance_renewal", "maintenance_repair"], in_scope: true },
];

async function main() {
  try {
    getApiKey();
  } catch (e) {
    if (e instanceof MissingKeyError) return console.error(`${e.message}\nNo run.`);
    throw e;
  }
  let ok = 0;
  let routeOk = 0;
  for (const c of SCOPE_CASES) {
    const r = await classifyIntake({ request: c.text, reporter_role: "tenant" });
    const route = decideRoute(r);
    const good = c.scope.includes(r.scope);
    const rOk = (route === "out_of_scope_handover") === !c.in_scope;
    ok += +good;
    routeOk += +rOk;
    console.log(`${good ? "OK " : "BAD"} ${rOk ? "route-ok" : "route-BAD"} ${c.id}: scope=${r.scope} (${r.scope_probs[r.scope].toFixed(2)}) route=${route} non_english=${r.non_english.toFixed(2)} cat=${r.category} sev=${r.severity} safety=${r.safety_risk.toFixed(2)}`);
  }
  console.log(`scope accuracy ${ok}/${SCOPE_CASES.length}; out-of-scope routing correct ${routeOk}/${SCOPE_CASES.length}`);
}

if (process.argv[1] && process.argv[1].endsWith("scope-eval.ts")) await main();
