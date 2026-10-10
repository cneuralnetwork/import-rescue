# Import Rescue business plan

Status: local planning draft, 10 October 2026. Not yet produced or validated in cfo.ai. All figures below are explicit hypothetical planning assumptions, not market research or forecasts. Team: ISeeData.

## Customer and problem

Operations teams and agencies repeatedly importing supplier orders lose time when a CSV changes shape. A conventional import fails; a careless automatic repair can silently change money, discard repeats, or lose records. Import Rescue turns a failed import into a reviewable transformation with a receipt for every changed value.

Initial wedge: agencies onboarding multiple supplier feeds into one customer order schema. Sell a reliable review-and-staging workflow before expanding to production databases. The current prototype supports local CSV files, USD unit prices, one order schema, and SQLite staging.

## Pricing hypothesis

Start with one paid plan: $79 per workspace per month, including 100 imports of up to 10,000 rows each. Charge $0.50 per additional import. Offer a limited 10-import evaluation, not an unlimited free tier. No billing is implemented in this prototype.

Validate willingness to pay with 10 operations interviews, then 3 paid design partners. The concrete value measure is operator time per successfully reconciled import, compared with their previous manual process. Do not claim time savings before measurement.

## Costs and unit economics

Planning budget per active workspace per month:

| Item | Assumption |
| --- | ---: |
| Mapping model calls | $3.00 |
| Compute and persistent staging | $4.00 |
| Logs and storage | $2.00 |
| Support allocation | $8.00 |
| Payment processing allowance | $3.00 |
| Total variable cost | $20.00 |
| Revenue | $79.00 |
| Contribution | $59.00 |
| Contribution margin | 74.7% |

The model-call number is a spending allowance, not a statement of any provider's current price. Instrument token counts and actual billed rates before launch. In the MVP, deterministic mappings are local and unknown columns may be reviewed by a model. Never send full datasets to the model.

Fixed monthly operating budget: $500. Initial available cash: $6,000. Founder salaries, tax, incorporation, and acquisition costs are excluded and need explicit additions before treating this as a runway forecast.

## Twelve-month scenario

Assume 3 net new paying workspaces per month, no churn, no overage revenue, and no acquisition spend. These assumptions are deliberately simple and need sensitivity testing in cfo.ai.

| Month | Paying workspaces | Revenue | Variable cost | Fixed cost | Net cash flow | Ending cash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 3 | $237 | $60 | $500 | -$323 | $5,677 |
| 2 | 6 | $474 | $120 | $500 | -$146 | $5,531 |
| 3 | 9 | $711 | $180 | $500 | $31 | $5,562 |
| 4 | 12 | $948 | $240 | $500 | $208 | $5,770 |
| 5 | 15 | $1,185 | $300 | $500 | $385 | $6,155 |
| 6 | 18 | $1,422 | $360 | $500 | $562 | $6,717 |
| 7 | 21 | $1,659 | $420 | $500 | $739 | $7,456 |
| 8 | 24 | $1,896 | $480 | $500 | $916 | $8,372 |
| 9 | 27 | $2,133 | $540 | $500 | $1,093 | $9,465 |
| 10 | 30 | $2,370 | $600 | $500 | $1,270 | $10,735 |
| 11 | 33 | $2,607 | $660 | $500 | $1,447 | $12,182 |
| 12 | 36 | $2,844 | $720 | $500 | $1,624 | $13,806 |

Operating break-even: ceil($500 / $59) = 9 paying workspaces. Zero-revenue runway at the assumed fixed burn: 12 months. Adding a $2,000/month founder salary changes zero-revenue runway to 2.4 months and break-even to 43 workspaces. This is a major sensitivity, not a rounding detail.

## cfo.ai working prompt

Create a business plan for Import Rescue by team ISeeData, an agent that repairs supplier CSV imports, preserves value-level provenance, holds ambiguous rows, and stages validated orders. Evaluate the explicit assumptions in this draft: $79/month/workspace; $20 variable monthly cost; $500 fixed monthly cost; $6,000 opening cash; 3 net new customers/month. Build a 12-month cash-flow model. Challenge customer demand, support cost, model cost, no-churn and zero-CAC assumptions. Include downside scenarios with no growth, 5% monthly churn, $150 CAC, and a $2,000/month founder salary. Clearly label hypotheses and produce pricing, costs, revenue, runway, validation milestones, and risks. Do not invent interview evidence or market size.

## Required cfo.ai evidence

Use the event signup link https://cfo.ai/neathacks in the user's account. The event instructions require card entry and immediate subscription cancellation. Account/payment steps belong to the user. Save the resulting plan or an accessible plan link after the user completes account setup. Set CFO_PLAN_URL locally only after a real plan exists. This draft alone does not satisfy the hackathon requirement to use cfo.ai.
