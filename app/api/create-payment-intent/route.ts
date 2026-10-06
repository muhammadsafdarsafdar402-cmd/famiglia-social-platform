import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    // Create the Stripe client here (not at the top of the file),
    // so the build does not fail when the key is missing.
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }
    const stripe = new Stripe(key, {
      apiVersion: '2023-10-16' as any,
    });

    const body = await request.json();
    const { amount, description } = body;

    console.log("1. Received Payment Request:", { amount, description });

    if (!amount) {
      throw new Error("Amount is missing from request body");
    }

    // Convert string "150.00" to number 150
    const numberAmount = parseFloat(String(amount));

    // Ensure minimum charge ($0.50)
    if (isNaN(numberAmount) || numberAmount < 0.50) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    console.log("2. Creating Stripe Intent for:", numberAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numberAmount * 100), // Convert to cents
      currency: "usd",
      description: description || "Famiglia Oro Checkout",
      automatic_payment_methods: { enabled: true },
    });

    console.log("3. Payment intent created:", paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Stripe API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}