const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@Jalsa2024',
    12
  );
  await prisma.admin.upsert({
    where: { email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@jalsaresort.com' },
    update: {},
    create: {
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@jalsaresort.com',
      password: hashedPassword,
      name: 'Jalsa Admin',
    },
  });
  console.log('✅ Admin created');

  // Rooms — upsert by slug (SQLite-safe, no skipDuplicates)
  const rooms = [
    {
      slug: 'luxury-cottage',
      name: 'Luxury Cottage',
      description: 'An exclusive standalone cottage offering ultimate privacy. Immersed in lush greenery, featuring a private sit-out area, deep soaking tub, and bespoke heritage furnishings.',
      pricePerNight: 18500,
      maxOccupancy: 3,
      amenities: JSON.stringify(['King Bed', 'Private Deck', 'Soaking Tub', 'Free WiFi', 'Air Conditioning', 'Mini Bar', 'Forest View']),
      images: JSON.stringify(['https://lh3.googleusercontent.com/aida-public/AB6AXuCNuWWYtzoyTTjad7tYSVjzrC23n9XOOUfNeW79WjCHtYnl1ILydxAvj3ODaXy3D0nJzbKJGCYNlcU2lTjFG_2UTj1g23CLzOJ2dDq6A9y7pUCZZc8BBUhzsuTEc9q-pP7j95JOQtKFhuCwMRs7yxohELikIZE32dokvSPKM60ndjgHywHx2nJImZw1qxb4UIPc71ImqGGjR2ORvubCpOAUy7OgoYDZAP76YwdQyV_tLOraZAjX02Y-OFs1d15XwsoCV0wZmMcUCjE']),
    },
    {
      slug: 'executive-room',
      name: 'Executive Room',
      description: 'Spacious and elegantly appointed, our Executive Rooms offer panoramic views of the resort gardens. Ideal for couples seeking a refined and relaxing environment.',
      pricePerNight: 12000,
      maxOccupancy: 2,
      amenities: JSON.stringify(['Queen/King Bed', 'Garden View', 'Work Desk', 'Free WiFi', 'Air Conditioning', 'Smart TV']),
      images: JSON.stringify(['https://lh3.googleusercontent.com/aida-public/AB6AXuB1x4fZ0Qod7utniembPFOxSYb1vkJeLJV-xTzgCmV35QMm-1JOb-wv9ubS31MUylHzkNIUyhAwOwEheGeFerK6pv0HCsYGRaCf1WtZgXL42EGn1kPWjSrQgYTL6AyaSdnlH7Efum5iA28n8vgln5WopTuPheSeD8OSL0D3B-hNI4Dfz7nQ9dZDIo7lq4X64eJVCzIBxiLF5tm-harqcNLVZqkoCsKknDHJDYfQ8fMh72L_EQ_fzfmZANBJnjfwZXxY7_yWNqcGrgc']),
    },
    {
      slug: 'deluxe-room',
      name: 'Deluxe Room',
      description: 'Cozy and refined, our Deluxe Rooms feature high-thread-count sheets, a small sitting area with velvet chairs, and warm intimate lighting creating a relaxing ambiance.',
      pricePerNight: 4000,
      maxOccupancy: 2,
      amenities: JSON.stringify(['Double Bed', 'City/Garden View', 'Free WiFi', 'Air Conditioning', 'Smart TV', 'In-Room Safe']),
      images: JSON.stringify(['https://lh3.googleusercontent.com/aida-public/AB6AXuDwVELBUSkp7kVZ_I1_hs55TMZVRkwhd7YoFXheY848mLs9wgA6pWL0IXHWyiUD7KK1E6TDBwzoycWgoUdabGAyPmUMYkL5NfwTZSKFgGkItiEKBOZ1J5D2inQTyjWtQkzpvZV_ACIm6JGJDgBnmxNCAAr7lklvGP0RlOOkHXqm78ZkhQV6u22IlnX5Ils-tjWaEVjczlNhXjlgFfdP-mAfL66zQcDPXI4tg9Da18eocFWTbloDpvBxho9yeQWxZu7iWrORHHoqn-m7Rg']),
    },
  ];
  for (const room of rooms) {
    await prisma.room.upsert({ where: { slug: room.slug }, update: {}, create: room });
  }
  console.log('✅ Rooms seeded');

  // Menu categories
  const starters  = await prisma.menuCategory.upsert({ where: { id: 1 }, update: {}, create: { name: 'Starters', sortOrder: 1 } });
  const mains     = await prisma.menuCategory.upsert({ where: { id: 2 }, update: {}, create: { name: 'Main Course', sortOrder: 2 } });
  const breads    = await prisma.menuCategory.upsert({ where: { id: 3 }, update: {}, create: { name: 'Breads & Rice', sortOrder: 3 } });
  const desserts  = await prisma.menuCategory.upsert({ where: { id: 4 }, update: {}, create: { name: 'Desserts', sortOrder: 4 } });
  const beverages = await prisma.menuCategory.upsert({ where: { id: 5 }, update: {}, create: { name: 'Beverages', sortOrder: 5 } });

  // Menu items — upsert by id
  const menuItems = [
    { id: 1,  categoryId: starters.id,  name: 'Paneer Tikka',          description: 'Cottage cheese marinated in yogurt and aromatic spices, grilled in tandoor',  price: 320, isVeg: true,  sortOrder: 1 },
    { id: 2,  categoryId: starters.id,  name: 'Chicken Reshmi Kebab',  description: 'Tender chicken marinated in cream and saffron, slow-cooked in tandoor',         price: 420, isVeg: false, sortOrder: 2 },
    { id: 3,  categoryId: starters.id,  name: 'Hara Bhara Kebab',      description: 'Spinach and green pea patties with mint chutney',                               price: 280, isVeg: true,  sortOrder: 3 },
    { id: 4,  categoryId: starters.id,  name: 'Seekh Kebab',           description: 'Spiced minced lamb on skewers, cooked over charcoal',                           price: 480, isVeg: false, sortOrder: 4 },
    { id: 5,  categoryId: mains.id,     name: 'Dal Makhani',           description: 'Slow-cooked black lentils in rich tomato and butter gravy',                    price: 340, isVeg: true,  sortOrder: 1 },
    { id: 6,  categoryId: mains.id,     name: 'Butter Chicken',        description: 'Tender chicken in velvety tomato-cream sauce with aromatic spices',             price: 480, isVeg: false, sortOrder: 2 },
    { id: 7,  categoryId: mains.id,     name: 'Palak Paneer',          description: 'Cottage cheese cubes in fresh spinach gravy',                                  price: 360, isVeg: true,  sortOrder: 3 },
    { id: 8,  categoryId: mains.id,     name: 'Rogan Josh',            description: 'Slow-braised lamb in Kashmiri spices and yogurt',                              price: 560, isVeg: false, sortOrder: 4 },
    { id: 9,  categoryId: mains.id,     name: 'Shahi Paneer',          description: 'Royal preparation of paneer in cashew and cream gravy',                        price: 380, isVeg: true,  sortOrder: 5 },
    { id: 10, categoryId: breads.id,    name: 'Garlic Naan',           description: 'Leavened bread with garlic and butter, baked in tandoor',                      price: 80,  isVeg: true,  sortOrder: 1 },
    { id: 11, categoryId: breads.id,    name: 'Biryani (Veg)',         description: 'Fragrant basmati rice layered with spiced vegetables and saffron',              price: 380, isVeg: true,  sortOrder: 2 },
    { id: 12, categoryId: breads.id,    name: 'Biryani (Chicken)',     description: 'Aromatic long-grain rice slow-cooked with tender chicken and whole spices',     price: 480, isVeg: false, sortOrder: 3 },
    { id: 13, categoryId: desserts.id,  name: 'Gulab Jamun',           description: 'Soft milk-solid dumplings in rose-scented sugar syrup',                        price: 180, isVeg: true,  sortOrder: 1 },
    { id: 14, categoryId: desserts.id,  name: 'Kulfi Falooda',         description: 'Traditional Indian ice cream with rose syrup and vermicelli',                  price: 220, isVeg: true,  sortOrder: 2 },
    { id: 15, categoryId: desserts.id,  name: 'Malpua',                description: 'Pan-fried sweet pancakes drizzled with saffron rabri',                         price: 240, isVeg: true,  sortOrder: 3 },
    { id: 16, categoryId: beverages.id, name: 'Masala Chai',           description: 'Spiced Indian tea with ginger and cardamom',                                   price: 80,  isVeg: true,  sortOrder: 1 },
    { id: 17, categoryId: beverages.id, name: 'Fresh Lime Soda',       description: 'Freshly squeezed lime with soda, sweet or salted',                             price: 120, isVeg: true,  sortOrder: 2 },
    { id: 18, categoryId: beverages.id, name: 'Mango Lassi',           description: 'Blended yogurt drink with Alphonso mango',                                     price: 180, isVeg: true,  sortOrder: 3 },
  ];
  for (const item of menuItems) {
    await prisma.menuItem.upsert({ where: { id: item.id }, update: {}, create: item });
  }
  console.log('✅ Menu seeded');

  // Gallery
  const galleryImages = [
    { id: 1, url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFd7y99MC3XjYvRgcTjRX3Aog1O64hsXt0cnuvYyXvgzETsS_wEiWBXcO1TRCVSCoJwCEsOjcIcKbsBsr3a-q8ifwVsf6ifJVIeNGoK_2O6s3I1lA69XrPhbDFxlt8Bjs0byMRrYYPePkE3cQt6qeSMylWwRHgO97R7jvr1_eO0YKJ25ZIaGA6YYd9G14N2ryBc_H0E2Q1Dkls3eOsk24rG74Uzn-McJSI6Nj45RRiSvKPahtKd-wi-_FkPewvhRTvHgUzkqQ9XVo', caption: 'Resort Entrance at Golden Hour', category: 'general', sortOrder: 1 },
    { id: 2, url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNuWWYtzoyTTjad7tYSVjzrC23n9XOOUfNeW79WjCHtYnl1ILydxAvj3ODaXy3D0nJzbKJGCYNlcU2lTjFG_2UTj1g23CLzOJ2dDq6A9y7pUCZZc8BBUhzsuTEc9q-pP7j95JOQtKFhuCwMRs7yxohELikIZE32dokvSPKM60ndjgHywHx2nJImZw1qxb4UIPc71ImqGGjR2ORvubCpOAUy7OgoYDZAP76YwdQyV_tLOraZAjX02Y-OFs1d15XwsoCV0wZmMcUCjE', caption: 'Luxury Cottage Interior', category: 'rooms', sortOrder: 2 },
    { id: 3, url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7F0fxs5bxuPDVSUCJn1zIWd8T63AeCfAQpOV98PCWMkjvgnotOtThe1dsZa1oeQi-lMH_iZ4EhWzHCif5tzYorrhjXMuPnY9BvrapNnYpA6u1JbrbXrV8xBWFeNSYMPtcbeyEvNNOAWi7y0U1sL0imfViII3xsxCtxLwE8rY08BEFeg1EA1-6PDGN3RgJ0RJDTIWNZu15hm4zE1mHxLUq5BLlROv18REWQgGXTYDVpImuEvYjyU7CyAyBAzQF6CQJG3h8a0498po', caption: 'Fine Dining Cuisine', category: 'dining', sortOrder: 3 },
    { id: 4, url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfPJbWBHDYIkhe8ggpFB-Wmumr1p2r1-ACXjvIt4fYkROWioB0BpY1QXSfeCpTikx_BowuLBjirGBMAW3MaQ35YNZ_Oox5Dfq0ZpcC7vb1boK1uH054mPDj5SIQ6RPa_DXg9yYdXEzOxAIkRJlP7Ual7q5qqwBZPg1SO7NnDwvtEXdnTRndb2q-OqKPE93IwYtJiexz5uzVl_J2mhVSYz5lOS-Wb9YTPPKAeL_3DKyf0Paw6sLDNIPB0C5M9-av2uE9tFALIi0sakvHg', caption: 'Elegant Dining Room', category: 'dining', sortOrder: 4 },
    { id: 5, url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBljyF8Qi_YILkESmUubCp1gbw940IziPKgQzSSOEslzPVOojVCAFLT4i6LGlujegtloPZOW4AEBifhhJ2sJhwQhcpX5DKx9zDVJaDalctTPjDU7_9XlfwYW0bemDRDucYl0Ks252J9DRvhtb4RRxWTHgApLk1VN3_d2CmjCxbPumr9IEXzoluDlkKSLVEqejfvAX2yaTZpMkVy4kk9PBhfGj9szdUu8jfeERozYCveezQVB5TIo5Norl9nMTR1QXwyQvu0r8MpXQg', caption: 'Restaurant Ambiance', category: 'dining', sortOrder: 5 },
  ];
  for (const img of galleryImages) {
    await prisma.galleryImage.upsert({ where: { id: img.id }, update: {}, create: img });
  }
  console.log('✅ Gallery seeded');

  // Reviews
  const reviews = [
    { id: 1, name: 'Priya Sharma',  email: 'priya@example.com',  rating: 5, title: 'Absolutely magical stay',    body: "The Luxury Cottage exceeded all expectations. The blend of nature and opulence is unmatched. We'll definitely return.", approved: true },
    { id: 2, name: 'Rahul Mehta',   email: 'rahul@example.com',   rating: 5, title: 'Finest dining experience',   body: "The restaurant's Dal Makhani and Butter Chicken are extraordinary. The ambiance is romantic and the service impeccable.", approved: true },
    { id: 3, name: 'Anjali Gupta',  email: 'anjali@example.com',  rating: 4, title: 'Perfect wedding venue',      body: 'We hosted our wedding here and it was dreamy. The staff went above and beyond to make our day special.', approved: true },
  ];
  for (const r of reviews) {
    await prisma.review.upsert({ where: { id: r.id }, update: {}, create: r });
  }
  console.log('✅ Reviews seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log(`\n📧 Admin login: ${process.env.ADMIN_DEFAULT_EMAIL || 'admin@jalsaresort.com'}`);
  console.log(`🔑 Password: ${process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@Jalsa2024'}`);
  console.log('⚠️  Change the admin password immediately after first login!\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
