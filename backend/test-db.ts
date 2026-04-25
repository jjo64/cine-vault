
import { prisma } from "./src/lib/prisma.js";

async function test() {
  try {
    console.log("Testing connection...");
    await prisma.$connect();
    console.log("Connection successful.");

    console.log("Testing reviews query...");
    const reviews = await prisma.reviews.findMany({
      take: 1,
      include: {
        movies_ref: true,
      }
    });
    console.log("Query successful, found:", reviews.length, "reviews");
    if (reviews.length > 0) {
      console.log("Sample review:", JSON.stringify(reviews[0], null, 2));
    }
  } catch (error) {
    console.error("Test failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
