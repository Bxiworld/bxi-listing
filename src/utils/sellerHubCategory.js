const normalize = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim();

// Category-specific subcategory labels from the listing taxonomy. Labels shared
// by multiple categories are intentionally left unresolved; those use ProductType.
const CATEGORY_SUBCATEGORIES = {
  Textile: `Accessories|Bathrobes|Bed linens|Bedsheet|Blankets|Bodysuits|Clothing Sets|Curtains|Cushion Covers|Draperies|Dresses|Dungarees|Ethnic Wear|Fabric|Handkerchiefs|Innerwear|Jeans|Lingerie|Lounge Wear|Maternity|Medical Bed Linens|Overalls|Pants|Pillow Cases|Polos|Quilts|Rugs|Shirts|Shorts|Skirts & Shorts|Sleep|Sleep & Lounge Wear|Sleepwear|Sportswear|Suits & Blazzers|Surgical Gowns|Swim & Beachwear|Swimwear|T-Shirts|T-Shirts & Polos|Table cloths|Table covers|Towels|Trackpants & Joggers|Trousers|Unstitched Fabric|Western Wear|Winter Wear`,
  Electronics: `AIR CONDITIONERS|AIR COOLERS|ALL SMART HOME DEVICES|BATTERIES, CHARGERS & ADAPTERS|BEVERAGE MAKERS|CAMERA & ACCESSORIES|COMPOST MAKERS & FOOD WASTE DISPOSERS|COMPUTER AND LAPTOP ACCESSORIES|COMPUTER CABLES & CONNECTORS|COMPUTER PERIPHERALS|COMPUTER RADIATION PROTECTION CHIPS|COMPUTER SOFTWARE|COMPUTERS & TABLETS|COOKING APPLIANCES|DISHWASHERS|ELECTRIC CHIMNEYS|ELECTRICAL EQUIPMENT|FANS|FLOUR MILL MACHINES|GAMING|GARMENT CARE|GEYSERS|HEADPHONES & EARPHONES|HOME SAFETY SECURITY|HOME THEATRE SYSTEMS|KITCHEN APPLIANCES|KITCHEN UTILITIES|LAPTOP SCREEN PROTECTORS|LAPTOP WEBCAMS & MICS|LAPTOPS|LIGHTING PRODUCTS|MEDIA PLAYERS|MEDIA STREAMING DEVICES|MICROWAVES & OVEN|MOBILE ACCESSORIES|MOUSE|MUSICAL INSTRUMENTS|NETWORK COMPONENTS|OTHER KITCHEN ACCESSORIES|PHONES AND WEARABLES|PRINTERS|PROJECTORS|RADIATION PROTECTORS|REFRIGATOR & FREEZERS|ROOM HEATERS|SCREEN PROTECTORS|SEWING MACHINE|SPEAKERS|STORAGE DEVICES|STOVE & COOKTOPS|TABLETS & EREADERS|TELEPHONES|TELEVISIONS & ACCESSORIES|TOASTERS & SANDWICH MAKERS|VACUUM CLEANERS|WALKIE TALKIES|WASHING MACHINE & DRYERS|WATER PURIFIERS & DISPENSERS`,
  FMCG: `Bakery Products|Beverages|Cereals and Grains|Condiments and Sauces|Dairy Products|Fruits and Vegetables|Meat and Poultry|Snacks|Sweets and Confectionery`,
  'Office Supply': `Air Fresheners|Binders & Accessories|Boards & Easels|Calendars & Planners|Cash Handling|Cleaners & Disinfectants|Desk Organizers|Envelopes & Forms|Filing Supplies|Floor Cleaning Tools|General Office Supplies|Ink & Toner|Labels & Labelling Systems|Mailing & Shipping|Notebooks,Pads & Filler Paper|Office Machines|Paper|Poster & Foam Boards|Register & Calculator Rolls|Storage & Organizers|Trash Bags & Cans|Writing & Correction`,
  Lifestyle: `Appliances|Baby Care|Backpacks|Bakeware & Cookware|Bar & Drinkware|Beauty Care|Beauty Gift & Makeup Set|Belts, Scarves & More|Cups and Mugs|Dinnerware & Serveware|Fashion Accessories|Footwear|Fragrances|Gadgets|Haircare|Handbags, Bags & Wallets|Home & Bath|Jewellery|Kitchen Storage & Tools|Luggages & Trolleys|Makeup|Masks|Men's Grooming|Personal Care|Personal Care & Grooming|Premium Beauty|Skincare, Bath & Body|Sports & Active Wear|Sunglasses & Frames|Table Runners|Toys|Watches|Watches & Wearables|Wellness & Hygiene`,
  Mobility: `All cars and Motorbike Products|Bike & Bicycle|Car & Motorbike|Car Accessories|Car Electronics|Car Parts|Car and Bike Care|Electric Bike|Electric Car|Moped|Motorbike Accessories and Parts|Scooter`,
  QSR: `Bakery|Barbeque|Breakfast/Brunch|Brewpub|Cafés/Coffee Shops|Dinner|Ethnic Cuisine|Fast Food|Fine Dining|Food Court|Food Stand|Food Truck Park|Food Trucks|Gourmet|Health Food|Ice Cream Parlors|Juice Bar|Meal Box|Noodle Bar|Pizzeria|Sandwich Shop|Steakhouse|Sushi|Tapas|Vegetarian/Vegan`,
  Hotel: `Airport Hotels|All Meals Plan|Ballroom|Bed and Breakfast (B&B)|Business Hotels|CP|Cafe|Casino Hotels|Club Membership|Conference Room|Dining|Experience|Food & Beverages|Luxury Hotels|MAP|Massage|One Day Visit|Package|Rejuvenate|Resorts|Restaurant|Room Night|Self Catering Hotels|Service Apartments|Services|Spa|Suite Hotels|Villa Property`,
  'Entertainment & Events': `Art Exhibitions|Comedy Shows|Concerts|Conferences and Expos|Family Entertainment|Festivals|Film and Theater|Music Events|Nightlife and Clubs|Performing Arts|Sports Events`,
  Media: `Activation Space|Airport Bus Wrap|Auto Wrap|Boarding Pass|Bus Shelters|Bus Wrap|CCD ads|Cab Wrap|Contest|Corporate Park Screens|Digital|Easel Standee|Electricity bills|Elevator/Lift|Entertainment|Escalator|FM Jingle Announcements|Flyers|Gym digital Screens|In app Advertisement|Influencer Marketing|LED OOH|LED Pillar|Magazines|Mall Digital Media|Mall Hoardings|Metro Station|Metro Wrap|Metro annoucement|Mobile Van|News|Newspaper|OOH|Offscreen|On Screen|Podcast|Pole Kiosks|R J Mentions|Railway Station Boards|Railway local train announcement|Residential Screen|Roadblock ads|Scala TV|Sports|Standee|Static|Train Wrap|Wall Branding|airport|dooh|flight wrap|hoarding|multiplex|offlinebtl|print|radio|television`,
};

const categoryOwners = new Map();
Object.entries(CATEGORY_SUBCATEGORIES).forEach(([category, labels]) => {
  labels.split('|').forEach((label) => {
    const key = normalize(label);
    if (!key) return;
    const owners = categoryOwners.get(key) || new Set();
    owners.add(category);
    categoryOwners.set(key, owners);
  });
});

const UNIQUE_SUBCATEGORY_CATEGORIES = new Map(
  [...categoryOwners.entries()]
    .filter(([, owners]) => owners.size === 1)
    .map(([label, owners]) => [label, [...owners][0]])
);

export function getSellerHubCategoryFromSubcategory(subcategoryName) {
  return UNIQUE_SUBCATEGORY_CATEGORIES.get(normalize(subcategoryName)) || '';
}
