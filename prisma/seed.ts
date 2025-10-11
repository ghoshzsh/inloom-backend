// prisma/seed.ts
import { PrismaClient, UserRole, OrderStatus, PaymentStatus, ProductStatus, ShippingStatus, AddressType } from '../src/generated/prisma'
import { faker } from '@faker-js/faker'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

// Configuration
const SEED_CONFIG = {
  USERS: 100,
  SELLERS: 20,
  CATEGORIES: 15,
  PRODUCTS_PER_SELLER: 25,
  ORDERS: 200,
  REVIEWS_PERCENTAGE: 0.3, // 30% of orders will have reviews
  CART_ITEMS: 150,
  WISHLIST_ITEMS: 300
}

// Jewelry specific data arrays
const JEWELRY_TYPES = [
  'Ring', 'Necklace', 'Earrings', 'Bracelet', 'Pendant', 'Charm', 'Brooch', 'Anklet', 'Chain', 'Cufflinks'
]

const JEWELRY_MATERIALS = [
  '18K Gold', '14K Gold', '10K Gold', 'White Gold', 'Rose Gold', 'Sterling Silver', 
  'Platinum', 'Titanium', 'Stainless Steel', 'Copper', 'Brass'
]

const GEMSTONES = [
  'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Amethyst', 'Topaz', 'Garnet', 
  'Opal', 'Turquoise', 'Onyx', 'Jade', 'Citrine', 'Peridot', 'Aquamarine'
]

const CLOTHING_TYPES = [
  'T-Shirt', 'Dress', 'Jeans', 'Jacket', 'Sweater', 'Blouse', 'Skirt', 'Pants', 
  'Coat', 'Shorts', 'Cardigan', 'Top', 'Hoodie', 'Blazer', 'Shirt'
]

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const RING_SIZES = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11']
const COLORS = [
  'Black', 'White', 'Silver', 'Gold', 'Rose Gold', 'Blue', 'Red', 'Green', 
  'Purple', 'Pink', 'Brown', 'Gray', 'Navy', 'Beige', 'Cream'
]

// Helper functions
const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
const getRandomElements = <T>(array: T[], count: number): T[] => 
  faker.helpers.arrayElements(array, { min: 1, max: count })

// Generate jewelry product name
const generateJewelryName = (): string => {
  const adjectives = ['Elegant', 'Classic', 'Modern', 'Vintage', 'Luxury', 'Stunning', 'Beautiful', 'Exquisite']
  const type = getRandomElement(JEWELRY_TYPES)
  const material = getRandomElement(JEWELRY_MATERIALS)
  const gemstone = Math.random() > 0.5 ? getRandomElement(GEMSTONES) : null
  
  const parts = [getRandomElement(adjectives), material]
  if (gemstone) parts.push(gemstone)
  parts.push(type)
  
  return parts.join(' ')
}

// Generate clothing product name
const generateClothingName = (): string => {
  const adjectives = ['Casual', 'Formal', 'Trendy', 'Comfortable', 'Stylish', 'Classic', 'Modern', 'Chic']
  const type = getRandomElement(CLOTHING_TYPES)
  const color = getRandomElement(COLORS)
  
  return `${getRandomElement(adjectives)} ${color} ${type}`
}

// Generate product variants for jewelry
const generateJewelryVariants = (productId: string, productName: string, isJewelry: boolean) => {
  const variants = []
  
  if (isJewelry) {
    // Generate size variants for rings
    if (productName.includes('Ring')) {
      const sizes = getRandomElements(RING_SIZES, faker.number.int({ min: 3, max: 6 }))
      sizes.forEach(size => {
        variants.push({
          productId,
          sku: `${faker.string.alphanumeric(8).toUpperCase()}-${size}`,
          name: `Size ${size}`,
          stockQuantity: faker.number.int({ min: 0, max: 20 }),
          attributes: { size }
        })
      })
    } else {
      // For other jewelry, create color/material variants
      const colors = getRandomElements(COLORS, faker.number.int({ min: 2, max: 4 }))
      colors.forEach(color => {
        variants.push({
          productId,
          sku: `${faker.string.alphanumeric(8).toUpperCase()}-${color.replace(/\s+/g, '')}`,
          name: color,
          stockQuantity: faker.number.int({ min: 0, max: 15 }),
          attributes: { color }
        })
      })
    }
  } else {
    // Generate size and color variants for clothing
    const sizes = getRandomElements(CLOTHING_SIZES, faker.number.int({ min: 3, max: 5 }))
    const colors = getRandomElements(COLORS, faker.number.int({ min: 2, max: 3 }))
    
    sizes.forEach(size => {
      colors.forEach(color => {
        variants.push({
          productId,
          sku: `${faker.string.alphanumeric(8).toUpperCase()}-${size}-${color.replace(/\s+/g, '')}`,
          name: `${size} - ${color}`,
          stockQuantity: faker.number.int({ min: 0, max: 25 }),
          attributes: { size, color }
        })
      })
    })
  }
  
  return variants
}

// Generate product attributes for jewelry
const generateJewelryAttributes = () => {
  const attributes = []
  
  // Add random jewelry-specific attributes
  attributes.push(
    { name: 'Metal Type', value: getRandomElement(JEWELRY_MATERIALS) },
    { name: 'Carat Weight', value: `${faker.number.float({ min: 0.1, max: 5, multipleOf: 0.1 })}ct` },
    { name: 'Setting Type', value: getRandomElement(['Prong', 'Bezel', 'Channel', 'Pave']) }
  )
  
  if (Math.random() > 0.5) {
    attributes.push({ name: 'Stone Type', value: getRandomElement(GEMSTONES) })
  }
  
  if (Math.random() > 0.7) {
    attributes.push({ name: 'Chain Length', value: `${faker.number.int({ min: 14, max: 30 })}"` })
  }
  
  return attributes
}

// Generate clothing attributes
const generateClothingAttributes = () => {
  const attributes = []
  
  attributes.push(
    { name: 'Material', value: getRandomElement(['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim']) },
    { name: 'Fit', value: getRandomElement(['Regular', 'Slim', 'Loose', 'Fitted']) },
    { name: 'Care Instructions', value: 'Machine wash cold, tumble dry low' }
  )
  
  if (Math.random() > 0.6) {
    attributes.push({ name: 'Pattern', value: getRandomElement(['Solid', 'Striped', 'Floral', 'Geometric']) })
  }
  
  return attributes
}

async function main() {
  console.log('🌱 Starting database seeding...')
  
  // Hash a default password for all users
  const defaultPassword = await argon2.hash('password123')
  
  // Clear existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.review.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.shipping.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productAttribute.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.sellerProfile.deleteMany()
  await prisma.address.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // Create Categories
  console.log('📂 Creating categories...')
  const categoryData = [
    // Jewelry categories
    { name: 'Rings', slug: 'rings', description: 'Beautiful rings for every occasion', isJewelry: true },
    { name: 'Necklaces', slug: 'necklaces', description: 'Elegant necklaces and pendants', isJewelry: true },
    { name: 'Earrings', slug: 'earrings', description: 'Stunning earrings collection', isJewelry: true },
    { name: 'Bracelets', slug: 'bracelets', description: 'Stylish bracelets and bangles', isJewelry: true },
    { name: 'Watches', slug: 'watches', description: 'Luxury timepieces', isJewelry: true },
    // Clothing categories
    { name: 'Dresses', slug: 'dresses', description: 'Fashionable dresses for women', isJewelry: false },
    { name: 'Tops', slug: 'tops', description: 'Trendy tops and blouses', isJewelry: false },
    { name: 'Bottoms', slug: 'bottoms', description: 'Pants, jeans, and skirts', isJewelry: false },
    { name: 'Outerwear', slug: 'outerwear', description: 'Jackets, coats, and blazers', isJewelry: false },
    { name: 'Activewear', slug: 'activewear', description: 'Sporty and comfortable clothing', isJewelry: false }
  ]

  const categories = []
  for (const cat of categoryData) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: faker.image.url({ width: 400, height: 400 }),
        sortOrder: faker.number.int({ min: 1, max: 10 })
      }
    })
    categories.push({ ...category, isJewelry: cat.isJewelry })
  }

  // Create Users
  console.log('👤 Creating users...')
  const users = []
  for (let i = 0; i < SEED_CONFIG.USERS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: defaultPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        role: i < SEED_CONFIG.SELLERS ? UserRole.SELLER : 
              i < SEED_CONFIG.SELLERS + 3 ? UserRole.ADMIN :
              UserRole.CUSTOMER,
        lastLogin: faker.date.recent({ days: 30 })
      }
    })
    users.push(user)
  }

  // Create Addresses for users
  console.log('🏠 Creating addresses...')
  const addresses = []
  for (const user of users) {
    const numAddresses = faker.number.int({ min: 1, max: 3 })
    for (let i = 0; i < numAddresses; i++) {
      const address = await prisma.address.create({
        data: {
          userId: user.id,
          type: i === 0 ? AddressType.SHIPPING : faker.helpers.arrayElement([AddressType.SHIPPING, AddressType.BILLING]),
          firstName: user.firstName,
          lastName: user.lastName,
          company: faker.helpers.maybe(() => faker.company.name(), { probability: 0.3 }),
          addressLine1: faker.location.streetAddress(),
          addressLine2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
          city: faker.location.city(),
          state: faker.location.state(),
          postalCode: faker.location.zipCode(),
          country: 'US',
          isDefault: i === 0
        }
      })
      addresses.push(address)
    }
  }

  // Create Seller Profiles
  console.log('🏪 Creating seller profiles...')
  const sellers = users.filter(user => user.role === UserRole.SELLER)
  const sellerProfiles = []
  
  for (const seller of sellers) {
    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: seller.id,
        businessName: faker.company.name(),
        businessType: faker.helpers.arrayElement(['individual', 'company', 'partnership']),
        taxId: faker.string.numeric(9),
        description: faker.lorem.paragraphs(2),
        logo: faker.image.url({ width: 200, height: 200 }),
        banner: faker.image.url({ width: 800, height: 300 }),
        phone: faker.phone.number(),
        website: faker.internet.url(),
        isVerified: faker.datatype.boolean({ probability: 0.8 }),
        commissionRate: faker.number.float({ min: 5, max: 15, multipleOf: 0.5 })
      }
    })
    sellerProfiles.push(sellerProfile)
  }

  // Create Products
  console.log('💍👕 Creating products...')
  const products = []
  
  for (const sellerProfile of sellerProfiles) {
    for (let i = 0; i < SEED_CONFIG.PRODUCTS_PER_SELLER; i++) {
      const category = getRandomElement(categories)
      const isJewelry = category.isJewelry
      
      const basePrice = isJewelry ? 
        faker.number.float({ min: 50, max: 5000, multipleOf: 0.01 }) :
        faker.number.float({ min: 20, max: 300, multipleOf: 0.01 })
      
      const productName = isJewelry ? generateJewelryName() : generateClothingName()
      
      const product = await prisma.product.create({
        data: {
          name: productName,
          slug: faker.helpers.slugify(productName).toLowerCase() + '-' + faker.string.alphanumeric(6),
          description: faker.lorem.paragraphs(3),
          shortDescription: faker.lorem.sentence(),
          sku: faker.string.alphanumeric(10).toUpperCase(),
          status: faker.helpers.weightedArrayElement([
            { weight: 0.7, value: ProductStatus.ACTIVE },
            { weight: 0.2, value: ProductStatus.INACTIVE },
            { weight: 0.1, value: ProductStatus.DRAFT }
          ]),
          basePrice,
          salePrice: faker.helpers.maybe(() => 
            faker.number.float({ min: basePrice * 0.7, max: basePrice * 0.9, multipleOf: 0.01 }), 
            { probability: 0.3 }
          ),
          costPrice: faker.number.float({ min: basePrice * 0.4, max: basePrice * 0.6, multipleOf: 0.01 }),
          stockQuantity: faker.number.int({ min: 0, max: 100 }),
          lowStockThreshold: faker.number.int({ min: 5, max: 20 }),
          metaTitle: faker.lorem.sentence(),
          metaDescription: faker.lorem.sentence(),
          sellerId: sellerProfile.id,
          categoryId: category.id
        }
      })
      products.push({ ...product, isJewelry, productName })
    }
  }

  // Create Product Images
  console.log('🖼️ Creating product images...')
  for (const product of products) {
    const numImages = faker.number.int({ min: 2, max: 6 })
    for (let i = 0; i < numImages; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: faker.image.url({ width: 600, height: 600 }),
          altText: `${product.name} - Image ${i + 1}`,
          sortOrder: i,
          isMain: i === 0
        }
      })
    }
  }

  // Create Product Variants
  console.log('🔄 Creating product variants...')
  const allVariants = []
  for (const product of products) {
    if (faker.datatype.boolean({ probability: 0.8 })) { // 80% of products have variants
      const variants = generateJewelryVariants(product.id, product.productName, product.isJewelry)
      
      for (const variantData of variants) {
        const variant = await prisma.productVariant.create({
          data: variantData
        })
        allVariants.push(variant)
      }
    }
  }

  // Create Product Attributes
  console.log('🏷️ Creating product attributes...')
  for (const product of products) {
    const attributes = product.isJewelry ? 
      generateJewelryAttributes() : 
      generateClothingAttributes()
    
    for (const attr of attributes) {
      await prisma.productAttribute.create({
        data: {
          productId: product.id,
          name: attr.name,
          value: attr.value
        }
      })
    }
  }

  // Create Cart Items
  console.log('🛒 Creating cart items...')
  const customers = users.filter(user => user.role === UserRole.CUSTOMER)
  for (let i = 0; i < SEED_CONFIG.CART_ITEMS; i++) {
    const customer = getRandomElement(customers)
    const product = getRandomElement(products.filter(p => p.status === ProductStatus.ACTIVE))
    const variant = faker.helpers.maybe(() => 
      getRandomElement(allVariants.filter(v => v.productId === product.id)),
      { probability: 0.6 }
    )

    try {
      await prisma.cartItem.create({
        data: {
          userId: customer.id,
          productId: product.id,
          variantId: variant?.id,
          quantity: faker.number.int({ min: 1, max: 5 })
        }
      })
    } catch (error) {
      // Skip duplicate cart items
      continue
    }
  }

  // Create Wishlist Items
  console.log('❤️ Creating wishlist items...')
  for (let i = 0; i < SEED_CONFIG.WISHLIST_ITEMS; i++) {
    const customer = getRandomElement(customers)
    const product = getRandomElement(products.filter(p => p.status === ProductStatus.ACTIVE))
    
    try {
      await prisma.wishlistItem.create({
        data: {
          userId: customer.id,
          productId: product.id
        }
      })
    } catch (error) {
      // Skip duplicate wishlist items
      continue
    }
  }

  // Create Orders
  console.log('📦 Creating orders...')
  const orders = []
  for (let i = 0; i < SEED_CONFIG.ORDERS; i++) {
    const customer = getRandomElement(customers)
    const seller = getRandomElement(sellerProfiles)
    const customerAddresses = addresses.filter(addr => addr.userId === customer.id)
    const address = getRandomElement(customerAddresses)
    
    const subtotal = faker.number.float({ min: 50, max: 1000, multipleOf: 0.01 })
    const taxAmount = subtotal * 0.08 // 8% tax
    const shippingAmount = faker.number.float({ min: 0, max: 25, multipleOf: 0.01 })
    const discountAmount = faker.helpers.maybe(() => 
      faker.number.float({ min: 5, max: 50, multipleOf: 0.01 }),
      { probability: 0.2 }
    ) || 0
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${faker.string.numeric(8)}`,
        userId: customer.id,
        sellerId: seller.id,
        addressId: address.id,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount: subtotal + taxAmount + shippingAmount - discountAmount,
        status: faker.helpers.weightedArrayElement([
          { weight: 0.1, value: OrderStatus.PENDING },
          { weight: 0.15, value: OrderStatus.CONFIRMED },
          { weight: 0.2, value: OrderStatus.PROCESSING },
          { weight: 0.25, value: OrderStatus.SHIPPED },
          { weight: 0.25, value: OrderStatus.DELIVERED },
          { weight: 0.05, value: OrderStatus.CANCELLED }
        ]),
        paymentStatus: faker.helpers.weightedArrayElement([
          { weight: 0.8, value: PaymentStatus.PAID },
          { weight: 0.1, value: PaymentStatus.PENDING },
          { weight: 0.1, value: PaymentStatus.FAILED }
        ]),
        shippingStatus: faker.helpers.arrayElement(Object.values(ShippingStatus)),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 })
      }
    })
    orders.push(order)
  }

  // Create Order Items
  console.log('📋 Creating order items...')
  for (const order of orders) {
    const numItems = faker.number.int({ min: 1, max: 5 })
    const sellerProducts = products.filter(p => p.sellerId === order.sellerId && p.status === ProductStatus.ACTIVE)
    
    for (let i = 0; i < numItems; i++) {
      const product = getRandomElement(sellerProducts)
      const variant = faker.helpers.maybe(() => 
        getRandomElement(allVariants.filter(v => v.productId === product.id)),
        { probability: 0.6 }
      )
      const quantity = faker.number.int({ min: 1, max: 3 })
      const unitPrice = product.salePrice || product.basePrice
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          variantId: variant?.id,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          productName: product.name,
          productImage: faker.image.url({ width: 150, height: 150 }),
          variantData: variant ? variant.attributes : null
        }
      })
    }
  }

  // Create Payments
  console.log('💳 Creating payments...')
  for (const order of orders) {
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          status: order.paymentStatus,
          paymentMethod: faker.helpers.arrayElement(['stripe', 'paypal', 'apple_pay', 'google_pay']),
          transactionId: faker.string.alphanumeric(16).toUpperCase()
        }
      })
    }
  }

  // Create Shipping records
  console.log('🚚 Creating shipping records...')
  const shippedOrders = orders.filter(order => 
    [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)
  )
  
  for (const order of shippedOrders) {
    const shippedAt = faker.date.past({ years: 1 })
    const deliveredAt = order.status === OrderStatus.DELIVERED ? 
      faker.date.between({ from: shippedAt, to: new Date() }) : null
    
    await prisma.shipping.create({
      data: {
        orderId: order.id,
        method: faker.helpers.arrayElement(['standard', 'express', 'overnight']),
        carrier: faker.helpers.arrayElement(['UPS', 'FedEx', 'USPS', 'DHL']),
        trackingNumber: faker.string.alphanumeric(12).toUpperCase(),
        status: order.shippingStatus,
        shippedAt,
        deliveredAt
      }
    })
  }

  // Create Reviews
  console.log('⭐ Creating reviews...')
  const deliveredOrders = orders.filter(order => order.status === OrderStatus.DELIVERED)
  const reviewCount = Math.floor(deliveredOrders.length * SEED_CONFIG.REVIEWS_PERCENTAGE)
  
  for (let i = 0; i < reviewCount; i++) {
    const order = getRandomElement(deliveredOrders)
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    })
    
    if (orderItems.length > 0) {
      const orderItem = getRandomElement(orderItems)
      
      try {
        await prisma.review.create({
          data: {
            userId: order.userId,
            productId: orderItem.productId,
            rating: faker.number.int({ min: 1, max: 5 }),
            title: faker.lorem.sentence({ min: 3, max: 8 }),
            comment: faker.lorem.paragraphs(2),
            isVerified: true
          }
        })
      } catch (error) {
        // Skip duplicate reviews (one review per user per product)
        continue
      }
    }
  }

  console.log('✅ Seeding completed successfully!')
  console.log(`
📊 Database seeded with:
- ${users.length} users (${sellers.length} sellers, ${customers.length} customers)
- ${categories.length} categories
- ${products.length} products
- ${allVariants.length} product variants
- ${orders.length} orders
- Cart items and wishlist items
- Reviews for delivered orders
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
