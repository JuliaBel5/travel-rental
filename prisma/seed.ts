import { PrismaClient, Prisma } from "@prisma/client";

import { amenities } from "../src/data/amenities";
import { categories } from "../src/data/categories";
import { hosts } from "../src/data/hosts";
import { listings } from "../src/data/listings";
import { reviews } from "../src/data/reviews";

const prisma = new PrismaClient();

const json = (value: unknown) => value as Prisma.InputJsonValue;

async function main() {
  // Idempotent: clear in FK-safe order, then re-insert from the mock source of truth.
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.host.deleteMany();
  await prisma.category.deleteMany();
  await prisma.amenity.deleteMany();

  await prisma.host.createMany({ data: hosts });

  await prisma.amenity.createMany({
    data: amenities.map((a) => ({ key: a.key, label: json(a.label) })),
  });

  await prisma.category.createMany({
    data: categories.map((c) => ({ key: c.key, label: json(c.label), icon: c.icon })),
  });

  await prisma.listing.createMany({
    data: listings.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: json(l.title),
      description: json(l.description),
      type: l.type,
      categoryKeys: l.categoryKeys,
      location: json(l.location),
      pricePerNight: l.pricePerNight,
      currency: l.currency,
      cleaningFee: l.cleaningFee,
      serviceFeeRate: l.serviceFeeRate,
      rating: l.rating,
      reviewsCount: l.reviewsCount,
      maxGuests: l.maxGuests,
      bedrooms: l.bedrooms,
      beds: l.beds,
      bathrooms: l.bathrooms,
      amenityKeys: l.amenityKeys,
      images: l.images,
      hostId: l.hostId,
    })),
  });

  await prisma.review.createMany({
    data: reviews.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      author: r.author,
      avatar: r.avatar,
      rating: r.rating,
      date: r.date,
      text: json(r.text),
    })),
  });

  console.log("Seeded:", {
    hosts: hosts.length,
    amenities: amenities.length,
    categories: categories.length,
    listings: listings.length,
    reviews: reviews.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
