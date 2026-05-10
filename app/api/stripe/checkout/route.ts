import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to upgrade' }, { status: 401 });
  }

  const user = await currentUser();
  const existingCustomerId = user?.privateMetadata?.stripeCustomerId as string | undefined;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: userId,
    ...(existingCustomerId
      ? { customer: existingCustomerId }
      : { customer_email: user?.emailAddresses[0]?.emailAddress }
    ),
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    subscription_data: {
      metadata: { clerkUserId: userId },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
