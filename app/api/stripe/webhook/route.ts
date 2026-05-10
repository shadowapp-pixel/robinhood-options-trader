import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripe requires the raw request body for signature verification.
export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const clerk = await clerkClient();

  try {
    switch (event.type) {
      // ── Subscription started (checkout completed) ──────────────────────────
      case 'checkout.session.completed': {
        const session    = event.data.object as Stripe.Checkout.Session;
        const userId     = session.client_reference_id;
        const customerId = session.customer as string;

        if (!userId) break;

        await clerk.users.updateUserMetadata(userId, {
          publicMetadata:  { isPro: true },
          privateMetadata: {
            stripeCustomerId:     customerId,
            stripeSubscriptionId: session.subscription,
          },
        });
        break;
      }

      // ── Subscription cancelled / expired ───────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.clerkUserId;

        if (!userId) break;

        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: { isPro: false },
        });
        break;
      }

      // ── Payment failed (optional: downgrade immediately) ───────────────────
      case 'invoice.payment_failed': {
        const invoice        = event.data.object as Stripe.Invoice & { subscription?: string };
        if (!invoice.subscription) break;
        const subscription   = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId         = subscription.metadata?.clerkUserId;

        if (!userId) break;

        // Only downgrade after Stripe gives up (status = 'unpaid' / 'canceled')
        if (['unpaid', 'canceled'].includes(subscription.status)) {
          await clerk.users.updateUserMetadata(userId, {
            publicMetadata: { isPro: false },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
