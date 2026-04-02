# Monetization

## Pricing Model

| Tier | Price | Billing |
|------|-------|---------|
| Free (Wanderer) | $0 | — |
| Pro (Valhalla Pro) | $12/month | Monthly |
| Pro Annual | $8/month ($96/year) | Annual (33% discount) |

## Revenue Projections

| Users | Free % | Pro % | MRR |
|-------|--------|-------|-----|
| 1,000 | 95% | 5% | $600 |
| 5,000 | 92% | 8% | $4,800 |
| 10,000 | 90% | 10% | $12,000 |
| 50,000 | 88% | 12% | $72,000 |

## Conversion Strategy

### Trial
- 7-day Pro trial on signup
- Referral extensions (+3 days per invite)
- Full feature access during trial

### Soft Paywall
- Usage-based limits (not hard blocks)
- Value shown before gate: "Oracle analyzed 5 quests. Full access requires Pro."
- Discount at decision moments (trial ending, comeback)

### Pricing Psychology
- Annual saves 33% — highlighted in UI
- "$8/mo" framing for annual (not "$96/year")
- Feature comparison emphasizes Pro-only capabilities
- No hidden fees, no surprise charges

## Future Revenue Streams

| Stream | Timeline | Model |
|--------|----------|-------|
| Team workspaces | 6 months | Per-seat ($8/user/mo) |
| API access | 6 months | Usage-based |
| Enterprise SSO | 12 months | Custom pricing |
| Marketplace (custom widgets) | 12+ months | Revenue share |

## Payment Integration (Architecture)

```
Client → subscribe(tier, interval) → Backend creates Stripe Checkout Session
→ Redirect to Stripe → Payment → Webhook → Update profiles.tier in Supabase
→ Client refreshes tier from profile
```

Currently: demo mode (instant local upgrade). Stripe integration requires:
1. Stripe account
2. Supabase Edge Function for checkout session creation
3. Webhook endpoint for payment confirmation
4. Customer portal for subscription management

## Key Financial Metrics

| Metric | Formula |
|--------|---------|
| MRR | Pro users × price |
| ARPU | MRR / total users |
| LTV | ARPU × avg lifetime months |
| CAC | Marketing spend / new users |
| Churn | Users cancelled / total Pro users |
