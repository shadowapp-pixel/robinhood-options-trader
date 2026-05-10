import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const stripeCustomerId = user?.privateMetadata?.stripeCustomerId as string | undefined;

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
