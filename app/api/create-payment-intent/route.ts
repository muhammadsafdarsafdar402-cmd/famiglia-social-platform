import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description } = body;

    console.log("1. Received Payment Request:", { amount, description });

    if (!amount) {
      throw new Error("Amount is missing from request body");
    }

    // Fix: Convert string "150.00" to number 150
    const numberAmount = parseFloat(String(amount)); 
    
    // Fix: Ensure minimum charge ($0.50)
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

    console.log("3. Success! Client Secret:", paymentIntent.client_secret);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error(" Stripe API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}