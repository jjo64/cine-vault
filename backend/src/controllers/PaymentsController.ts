import 'dotenv/config';
import Stripe from "stripe"
import { Request, Response } from "express"
import { IAuthRequest } from "../middlewares/auth.middlewares.js"
import { prisma } from "../lib/prisma.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export const createCheckoutSession = async (req: IAuthRequest, res: Response) => {
    const PRICE_IDS = {
        vip: "price_1T1Cm0BQQbliTr5uCZTeQnEA",
        pro: "price_1T1CmWBQQbliTr5u1SE1fMib",
    };

  try {
    const { userId, plan } = req.body;

    if (!PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return res.status(400).json({ error: "Plan inválido" });
    }

    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${process.env.FRONT_URL}/success`,
      cancel_url: `${process.env.FRONT_URL}/cancel`,
      metadata: {
        userId: user.id.toString(),
        plan,
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
  console.error("STRIPE ERROR:", error.message);
  console.error(error);
  res.status(500).json({ error: error.message });
}
}