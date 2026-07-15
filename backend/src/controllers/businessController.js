/**
 * Business Controller — Profile & Brand management for business owners
 */
const db = require('../db/connection');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * GET /api/business/profile
 */
const getProfile = catchAsync(async (req, res) => {
  // req.business is attached by requireBusinessOwnership middleware
  const business = req.business;

  const outletCount = await db('outlets').where({ business_id: business.id }).count('id as count').first();
  const plan = business.subscription_plan;

  res.json({
    status: 'success',
    data: {
      business,
      outletCount: outletCount.count,
      plan,
    },
  });
});

/**
 * PUT /api/business/profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const { 
    name, description, brandColour, address, city, cuisineType,
    instagramUrl, googleMapsUrl, confirmationMessage, requireDeposit, depositAmount, allowWaitlist,
    ownerName, ownerEmail, ownerPhone
  } = req.body;
  const business = req.business;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (brandColour !== undefined) updates.brand_colour = brandColour;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (cuisineType !== undefined) updates.cuisine_type = cuisineType;
  if (ownerName !== undefined) updates.owner_name = ownerName;
  if (ownerEmail !== undefined) updates.owner_email = ownerEmail;
  if (ownerPhone !== undefined) updates.owner_phone = ownerPhone;
  if (instagramUrl !== undefined) updates.instagram_url = instagramUrl;
  if (googleMapsUrl !== undefined) updates.google_maps_url = googleMapsUrl;
  if (confirmationMessage !== undefined) updates.confirmation_message = confirmationMessage;
  if (requireDeposit !== undefined) updates.require_deposit = requireDeposit;
  if (depositAmount !== undefined) updates.deposit_amount = depositAmount;
  if (allowWaitlist !== undefined) updates.allow_waitlist = allowWaitlist;

  await db('businesses').where({ id: business.id }).update(updates);

  const updated = await db('businesses').where({ id: business.id }).first();

  res.json({
    status: 'success',
    message: 'Business profile updated.',
    data: { business: updated },
  });
});

/**
 * PUT /api/business/onboarding/brand
 * Specifically for Step 1 of Onboarding (Mock uploads included)
 */
const updateBrandSetup = catchAsync(async (req, res) => {
  const { brandColour, description, logoUrl, coverImageUrl } = req.body;
  const business = req.business;

  const updates = {};
  if (brandColour !== undefined) updates.brand_colour = brandColour;
  if (description !== undefined) updates.description = description;
  
  // Using Mock URLs if provided directly from frontend for this assignment
  if (logoUrl !== undefined) updates.logo_url = logoUrl;
  if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl;

  await db('businesses').where({ id: business.id }).update(updates);

  res.json({
    status: 'success',
    message: 'Brand setup complete.',
    data: { 
      brandColour: updates.brand_colour, 
      logoUrl: updates.logo_url, 
      coverImageUrl: updates.cover_image_url, 
      description: updates.description 
    }
  });
});

module.exports = { getProfile, updateProfile, updateBrandSetup };
