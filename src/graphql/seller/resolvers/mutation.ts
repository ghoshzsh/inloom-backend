import { SellerContext } from '../context';
import { GraphQLError } from 'graphql';

export const Mutation = {
  // Seller Profile
  updateMyProfile: async (_: any, { input }: any, { prisma, sellerProfileId }: SellerContext) => {
    return await prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: input,
    });
  },

  // Product Management
  createProduct: async (_: any, { input }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: input.sku },
    });

    if (existingSku) {
      throw new GraphQLError('SKU already exists', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return await prisma.product.create({
      data: {
        ...input,
        sellerId: sellerProfileId,
        status: input.status || 'DRAFT',
        trackInventory: input.trackInventory ?? true,
        lowStockThreshold: input.lowStockThreshold || 10,
      },
      include: {
        images: true,
        variants: true,
        attributes: true,
        category: true,
      },
    });
  },

  updateProduct: async (_: any, { id, input }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify ownership
    const product = await prisma.product.findUnique({ where: { id } });
    
    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check SKU uniqueness if updating
    if (input.sku && input.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: input.sku },
      });

      if (existingSku) {
        throw new GraphQLError('SKU already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    return await prisma.product.update({
      where: { id },
      data: input,
      include: {
        images: true,
        variants: true,
        attributes: true,
        category: true,
      },
    });
  },

  deleteProduct: async (_: any, { id }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify ownership
    const product = await prisma.product.findUnique({ where: { id } });
    
    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check if product has orders
    const orderItems = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItems > 0) {
      throw new GraphQLError('Cannot delete product with existing orders. Set to inactive instead.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    await prisma.product.delete({ where: { id } });
    return true;
  },

  // Product Images
  addProductImage: async (
    _: any,
    { productId, input }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify product ownership
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // If setting as main, unset other main images
    if (input.isMain) {
      await prisma.productImage.updateMany({
        where: { productId, isMain: true },
        data: { isMain: false },
      });
    }

    return await prisma.productImage.create({
      data: {
        ...input,
        productId,
        sortOrder: input.sortOrder || 0,
        isMain: input.isMain || false,
      },
    });
  },

  updateProductImage: async (_: any, { id, input }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify ownership through product
    const image = await prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!image || image.product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Image not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // If setting as main, unset other main images
    if (input.isMain) {
      await prisma.productImage.updateMany({
        where: { productId: image.productId, isMain: true },
        data: { isMain: false },
      });
    }

    return await prisma.productImage.update({
      where: { id },
      data: input,
    });
  },

  deleteProductImage: async (_: any, { id }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify ownership through product
    const image = await prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!image || image.product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Image not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    await prisma.productImage.delete({ where: { id } });
    return true;
  },

  // Product Variants
  createProductVariant: async (
    _: any,
    { productId, input }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify product ownership
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check SKU uniqueness
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: input.sku },
    });

    if (existingSku) {
      throw new GraphQLError('Variant SKU already exists', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return await prisma.productVariant.create({
      data: {
        ...input,
        productId,
      },
    });
  },

  updateProductVariant: async (
    _: any,
    { id, input }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify ownership through product
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!variant || variant.product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Variant not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check SKU uniqueness if updating
    if (input.sku && input.sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: input.sku },
      });

      if (existingSku) {
        throw new GraphQLError('Variant SKU already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    return await prisma.productVariant.update({
      where: { id },
      data: input,
    });
  },

  deleteProductVariant: async (_: any, { id }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify ownership through product
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!variant || variant.product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Variant not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    await prisma.productVariant.delete({ where: { id } });
    return true;
  },

  // Product Attributes
  addProductAttribute: async (
    _: any,
    { productId, input }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify product ownership
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return await prisma.productAttribute.create({
      data: {
        ...input,
        productId,
      },
    });
  },

  updateProductAttribute: async (
    _: any,
    { id, name, value }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify ownership through product
    const attribute = await prisma.productAttribute.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!attribute || attribute.product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Attribute not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return await prisma.productAttribute.update({
      where: { id },
      data: { name, value },
    });
  },

  deleteProductAttribute: async (_: any, { id }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify ownership through product
    const attribute = await prisma.productAttribute.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!attribute || attribute.product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Attribute not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    await prisma.productAttribute.delete({ where: { id } });
    return true;
  },

  // Inventory Management
  updateStock: async (
    _: any,
    { productId, variantId, quantity }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify product ownership
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (variantId) {
      // Update variant stock
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: quantity },
      });
    } else {
      // Update product stock
      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: quantity },
      });
    }

    return await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        variants: true,
        attributes: true,
        category: true,
      },
    });
  },

  bulkUpdateStock: async (_: any, { updates }: any, { prisma, sellerProfileId }: SellerContext) => {
    const results = [];

    for (const update of updates) {
      // Verify ownership
      const product = await prisma.product.findUnique({ where: { id: update.productId } });
      
      if (!product || product.sellerId !== sellerProfileId) {
        continue; // Skip unauthorized products
      }

      if (update.variantId) {
        await prisma.productVariant.update({
          where: { id: update.variantId },
          data: { stockQuantity: update.quantity },
        });
      } else {
        await prisma.product.update({
          where: { id: update.productId },
          data: { stockQuantity: update.quantity },
        });
      }

      const updatedProduct = await prisma.product.findUnique({
        where: { id: update.productId },
        include: {
          images: true,
          variants: true,
          attributes: true,
          category: true,
        },
      });

      if (updatedProduct) results.push(updatedProduct);
    }

    return results;
  },

  // Order Management
  updateOrderStatus: async (
    _: any,
    { input }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    // Verify order ownership
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order || order.sellerId !== sellerProfileId) {
      throw new GraphQLError('Order not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return await prisma.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
        shipping: true,
        payments: true,
      },
    });
  },

  updateShipping: async (_: any, { input }: any, { prisma, sellerProfileId }: SellerContext) => {
    // Verify order ownership
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order || order.sellerId !== sellerProfileId) {
      throw new GraphQLError('Order not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Get or create shipping record
    const existingShipping = await prisma.shipping.findUnique({
      where: { orderId: input.orderId },
    });

    if (existingShipping) {
      return await prisma.shipping.update({
        where: { orderId: input.orderId },
        data: {
          method: input.method,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          status: input.status,
          shippedAt: input.status === 'PICKED_UP' ? new Date() : undefined,
          deliveredAt: input.status === 'DELIVERED' ? new Date() : undefined,
        },
      });
    } else {
      return await prisma.shipping.create({
        data: {
          orderId: input.orderId,
          method: input.method || 'standard',
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          status: input.status || 'PENDING',
          shippedAt: input.status === 'PICKED_UP' ? new Date() : undefined,
        },
      });
    }
  },
};
