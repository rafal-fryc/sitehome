import { useEffect } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import "./ivo.css";

type State = "mn" | "oh" | "ca";
const STATE_LABEL: Record<State, string> = { mn: "Minnesota", oh: "Ohio", ca: "California" };

type NodeCell = { text: string; cite: string };
type SubBranch = {
  num: string;
  heading: string;
  topic: string;
  cells: Record<State, NodeCell>;
};
type Branch = {
  id: string;
  roman: string;
  arabic: string;
  title: string;
  subs: SubBranch[];
};

const BRANCHES: Branch[] = [
  {
    id: "b1",
    roman: "Section I",
    arabic: "1",
    title: "Who <em>runs</em> the program",
    subs: [
      {
        num: "I · i",
        heading: "Administering authority",
        topic: "Where the licensing or designation power sits in state government.",
        cells: {
          mn: { text: "Commissioner of Commerce; advisory council seated inside the Department of Commerce.", cite: "MN S.F. 4636 § 1, subd. 4 [325M.50, subd. 4]; § 4, subd. 1(a) [325M.53]." },
          oh: { text: "Attorney General, in conjunction with the Auditor of State; advisory council in the AG's office.", cite: "OH H.B. 628 § 3755.03(A); § 3755.06(A)." },
          ca: { text: "A new <em>California AI Standards and Safety Commission</em> within the Government Operations Agency.", cite: "CA S.B. 813 § 8898.1(a); § 8898(c)." },
        },
      },
      {
        num: "I · ii",
        heading: "Regulatory mechanism",
        topic: "The legal hook by which an IVO is recognized.",
        cells: {
          mn: { text: "<strong>License</strong> issued by the Commissioner; must specify covered risks and any market segments.", cite: "§ 2, subd. 1 [325M.51, subd. 1]; subd. 3(d)." },
          oh: { text: "<strong>License</strong> issued by the Attorney General; must \"expressly and specifically identify\" risks and market segments.", cite: "§ 3755.02; § 3755.03(D)(1)–(2)." },
          ca: { text: "<strong>Designation</strong> by the Commission, expiring after three years and renewable.", cite: "§ 8898.3(a), (c)." },
        },
      },
      {
        num: "I · iii",
        heading: "Voluntariness",
        topic: "Is verification ever required of any AI system?",
        cells: {
          mn: { text: "Voluntary: nothing requires an AI model or application to seek IVO verification.", cite: "§ 2, subd. 7 [325M.51, subd. 7]." },
          oh: { text: "Voluntary: same opt-in posture as Minnesota.", cite: "§ 3755.07(B)." },
          ca: { text: "Voluntary: designation itself is described as \"voluntary.\"", cite: "§ 8898.1(d), (e)." },
        },
      },
    ],
  },
  {
    id: "b2",
    roman: "Section II",
    arabic: "2",
    title: "Plan elements an IVO must <em>publish</em>",
    subs: [
      {
        num: "II · i",
        heading: "Risk definition + metrics",
        topic: "The quantitative spine of every plan.",
        cells: {
          mn: { text: "Plan must define acceptable risk levels, measurable metrics, target levels (with sources/methods), and an evaluation/reporting protocol.", cite: "§ 2, subd. 2(1)(i)–(iv) [325M.51, subd. 2]." },
          oh: { text: "Same four elements, organized as (A)(2)(a)–(c) plus the protocol clause.", cite: "§ 3755.02(A)(1)–(2)(a)–(c)." },
          ca: { text: "Same four elements: definition, metrics, targets, protocol.", cite: "§ 8898.4(a)(4)(A)–(D)." },
        },
      },
      {
        num: "II · ii",
        heading: "Technical &amp; operational",
        topic: "Pre/post-deployment monitoring & mitigation efficacy.",
        cells: {
          mn: { text: "Pre- and post-development; ongoing risk monitoring; ongoing assessment of mitigation efficacy.", cite: "§ 2, subd. 2(2)(i)–(ii) [325M.51, subd. 2]." },
          oh: { text: "Same: pre/post development; ongoing monitoring; ongoing efficacy assessment.", cite: "§ 3755.02(B)(1)–(2)." },
          ca: { text: "Heightened-care framing: predeployment + postdeployment best practices to prevent personal injury, foreseeable harm, or property damage.", cite: "§ 8898.4(a)(1)." },
        },
      },
      {
        num: "II · iii",
        heading: "Disclosure obligations",
        topic: "Detected risks, incidents, post-verification changes.",
        cells: {
          mn: { text: "Detected risks, incidents, and material changes, including pre-verification risks and risks from later fine-tuning/modification.", cite: "§ 2, subd. 2(6) [325M.51, subd. 2]." },
          oh: { text: "Substantively identical disclosure trigger.", cite: "§ 3755.02(F)." },
          ca: { text: "Detected risks, material risk-profile changes, fine-tuning/modification risks, incident reports, and mitigation efforts.", cite: "§ 8898.4(a)(3)." },
        },
      },
      {
        num: "II · iv",
        heading: "Corrective action &amp; revocation",
        topic: "What an IVO does when a developer falls out of compliance.",
        cells: {
          mn: { text: "IVO <em>must</em> revoke verification for failed mitigation, refusal to cooperate with monitoring, governance violations, or failed corrective action.", cite: "§ 3, subd. 2(1)–(4) [325M.52, subd. 2]; § 2, subd. 2(7)." },
          oh: { text: "Same four mandatory revocation triggers.", cite: "§ 3755.08(A)–(D); § 3755.02(G)(1)–(3)." },
          ca: { text: "IVO must <em>decertify</em> non-compliant models; ongoing supervision &amp; revocation procedures must be in plan.", cite: "§ 8898.5(c); § 8898.3(b)(2)(C)(iii)–(iv)." },
        },
      },
      {
        num: "II · v",
        heading: "Plan modification",
        topic: "How an IVO updates its plan after licensure/designation.",
        cells: {
          mn: { text: "Detailed: written notice required; <strong>changes take effect on notification</strong>; Commissioner has <strong>6 months</strong> to reject; IVO then has 30 days to comply.", cite: "§ 3, subd. 3(a)–(e) [325M.52, subd. 3]." },
          oh: { text: "Mirror image of MN: same enumerated elements, same notification-effective rule, same 6-month review and 30-day cure.", cite: "§ 3755.09(A)–(C); § 3755.091(A)–(B)." },
          ca: { text: "<strong>Commission may not modify a plan</strong> submitted by an applicant; statute is otherwise silent on modification.", cite: "§ 8898.4(c)." },
        },
      },
    ],
  },
  {
    id: "b3",
    roman: "Section III",
    arabic: "3",
    title: "Oversight body &amp; <em>conflicts</em>",
    subs: [
      {
        num: "III · i",
        heading: "Oversight body",
        topic: "Composition and statutory role.",
        cells: {
          mn: { text: "AI Advisory Council inside Dept. of Commerce; Commissioner sets size and appoints all; Commissioner <em>must</em> delegate licensing &amp; auditing powers.", cite: "§ 4, subd. 1(a), subd. 2(a) [325M.53]." },
          oh: { text: "AI Safety Advisory Council in AG's office (with Auditor of State); AG <em>may</em> convey powers, including licensing.", cite: "§ 3755.06(A)–(B)." },
          ca: { text: "Standing 8-member Commission; gubernatorial seats for small developers, frontier developers, civil society, workers, academia, plus ex officio AG &amp; OES Director and an ethics expert.", cite: "§ 8898.1(b)(1)(A)–(E), (b)(2)(A)–(C)." },
        },
      },
      {
        num: "III · ii",
        heading: "Civil-society representation",
        topic: "Mandatory non-industry seat.",
        cells: {
          mn: { text: "At least one civil-society member (NGOs, research, policy, consumer/business advocates).", cite: "§ 4, subd. 1(b) [325M.53]." },
          oh: { text: "Same: at least one civil-society member with the same enumerated categories.", cite: "§ 3755.06(C)." },
          ca: { text: "Dedicated civil-society seat <em>and</em> a separate worker-interest seat.", cite: "§ 8898.1(b)(1)(C), (b)(1)(D)." },
        },
      },
      {
        num: "III · iii",
        heading: "Conflicts &amp; cooling-off",
        topic: "Independence guarantees on members.",
        cells: {
          mn: { text: "No undue influence; no incompatible employment; <strong>flat equity ban</strong> in AI companies (no carve-out); 1-year cooling-off; max 2 consecutive terms.", cite: "§ 4, subd. 2(b)(1)–(5); subd. 3(a) [325M.53]." },
          oh: { text: "Same independence rules; equity ban with explicit <strong>mutual fund / ETF carve-out</strong>; 1-year cooling-off; max 2 consecutive terms.", cite: "§ 3755.06(D)(1)–(5), (E); ETF carve-out at (D)(3)(b)." },
          ca: { text: "Free from undue influence; equity ban with mutual fund/ETF carve-out; 4-year terms (max 2 full); 1-year cooling-off from designated/applicant IVOs.", cite: "§ 8898.1(c)(2)–(4), (e), (f)(1)–(2)." },
        },
      },
      {
        num: "III · iv",
        heading: "Compensation &amp; removal",
        topic: "Practical operating terms for members.",
        cells: {
          mn: { text: "Reimbursement of necessary expenses; salary permitted; removal for inefficiency, neglect, or malfeasance; majority quorum.", cite: "§ 4, subd. 3(b)–(d) [325M.53]." },
          oh: { text: "Same expense + optional salary; AG may remove for inefficiency, neglect, malfeasance; majority quorum.", cite: "§ 3755.06(F)–(H)." },
          ca: { text: "Fixed <strong>$100 per diem</strong> + travel; removable by appointing authority for inefficiency, neglect, or malfeasance.", cite: "§ 8898.1(g); § 8898.1(f)(1)(B)." },
        },
      },
    ],
  },
  {
    id: "b4",
    roman: "Section IV",
    arabic: "4",
    title: "Reporting, fees &amp; <em>rulemaking</em>",
    subs: [
      {
        num: "IV · i",
        heading: "Annual reporting",
        topic: "What goes in the report and to whom.",
        cells: {
          mn: { text: "Annual report to legislature; capabilities, risks/benefits, evaluation adequacy, anonymized remediation compliance, observed risks, verified models, methods, and governance/funding changes. Redactions allowed.", cite: "§ 3, subd. 4(a)(1)–(8), (b) [325M.52, subd. 4]." },
          oh: { text: "Annual report to General Assembly, AG, and Auditor of State; same enumerated elements; redactions for trade secrets, PII, and security-sensitive content.", cite: "§ 3755.10(A)(1)–(8), (B)(1)–(4)." },
          ca: { text: "Annual report to Legislature (per § 9795) and Commission; six enumerated elements covering capabilities, evaluation, certifications, results, remediation, and additional risks.", cite: "§ 8898.5(d)(1)–(6)." },
        },
      },
      {
        num: "IV · ii",
        heading: "Document retention",
        topic: "How long IVO records must be kept.",
        cells: {
          mn: { text: "Verification, monitoring, and corrective-action documentation, retained <strong>10 years</strong> after the activity.", cite: "§ 3, subd. 4(c) [325M.52, subd. 4]." },
          oh: { text: "Documentation used to prepare the report, retained <strong>10 years</strong> after submission.", cite: "§ 3755.10(C)." },
          ca: { text: "Documents related to chapter activities, retained <strong>10 years</strong>.", cite: "§ 8898.5(f)." },
        },
      },
      {
        num: "IV · iii",
        heading: "Public transparency",
        topic: "What the public can see.",
        cells: {
          mn: { text: "Commissioner publishes <strong>redacted versions</strong> of IVO reports on Department of Commerce website.", cite: "§ 3, subd. 4(d) [325M.52, subd. 4]." },
          oh: { text: "Advisory council publishes redacted reports on AG's website.", cite: "§ 3755.06(J)." },
          ca: { text: "Public, accessible <strong>registry</strong> of IVOs and their standards/updates; published findings; biennial commission report to Legislature.", cite: "§ 8898.2(d)(1)–(5), (e), (f)." },
        },
      },
      {
        num: "IV · iv",
        heading: "Fees",
        topic: "How the program is funded.",
        cells: {
          mn: { text: "Reasonable application and renewal fees sufficient to offset administrative costs.", cite: "§ 2, subd. 6 [325M.51, subd. 6]." },
          oh: { text: "Reasonable application + annual renewal fees, restricted to four uses.", cite: "§ 3755.05(A)–(C)(1)–(4)." },
          ca: { text: "Commission <em>may</em> establish a reasonable fee structure to offset its costs.", cite: "§ 8898.6(c)." },
        },
      },
      {
        num: "IV · v",
        heading: "Rulemaking",
        topic: "Statutory rulemaking authority & floor.",
        cells: {
          mn: { text: "Commissioner <em>may</em> adopt rules necessary to implement §§ 325M.51–.54. No mandatory floor.", cite: "§ 2, subd. 8 [325M.51, subd. 8]." },
          oh: { text: "AG <em>shall</em> adopt rules under R.C. Ch. 119; rules <em>shall</em> at minimum cover six enumerated topics; stakeholder input required.", cite: "§ 3755.12(A)–(C); (B)(1)–(6)." },
          ca: { text: "Commission <em>may</em> adopt regulations covering minimum plan requirements, IVO conflicts, and fee structure.", cite: "§ 8898.6(a)–(c)." },
        },
      },
    ],
  },
  {
    id: "b5",
    roman: "Section V",
    arabic: "5",
    title: "License / designation <em>revocation</em>",
    subs: [
      {
        num: "V · i",
        heading: "Mandatory grounds",
        topic: "When the regulator must pull the license/designation.",
        cells: {
          mn: { text: "Commissioner <em>must</em> revoke if (1) plan is materially misleading; (2) IVO fails to adhere to plan; (3) material change compromises independence; (4) tech evolution renders methods obsolete; (5) verified AI causes material harm of the type the plan deems acceptable.", cite: "§ 2, subd. 4(1)–(5) [325M.51, subd. 4]." },
          oh: { text: "Same five mandatory grounds, in the same order.", cite: "§ 3755.04(A)–(E)." },
          ca: { text: "Commission <em>may</em> revoke (discretionary) on the same five grounds.", cite: "§ 8898.3(d)(1)–(5)." },
        },
      },
      {
        num: "V · ii",
        heading: "Cure opportunity",
        topic: "Chance to fix the problem before revocation.",
        cells: {
          mn: { text: "Commissioner <em>may</em> allow cure before terminating; this remains discretionary.", cite: "§ 2, subd. 5 [325M.51, subd. 5]." },
          oh: { text: "AG may grant cure if \"the public interest so requires\"; this is discretionary.", cite: "§ 3755.041." },
          ca: { text: "No statutory cure provision; instead, the <strong>3-year designation expires</strong> and the IVO must reapply.", cite: "§ 8898.3(c)." },
        },
      },
      {
        num: "V · iii",
        heading: "Partial licensure",
        topic: "What happens if only part of the plan is adequate.",
        cells: {
          mn: { text: "IVO licensed only for risks the plan adequately mitigates; license must specify covered risks and any markets.", cite: "§ 2, subd. 3(c)–(d) [325M.51, subd. 3]." },
          oh: { text: "Same: licensed only for risks the plan covers; license must \"expressly and specifically\" identify covered risks and segments.", cite: "§ 3755.03(C); § 3755.03(D)(1)–(2)." },
          ca: { text: "Commission considers whether plan ensures acceptable mitigation across enumerated factors; statute does not expressly contemplate partial designation.", cite: "§ 8898.3(b)(1)–(4)." },
        },
      },
    ],
  },
  {
    id: "b6",
    roman: "Section VI",
    arabic: "6",
    title: "Liability shield: the <em>carrot</em>",
    subs: [
      {
        num: "VI · i",
        heading: "Rebuttable presumption",
        topic: "The incentive that makes voluntary verification valuable.",
        cells: {
          mn: { text: "In a civil action for personal injury or property damage caused by AI: <strong>rebuttable presumption against liability</strong> if (1) AI was IVO-verified at time of injury; (2) injury arose from a verified risk; (3) AI was within the IVO's licensed market segment. <em>No statutory rebuttal standard.</em>", cite: "§ 5 [325M.54](1)–(3)." },
          oh: { text: "Same three threshold elements, plus a <strong>detailed rebuttal framework</strong>: rebutted by <em>clear and convincing evidence</em> of intentional/willful/reckless misconduct, material misrepresentation, failure to adhere to representations, failure to disclose new risks, or failure to implement corrective action, and that the conduct was a <em>proximate cause</em> of injury.", cite: "§ 3755.11(A)(1)–(3); (B)(1)(a)–(f), (B)(2)." },
          ca: { text: "<strong>No liability shield.</strong> S.B. 813 contains no rebuttable-presumption provision; the bill is regulatory/standard-setting only.", cite: "cf. §§ 8898–8898.6 (no analog)." },
        },
      },
    ],
  },
];

const SHARED: { html: string; cite: string }[] = [
  { html: "<strong>Same definitional core.</strong> Near-identical definitions of \"AI application,\" \"AI model,\" \"deployer,\" \"developer,\" \"security vendor.\"", cite: "MN § 1, subds. 2–8 · OH § 3755.01(A)–(F) · CA § 8898(a)–(h)." },
  { html: "<strong>Voluntary verification.</strong> No state requires AI to seek IVO verification.", cite: "MN § 2, subd. 7 · OH § 3755.07(B) · CA § 8898.1(d)–(e)." },
  { html: "<strong>Plan-centric licensing.</strong> Approval turns on plan adequacy and demonstrated independence from industry.", cite: "MN § 2, subd. 3(a)(1)–(2) · OH § 3755.03(A)(1)–(2) · CA § 8898.3(b)(1)–(4)." },
  { html: "<strong>Same five revocation triggers.</strong> Misleading plan, plan failure, lost independence, obsolete methods, material harm.", cite: "MN § 2, subd. 4 · OH § 3755.04 · CA § 8898.3(d)." },
  { html: "<strong>10-year retention</strong> of documentation across all three.", cite: "MN § 3, subd. 4(c) · OH § 3755.10(C) · CA § 8898.5(f)." },
  { html: "<strong>Civil-society representation</strong> required on the oversight body.", cite: "MN § 4, subd. 1(b) · OH § 3755.06(C) · CA § 8898.1(b)(1)(C)." },
  { html: "<strong>1-year post-service cooling-off</strong> for oversight members.", cite: "MN § 4, subd. 2(b)(4) · OH § 3755.06(D)(4) · CA § 8898.1(e)." },
];

const SPLITS: { html: string; cite: string }[] = [
  { html: "<strong>Who runs it.</strong> Commerce Commissioner (MN) vs. AG + Auditor of State (OH) vs. brand-new standalone Commission (CA).", cite: "MN § 4, subd. 1 · OH § 3755.06(A) · CA § 8898.1(a)." },
  { html: "<strong>License vs. designation.</strong> MN/OH issue licenses; CA designates with a <em>3-year sunset</em>.", cite: "CA § 8898.3(c)." },
  { html: "<strong>Revocation discretion.</strong> \"Must revoke\" (MN, OH) vs. \"may revoke\" (CA).", cite: "MN § 2, subd. 4 · OH § 3755.04 · CA § 8898.3(d)." },
  { html: "<strong>Plan amendment.</strong> Detailed, notice-effective process w/ 6-mo. review (MN, OH); <em>no commission modification</em> in CA.", cite: "MN § 3, subd. 3 · OH §§ 3755.09, 3755.091 · CA § 8898.4(c)." },
  { html: "<strong>Liability shield.</strong> Yes in MN and OH; OH adds a clear-and-convincing rebuttal. CA: <em>none</em>.", cite: "MN § 5 · OH § 3755.11(B)(1)–(2)." },
  { html: "<strong>Equity carve-out.</strong> No carve-out in MN; mutual fund/ETF carve-out in OH and CA.", cite: "MN § 4, subd. 2(b)(3) · OH § 3755.06(D)(3)(b) · CA § 8898.1(c)(4)." },
  { html: "<strong>Rulemaking.</strong> Permissive in MN and CA; <em>mandatory floor of six topics</em> in OH.", cite: "MN § 2, subd. 8 · OH § 3755.12(B)(1)–(6) · CA § 8898.6." },
  { html: "<strong>Public registry.</strong> CA requires a public registry of IVOs and standards; MN/OH publish redacted reports only.", cite: "CA § 8898.2(e) · MN § 3, subd. 4(d) · OH § 3755.06(J)." },
  { html: "<strong>Worker representation.</strong> Only CA designates a seat for the legal/economic interests of workers.", cite: "CA § 8898.1(b)(1)(D)." },
  { html: "<strong>Compensation.</strong> Optional salary (MN, OH) vs. fixed $100 per diem (CA).", cite: "MN § 4, subd. 3(b) · OH § 3755.06(F) · CA § 8898.1(g)." },
];

type MatrixCell = { html: string; cite: string };
type MatrixRow = { label: string; mn: MatrixCell; oh: MatrixCell; ca: MatrixCell };

const MATRIX: MatrixRow[] = [
  { label: "Codification",
    mn: { html: "New Minn. Stat. ch. 325M, §§ 325M.50–.54.", cite: "Bill caption; § 1." },
    oh: { html: "New Ohio R.C. ch. 3755, §§ 3755.01–.12.", cite: "Enacting clause § 1." },
    ca: { html: "New Cal. Gov. Code ch. 14, §§ 8898–8898.6.", cite: "Sec. 1." } },
  { label: "Regulator",
    mn: { html: "Commissioner of Commerce.", cite: "§ 1, subd. 4." },
    oh: { html: "Attorney General (with Auditor of State).", cite: "§ 3755.03; § 3755.06(A)." },
    ca: { html: "CA AI Standards &amp; Safety Commission, in GovOps Agency.", cite: "§ 8898.1(a)." } },
  { label: "Recognition",
    mn: { html: "License (no statutory term).", cite: "§ 2, subd. 1." },
    oh: { html: "License (renewable annual fees).", cite: "§ 3755.02; § 3755.05(A)." },
    ca: { html: "Designation; <strong>3-year term, renewable.</strong>", cite: "§ 8898.3(a), (c)." } },
  { label: "Voluntariness",
    mn: { html: "Voluntary.", cite: "§ 2, subd. 7." },
    oh: { html: "Voluntary.", cite: "§ 3755.07(B)." },
    ca: { html: "Voluntary.", cite: "§ 8898.1(d)–(e)." } },
  { label: "Plan elements",
    mn: { html: "13 enumerated elements.", cite: "§ 2, subd. 2(1)–(13)." },
    oh: { html: "14 enumerated elements (A)–(N).", cite: "§ 3755.02(A)–(N)." },
    ca: { html: "12 enumerated elements.", cite: "§ 8898.4(a)(1)–(12)." } },
  { label: "Risk metric",
    mn: { html: "Definition + measurable metrics + targets + protocol.", cite: "§ 2, subd. 2(1)(i)–(iv)." },
    oh: { html: "Definition + outcome metrics + baselines/targets + protocol.", cite: "§ 3755.02(A)(2)(a)–(c)." },
    ca: { html: "Definition + metrics + targets + protocol.", cite: "§ 8898.4(a)(4)(A)–(D)." } },
  { label: "Revocation grounds",
    mn: { html: "5 mandatory grounds.", cite: "§ 2, subd. 4(1)–(5)." },
    oh: { html: "5 mandatory grounds.", cite: "§ 3755.04(A)–(E)." },
    ca: { html: "5 grounds, <em>discretionary</em>.", cite: "§ 8898.3(d)(1)–(5)." } },
  { label: "Cure opportunity",
    mn: { html: "May allow cure (discretionary).", cite: "§ 2, subd. 5." },
    oh: { html: "May allow cure if public interest requires.", cite: "§ 3755.041." },
    ca: { html: "Not explicit; 3-yr re-designation cycle.", cite: "§ 8898.3(c)." } },
  { label: "IVO-side revocation",
    mn: { html: "Mandatory (4 triggers).", cite: "§ 3, subd. 2(1)–(4)." },
    oh: { html: "Mandatory (4 triggers).", cite: "§ 3755.08(A)–(D)." },
    ca: { html: "Decertify non-compliant AI; revocation procedure required in plan.", cite: "§ 8898.5(c); § 8898.3(b)(2)(C)(iv)." } },
  { label: "Plan amendment",
    mn: { html: "Notice; effective on notification; 6-mo. review; 30-day cure.", cite: "§ 3, subd. 3(a)–(e)." },
    oh: { html: "Same as MN.", cite: "§§ 3755.09, 3755.091." },
    ca: { html: "<strong>Commission cannot modify plan;</strong> no notice/review process.", cite: "§ 8898.4(c)." } },
  { label: "Annual report to",
    mn: { html: "Legislature (AI committee).", cite: "§ 3, subd. 4(a)." },
    oh: { html: "General Assembly, AG, Auditor of State.", cite: "§ 3755.10(A)." },
    ca: { html: "Legislature (per § 9795) and Commission.", cite: "§ 8898.5(d)." } },
  { label: "Public transparency",
    mn: { html: "Redacted reports on Dept. of Commerce site.", cite: "§ 3, subd. 4(d)." },
    oh: { html: "Redacted reports on AG site.", cite: "§ 3755.06(J)." },
    ca: { html: "Public IVO/standards <strong>registry</strong> + biennial commission report.", cite: "§ 8898.2(d)–(e)." } },
  { label: "Document retention",
    mn: { html: "10 years post-activity.", cite: "§ 3, subd. 4(c)." },
    oh: { html: "10 years post-report.", cite: "§ 3755.10(C)." },
    ca: { html: "10 years.", cite: "§ 8898.5(f)." } },
  { label: "Fees",
    mn: { html: "Reasonable application + renewal.", cite: "§ 2, subd. 6." },
    oh: { html: "Reasonable application + annual renewal; 4 permitted uses.", cite: "§ 3755.05." },
    ca: { html: "Discretionary fee structure.", cite: "§ 8898.6(c)." } },
  { label: "Oversight body",
    mn: { html: "Advisory Council; Commissioner sets size; mandatory delegation of licensing/audit power.", cite: "§ 4, subd. 1(a), 2(a)." },
    oh: { html: "AI Safety Advisory Council; AG may delegate licensing.", cite: "§ 3755.06(A)–(B)." },
    ca: { html: "8 named seats (5 gubernatorial + 3 ex officio/ethics).", cite: "§ 8898.1(b)." } },
  { label: "Equity carve-out",
    mn: { html: "<strong>None</strong>: flat ban on equity in AI companies.", cite: "§ 4, subd. 2(b)(3)." },
    oh: { html: "Mutual fund / ETF carve-out.", cite: "§ 3755.06(D)(3)(b)." },
    ca: { html: "Mutual fund / ETF carve-out.", cite: "§ 8898.1(c)(4)." } },
  { label: "Term limits",
    mn: { html: "Max 2 consecutive terms.", cite: "§ 4, subd. 3(a)." },
    oh: { html: "Max 2 consecutive terms.", cite: "§ 3755.06(E)." },
    ca: { html: "4-year terms; max 2 full terms.", cite: "§ 8898.1(f)(1)–(2)." } },
  { label: "Cooling-off",
    mn: { html: "1 year (AI firms or IVOs).", cite: "§ 4, subd. 2(b)(4)." },
    oh: { html: "1 year (IVO applicants/licensees, developers, deployers).", cite: "§ 3755.06(D)(4)." },
    ca: { html: "1 year (designated/applicant IVOs).", cite: "§ 8898.1(e)." } },
  { label: "Compensation",
    mn: { html: "Expenses + optional salary.", cite: "§ 4, subd. 3(b)." },
    oh: { html: "Expenses + optional salary.", cite: "§ 3755.06(F)." },
    ca: { html: "<strong>$100/day per diem</strong> + travel.", cite: "§ 8898.1(g)." } },
  { label: "Liability shield",
    mn: { html: "Rebuttable presumption (3 conditions); no rebuttal standard.", cite: "§ 5 [325M.54](1)–(3)." },
    oh: { html: "Presumption + <strong>clear &amp; convincing</strong> rebuttal (6 categories; proximate cause).", cite: "§ 3755.11(A)(1)–(3); (B)(1)(a)–(f), (2)." },
    ca: { html: "<em>None.</em>", cite: "cf. §§ 8898–8898.6 (no analog)." } },
  { label: "Rulemaking",
    mn: { html: "Permissive (\"may adopt\").", cite: "§ 2, subd. 8." },
    oh: { html: "<strong>Mandatory</strong> (\"shall adopt\") with 6-topic floor.", cite: "§ 3755.12(A)–(C); (B)(1)–(6)." },
    ca: { html: "Permissive; 3 enumerated subjects.", cite: "§ 8898.6(a)–(c)." } },
];

const TOC = [
  { href: "#b1", label: "Who runs the program", n: "§ I" },
  { href: "#b2", label: "Plan elements an IVO must publish", n: "§ II" },
  { href: "#b3", label: "Oversight body & conflicts", n: "§ III" },
  { href: "#b4", label: "Reporting, fees & rulemaking", n: "§ IV" },
  { href: "#b5", label: "License / designation revocation", n: "§ V" },
  { href: "#b6", label: "Liability shield (the carrot)", n: "§ VI" },
  { href: "#shared", label: "Shared DNA vs. divergence", n: "§ Synth." },
  { href: "#matrix", label: "Side-by-side matrix · 21 dimensions", n: "§ Ref." },
];

const PLATES: { state: State; abbr: string; billno: string; pname: string; pmeta: string }[] = [
  { state: "mn", abbr: "MN", billno: "S.F. 4636", pname: "Minnesota", pmeta: "Sens. Frentz &amp; Lucero · 94th Sess. (2026)<br>Minn. Stat. §§ 325M.50–.54" },
  { state: "oh", abbr: "OH", billno: "H.B. 628", pname: "Ohio", pmeta: "Rep. Mathews · 136th Gen. Assembly<br>Ohio R.C. §§ 3755.01–.12" },
  { state: "ca", abbr: "CA", billno: "S.B. 813", pname: "California", pmeta: "Sen. McNerney, as amended<br>Cal. Gov. Code §§ 8898–8898.6" },
];

const FONTS_HREF = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

export default function IVO() {
  useDocumentTitle("IVO Comparison · MN · OH · CA | Rafal's Portfolio");

  useEffect(() => {
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "";
    const fontsLink = document.createElement("link");
    fontsLink.rel = "stylesheet";
    fontsLink.href = FONTS_HREF;
    document.head.append(pre1, pre2, fontsLink);
    return () => {
      pre1.remove();
      pre2.remove();
      fontsLink.remove();
    };
  }, []);

  return (
    <div className="ivo-page">
      <header className="hero">
        <div className="wrap">
          <div className="eyebrow-row">
            <span className="chip fill">Comparative Statutes</span>
            <span className="chip">2025–2026</span>
            <span className="chip ca">Working Draft</span>
          </div>
          <h1 className="title">
            Three states, <em>one</em> regulatory idea: <span className="mn-acc">Minnesota</span>, <span className="oh-acc">Ohio</span>, <span className="ca-acc">California</span>.
          </h1>
          <div className="subtitle">A side-by-side reading of <em>S.F. 4636</em>, <em>H.B. 628</em>, and <em>S.B. 813</em>.</div>
          <p className="lede">
            Each bill creates a voluntary regime in which third-party "Independent Verification Organizations" certify AI systems against published risk plans. The structure is shared. The institutional choices, the discretion levels, and the carrot-and-stick details <strong>diverge</strong>, sometimes loudly. Below: <strong>six sections</strong>, <strong>twenty-one matrix dimensions</strong>, every cell with its statutory citation.
          </p>

          <div className="plates">
            {PLATES.map((p) => (
              <div key={p.state} className={`plate ${p.state}`}>
                <div className="pcrest"><span className="abbr">{p.abbr}</span><span className="billno">{p.billno}</span></div>
                <div className="pname">{p.pname}</div>
                <div className="pmeta" dangerouslySetInnerHTML={{ __html: p.pmeta }} />
              </div>
            ))}
          </div>

        </div>
      </header>

      <section className="block">
        <div className="wrap">
          <div className="secrow"><span className="sectag">Contents</span><span className="secnum">§</span></div>
          <h3 className="head">What you'll find <em>herein</em></h3>
          <div className="toc">
            {TOC.map((t) => (
              <a key={t.href} href={t.href}>
                <span className="label">{t.label}</span>
                <span className="n">{t.n}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {BRANCHES.map((b) => (
        <section key={b.id} className="block" id={b.id}>
          <div className="wrap">
            <div className="secrow"><span className="sectag">{b.roman}</span><span className="secnum">{b.arabic}</span></div>
            <h3 className="head" dangerouslySetInnerHTML={{ __html: b.title }} />
            {b.subs.map((sub) => (
              <div key={sub.num} className="branch">
                <div className="topic">
                  <div className="num">{sub.num}</div>
                  <h5 dangerouslySetInnerHTML={{ __html: sub.heading }} />
                  <p>{sub.topic}</p>
                </div>
                <div className="nodes">
                  {(["mn", "oh", "ca"] as State[]).map((s) => (
                    <div key={s} className={`node ${s}`}>
                      <div className="flag">{STATE_LABEL[s]}</div>
                      <div className="text">
                        <span dangerouslySetInnerHTML={{ __html: sub.cells[s].text }} />
                        <span className="cite">{sub.cells[s].cite}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="block" id="shared">
        <div className="wrap">
          <div className="secrow"><span className="sectag">§ Synthesis</span><span className="secnum">§</span></div>
          <h3 className="head">Shared <em>DNA</em> · where the three diverge</h3>

          <div className="twocol">
            <div className="pane same">
              <h6>In common across all three</h6>
              <h4>Shared <em>DNA</em></h4>
              <ul>
                {SHARED.map((item, i) => (
                  <li key={i}>
                    <span dangerouslySetInnerHTML={{ __html: item.html }} />
                    <span className="cite">{item.cite}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pane diff">
              <h6>Where they break: divergence</h6>
              <h4>The <em>splits</em></h4>
              <ul>
                {SPLITS.map((item, i) => (
                  <li key={i}>
                    <span dangerouslySetInnerHTML={{ __html: item.html }} />
                    <span className="cite">{item.cite}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="block" id="matrix">
        <div className="wrap">
          <div className="secrow"><span className="sectag">§ Reference</span><span className="secnum">§</span></div>
          <h3 className="head">Side-by-side <em>matrix</em> · 21 dimensions</h3>
          <p className="body" style={{ marginBottom: 22 }}>
            Every cell carries its statutory citation. Use this when you need to look up a specific provision; use the sections above when you want to read the regime as a whole.
          </p>

          <div className="matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Dimension</th>
                  <th>MN · S.F. 4636</th>
                  <th>OH · H.B. 628</th>
                  <th>CA · S.B. 813</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.label}>
                    <td className="label">{row.label}</td>
                    {(["mn", "oh", "ca"] as State[]).map((s) => (
                      <td key={s}>
                        <span className="v" dangerouslySetInnerHTML={{ __html: row[s].html }} />
                        <span className="cite">{row[s].cite}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap">
          <div>
            <span className="label">Colophon</span>
            <h4>Set in EB Garamond, with JetBrains Mono.</h4>
            <p>
              Citations refer to bills as introduced or amended: Minnesota S.F. No. 4636 (94th Sess., 2026, Sens. Frentz &amp; Lucero); Ohio H.B. No. 628 (136th Gen. Assembly, Reg. Sess. 2025–26, Rep. Mathews); California S.B. 813 (Sen. McNerney, as amended).
            </p>
          </div>
          <div className="sig">
            <span className="label">Compiled by</span>
            <span className="name">Rafal Fryc</span><br />
            <a href="https://www.rafalsportfolio.me/">rafalsportfolio.me</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
