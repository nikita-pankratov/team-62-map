// Google Places API supported place types organized by category
// Based on Google Maps Platform Place Types documentation

export interface BusinessCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  categories: BusinessCategory[];
}

// Quick link categories - most popular ones
export const QUICK_LINK_CATEGORIES: BusinessCategory[] = [
  { id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
  { id: 'gas_station', name: 'Gas Stations', icon: '⛽' },
  { id: 'hospital', name: 'Hospitals', icon: '🏥' },
  { id: 'pharmacy', name: 'Pharmacies', icon: '💊' },
  { id: 'bank', name: 'Banks', icon: '🏦' },
  { id: 'grocery_or_supermarket', name: 'Grocery Stores', icon: '🛒' },
  { id: 'cafe', name: 'Coffee Shops', icon: '☕' },
  { id: 'gym', name: 'Gyms', icon: '💪' },
  { id: 'hair_care', name: 'Hair Salons', icon: '💇' },
  { id: 'shopping_mall', name: 'Shopping', icon: '🛍️' }
];

// Comprehensive categories organized by industry
export const BUSINESS_CATEGORIES: CategoryGroup[] = [
  {
    id: 'food_dining',
    name: 'Food & Dining',
    categories: [
      { id: 'restaurant', name: 'Restaurant' },
      { id: 'cafe', name: 'Cafe' },
      { id: 'bar', name: 'Bar' },
      { id: 'meal_takeaway', name: 'Takeaway' },
      { id: 'meal_delivery', name: 'Meal Delivery' },
      { id: 'bakery', name: 'Bakery' },
      { id: 'food', name: 'Food Store' },
      { id: 'liquor_store', name: 'Liquor Store' },
      { id: 'night_club', name: 'Night Club' }
    ]
  },
  {
    id: 'health_medical',
    name: 'Health & Medical',
    categories: [
      { id: 'hospital', name: 'Hospital' },
      { id: 'doctor', name: 'Doctor' },
      { id: 'dentist', name: 'Dentist' },
      { id: 'pharmacy', name: 'Pharmacy' },
      { id: 'veterinary_care', name: 'Veterinary Care' },
      { id: 'physiotherapist', name: 'Physiotherapist' },
      { id: 'health', name: 'Health Services' }
    ]
  },
  {
    id: 'automotive',
    name: 'Automotive',
    categories: [
      { id: 'gas_station', name: 'Gas Station' },
      { id: 'car_repair', name: 'Car Repair' },
      { id: 'car_dealer', name: 'Car Dealer' },
      { id: 'car_rental', name: 'Car Rental' },
      { id: 'car_wash', name: 'Car Wash' },
      { id: 'parking', name: 'Parking' }
    ]
  },
  {
    id: 'shopping_retail',
    name: 'Shopping & Retail',
    categories: [
      { id: 'shopping_mall', name: 'Shopping Mall' },
      { id: 'grocery_or_supermarket', name: 'Grocery Store' },
      { id: 'clothing_store', name: 'Clothing Store' },
      { id: 'electronics_store', name: 'Electronics Store' },
      { id: 'furniture_store', name: 'Furniture Store' },
      { id: 'home_goods_store', name: 'Home Goods Store' },
      { id: 'jewelry_store', name: 'Jewelry Store' },
      { id: 'shoe_store', name: 'Shoe Store' },
      { id: 'book_store', name: 'Book Store' },
      { id: 'florist', name: 'Florist' },
      { id: 'hardware_store', name: 'Hardware Store' },
      { id: 'pet_store', name: 'Pet Store' },
      { id: 'bicycle_store', name: 'Bicycle Store' },
      { id: 'department_store', name: 'Department Store' },
      { id: 'store', name: 'General Store' }
    ]
  },
  {
    id: 'finance_legal',
    name: 'Finance & Legal',
    categories: [
      { id: 'bank', name: 'Bank' },
      { id: 'atm', name: 'ATM' },
      { id: 'accounting', name: 'Accounting' },
      { id: 'insurance_agency', name: 'Insurance Agency' },
      { id: 'lawyer', name: 'Lawyer' },
      { id: 'finance', name: 'Financial Services' }
    ]
  },
  {
    id: 'beauty_wellness',
    name: 'Beauty & Wellness',
    categories: [
      { id: 'hair_care', name: 'Hair Care' },
      { id: 'beauty_salon', name: 'Beauty Salon' },
      { id: 'spa', name: 'Spa' },
      { id: 'gym', name: 'Gym' },
      { id: 'health', name: 'Wellness Center' }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    categories: [
      { id: 'movie_theater', name: 'Movie Theater' },
      { id: 'amusement_park', name: 'Amusement Park' },
      { id: 'aquarium', name: 'Aquarium' },
      { id: 'art_gallery', name: 'Art Gallery' },
      { id: 'casino', name: 'Casino' },
      { id: 'bowling_alley', name: 'Bowling Alley' },
      { id: 'zoo', name: 'Zoo' },
      { id: 'museum', name: 'Museum' },
      { id: 'tourist_attraction', name: 'Tourist Attraction' }
    ]
  },
  {
    id: 'lodging_travel',
    name: 'Lodging & Travel',
    categories: [
      { id: 'lodging', name: 'Hotel' },
      { id: 'travel_agency', name: 'Travel Agency' },
      { id: 'campground', name: 'Campground' },
      { id: 'rv_park', name: 'RV Park' }
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    categories: [
      { id: 'airport', name: 'Airport' },
      { id: 'subway_station', name: 'Subway Station' },
      { id: 'train_station', name: 'Train Station' },
      { id: 'bus_station', name: 'Bus Station' },
      { id: 'taxi_stand', name: 'Taxi Stand' },
      { id: 'transit_station', name: 'Transit Station' }
    ]
  },
  {
    id: 'education_government',
    name: 'Education & Government',
    categories: [
      { id: 'school', name: 'School' },
      { id: 'university', name: 'University' },
      { id: 'library', name: 'Library' },
      { id: 'courthouse', name: 'Courthouse' },
      { id: 'city_hall', name: 'City Hall' },
      { id: 'police', name: 'Police Station' },
      { id: 'fire_station', name: 'Fire Station' },
      { id: 'post_office', name: 'Post Office' }
    ]
  },
  {
    id: 'religious',
    name: 'Religious',
    categories: [
      { id: 'church', name: 'Church' },
      { id: 'mosque', name: 'Mosque' },
      { id: 'synagogue', name: 'Synagogue' },
      { id: 'hindu_temple', name: 'Hindu Temple' },
      { id: 'place_of_worship', name: 'Place of Worship' },
      { id: 'cemetery', name: 'Cemetery' }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    categories: [
      { id: 'real_estate_agency', name: 'Real Estate Agency' },
      { id: 'moving_company', name: 'Moving Company' },
      { id: 'storage', name: 'Storage' },
      { id: 'laundry', name: 'Laundry' },
      { id: 'locksmith', name: 'Locksmith' },
      { id: 'electrician', name: 'Electrician' },
      { id: 'plumber', name: 'Plumber' },
      { id: 'painter', name: 'Painter' },
      { id: 'roofing_contractor', name: 'Roofing Contractor' },
      { id: 'general_contractor', name: 'General Contractor' }
    ]
  }
];

// Flatten all categories for easy searching
export const ALL_CATEGORIES: BusinessCategory[] = BUSINESS_CATEGORIES.flatMap(group => group.categories);

// Search function for categories
export const searchCategories = (query: string): BusinessCategory[] => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  return ALL_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(lowerQuery) ||
    category.id.toLowerCase().includes(lowerQuery)
  );
};

// Get category by ID
export const getCategoryById = (id: string): BusinessCategory | undefined => {
  return ALL_CATEGORIES.find(category => category.id === id);
};

// Get category group by category ID
export const getCategoryGroup = (categoryId: string): CategoryGroup | undefined => {
  return BUSINESS_CATEGORIES.find(group => 
    group.categories.some(category => category.id === categoryId)
  );
};

// Legacy mapping for backward compatibility with existing search terms
export const mapBusinessTypeToPlacesType = (businessType: string): string => {
  const normalizedType = businessType.toLowerCase().trim();
  
  // First check if it's already a valid category ID
  const directMatch = ALL_CATEGORIES.find(cat => cat.id === normalizedType);
  if (directMatch) return directMatch.id;
  
  // Legacy mappings for common search terms
  const legacyMapping: Record<string, string> = {
    // Pet services
    'pet services': 'veterinary_care',
    'pet service': 'veterinary_care', 
    'veterinary': 'veterinary_care',
    'vet': 'veterinary_care',
    'animal hospital': 'veterinary_care',
    'pet hospital': 'veterinary_care',
    'pet shop': 'pet_store',
    'pet grooming': 'pet_store',
    'dog grooming': 'pet_store',
    
    // Food & dining
    'restaurants': 'restaurant',
    'food': 'restaurant',
    'dining': 'restaurant',
    'coffee': 'cafe',
    'coffee shop': 'cafe',
    
    // Health & medical
    'medical': 'hospital',
    'clinic': 'hospital',
    
    // Automotive
    'gas': 'gas_station',
    'fuel': 'gas_station',
    'auto repair': 'car_repair',
    
    // Shopping
    'grocery': 'grocery_or_supermarket',
    'supermarket': 'grocery_or_supermarket',
    'shopping': 'shopping_mall',
    
    // Finance
    'banks': 'bank',
    
    // Beauty & personal care
    'hair salon': 'hair_care',
    'salon': 'hair_care',
    
    // Entertainment
    'movie theater': 'movie_theater',
    'cinema': 'movie_theater',
    'nightclub': 'night_club',
    
    // Transportation
    'subway': 'subway_station',
    'train station': 'train_station',
    'bus station': 'bus_station'
  };
  
  // Check for exact matches first
  if (legacyMapping[normalizedType]) {
    return legacyMapping[normalizedType];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(legacyMapping)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value;
    }
  }
  
  // Check if the normalized type matches any category name
  const nameMatch = ALL_CATEGORIES.find(cat => 
    cat.name.toLowerCase() === normalizedType ||
    cat.name.toLowerCase().includes(normalizedType)
  );
  if (nameMatch) return nameMatch.id;
  
  // Fallback: convert spaces to underscores and return as-is
  return normalizedType.replace(/\s+/g, '_');
};
