import { GrandPrixEvent, TicketType, Concert, PremiumPackage, DiscountCode, Order, EmailJob, AuditLog } from '../types';

export const INITIAL_EVENTS: GrandPrixEvent[] = [
  {
    id: 'abu-dhabi-gp-2026',
    slug: 'abu-dhabi-grand-prix-2026',
    name: 'Formula 1 Etihad Airways Abu Dhabi Grand Prix 2026',
    officialTitle: 'FORMULA 1 ETIHAD AIRWAYS ABU DHABI GRAND PRIX 2026',
    circuit: 'Yas Marina Circuit',
    location: 'Yas Island, Abu Dhabi',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    dates: 'December 04 – 06, 2026',
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    round: 24,
    season: 2026,
    timezone: 'GST (UTC+4)',
    banner: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
    description: 'The spectacular twilight Formula 1 season finale! Watch the championship climax under the desert sunset as daylight transitions seamlessly to over 4,700 floodlights illuminating the marina, superyachts, and the iconic W Abu Dhabi hotel. Every 3-day ticket includes complimentary access to the world-renowned Yasalam After-Race Concerts at Etihad Park and free admission to Yas Island theme parks (Ferrari World, Warner Bros. World, SeaWorld, and Yas Waterworld).',
    status: 'published',
    startingPrice: 260,
    featured: true,
    lapDistance: '5.281 km',
    numberOfLaps: 58,
    raceDistance: '306.183 km',
    lapRecord: {
      time: '1:26.103',
      driver: 'Max Verstappen',
      year: 2021,
    },
    schedule: [
      {
        day: 'Thursday',
        date: 'December 03, 2026',
        sessions: [
          { name: 'F1 Fan Zone & Circuit Gates Open', time: '12:00 - 22:00', type: 'practice' },
          { name: 'Public Pit Lane Walk (3-Day Ticket Holders)', time: '14:30 - 18:00', type: 'practice' },
          { name: 'Yasalam After-Race Concert: Opening Night (Etihad Park)', time: '20:30 - 23:30', type: 'practice' }
        ]
      },
      {
        day: 'Friday',
        date: 'December 04, 2026',
        sessions: [
          { name: 'Free Practice 1 (Daylight)', time: '13:30 - 14:30', type: 'practice' },
          { name: 'F2 Qualifying Session', time: '15:30 - 16:00', type: 'qualifying' },
          { name: 'Free Practice 2 (Twilight into Floodlights)', time: '17:00 - 18:00', type: 'practice' },
          { name: 'Yasalam After-Race Concert: Friday Headliner (Etihad Park)', time: '21:00 - 23:45', type: 'practice' }
        ]
      },
      {
        day: 'Saturday',
        date: 'December 05, 2026',
        sessions: [
          { name: 'Free Practice 3', time: '14:30 - 15:30', type: 'practice' },
          { name: 'F2 Sprint Race', time: '16:20 - 17:10', type: 'sprint' },
          { name: 'Qualifying Shootout (Night Race under Floodlights)', time: '18:00 - 19:00', type: 'qualifying' },
          { name: 'Yasalam After-Race Concert: Saturday Megastars (Etihad Park)', time: '21:00 - 23:45', type: 'practice' }
        ]
      },
      {
        day: 'Sunday',
        date: 'December 06, 2026',
        sessions: [
          { name: 'F2 Feature Race', time: '13:15 - 14:20', type: 'race' },
          { name: 'Formula 1 Drivers Track Parade', time: '15:00 - 15:30', type: 'practice' },
          { name: 'National Anthem & Air Display', time: '16:45 - 16:55', type: 'practice' },
          { name: 'Formula 1 Abu Dhabi Grand Prix (58 Laps Finale)', time: '17:00 - 19:00', type: 'race' },
          { name: 'Podium Ceremony & Sky Fireworks Spectacular', time: '19:00 - 19:30', type: 'race' },
          { name: 'Yasalam Finale After-Race Concert (Etihad Park)', time: '21:00 - 23:45', type: 'practice' }
        ]
      }
    ]
  },
  {
    id: 'hungarian-gp-2026',
    slug: 'hungarian-grand-prix-2026',
    name: 'Formula 1 Hungarian Grand Prix 2026',
    officialTitle: 'FORMULA 1 MAGYAR NAGYDÍJ 2026',
    circuit: 'Hungaroring',
    location: 'Budapest',
    country: 'Hungary',
    countryCode: 'HU',
    flag: '🇭🇺',
    dates: 'July 24 – 26, 2026',
    startDate: '2026-07-24',
    endDate: '2026-07-26',
    round: 13,
    season: 2026,
    timezone: 'CEST (UTC+2)',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80',
    description: 'Experience summer racing outside Budapest with historic tight corners and vibrant trackside nightlife.',
    status: 'published',
    startingPrice: 145,
    featured: false,
    lapDistance: '4.381 km',
    numberOfLaps: 70,
    raceDistance: '306.630 km',
    lapRecord: { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 },
    schedule: [
      {
        day: 'Sunday',
        date: 'July 26, 2026',
        sessions: [{ name: 'Hungarian Grand Prix', time: '15:00 - 17:00', type: 'race' }]
      }
    ]
  },
  {
    id: 'monaco-gp-2026',
    slug: 'monaco-grand-prix-2026',
    name: 'Formula 1 Grand Prix de Monaco 2026',
    officialTitle: 'FORMULA 1 GRAND PRIX DE MONACO 2026',
    circuit: 'Circuit de Monaco',
    location: 'Monte Carlo',
    country: 'Monaco',
    countryCode: 'MC',
    flag: '🇲🇨',
    dates: 'May 21 – 24, 2026',
    startDate: '2026-05-21',
    endDate: '2026-05-24',
    round: 8,
    season: 2026,
    timezone: 'CEST (UTC+2)',
    banner: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
    description: 'The historic street circuit of the Principality of Monaco.',
    status: 'published',
    startingPrice: 380,
    featured: false,
    lapDistance: '3.337 km',
    numberOfLaps: 78,
    raceDistance: '260.286 km',
    lapRecord: { time: '1:12.909', driver: 'Lewis Hamilton', year: 2021 },
    schedule: [
      {
        day: 'Sunday',
        date: 'May 24, 2026',
        sessions: [{ name: 'Grand Prix de Monaco', time: '15:00 - 17:00', type: 'race' }]
      }
    ]
  }
];

export const INITIAL_TICKETS: TicketType[] = [
  // 1. Main Grandstand (Start/Finish Straight)
  {
    id: 't-abu-main-wknd',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Weekend Pass',
    name: 'Main Grandstand (Covered)',
    section: 'Start/Finish Straight · Opposite F1 Team Garages',
    description: 'The prime vantage point at Yas Marina Circuit. Direct frontal view of the starting grid, team pit boxes, high-speed start/finish straight, and the official championship trophy podium celebration. Premium covered shading with giant LED video screens opposite.',
    price: 590,
    originalPrice: 650,
    fee: 35,
    capacity: 4500,
    availableQuantity: 142,
    features: [
      '3-Day admission (Fri, Sat & Sun)',
      'Direct view of start/finish grid & podium',
      'Overlooking team pit garages & pit stops',
      'Numbered allocated covered seating',
      'Access to Thursday Public Pit Lane Walk',
      'Includes access to all 4 Yasalam After-Race Concerts',
      'Complimentary Yas Island theme park access'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 6
  },

  // 2. North Grandstand (Turn 5 Hairpin)
  {
    id: 't-abu-north-wknd',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Weekend Pass',
    name: 'North Grandstand (Covered)',
    section: 'Turn 5 Hairpin & Long Straight Entrance',
    description: 'Situated at the famous Turn 5 hairpin leading onto the longest straight in Formula 1. Watch heavy braking, downshifts, and acceleration with the striking backdrop of Ferrari World Abu Dhabi.',
    price: 480,
    originalPrice: 530,
    fee: 30,
    capacity: 5200,
    availableQuantity: 88,
    features: [
      '3-Day admission (Fri, Sat & Sun)',
      'Panoramic Turn 5 hairpin overtaking view',
      'Overlooks entrance to 1.2km main straight',
      'Covered shaded seating with big screens',
      'Access to all 4 Yasalam After-Race Concerts',
      'Free Yas Island theme park passes included'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 6
  },

  // 3. West Grandstand (End of 1.2km Straight)
  {
    id: 't-abu-west-wknd',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Weekend Pass',
    name: 'West Grandstand (Covered)',
    section: 'Turn 6 & 7 Heavy Braking Chicane',
    description: 'Positioned at the end of the 1.2km longest straight where F1 cars brake fiercely from 335 km/h into Turn 6. This is Yas Marina’s primary overtaking zone and run-off area with intense wheel-to-wheel action.',
    price: 510,
    fee: 32,
    capacity: 4800,
    availableQuantity: 64,
    features: [
      '3-Day admission (Fri, Sat & Sun)',
      'Prime overtaking and out-braking action zone',
      'Close view of chicane and Turn 8 acceleration',
      'Direct walking distance to F1 Fanzone',
      'Access to all 4 Yasalam After-Race Concerts',
      'Includes Yas Island theme park access'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'low_inventory',
    maxPerOrder: 6
  },

  // 4. Marina Grandstand (Above Superyacht Marina)
  {
    id: 't-abu-marina-wknd',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Weekend Pass',
    name: 'Marina Grandstand (Covered)',
    section: 'Turns 9 & 10 · Overlooking Yas Marina Superyachts',
    description: 'Perched directly above the support pit lane and Turns 9 & 10, overlooking illuminated multi-million dollar luxury yachts moored in Yas Marina. Features the iconic night atmosphere as darkness falls over the harbor.',
    price: 530,
    originalPrice: 580,
    fee: 35,
    capacity: 3900,
    availableQuantity: 42,
    features: [
      '3-Day admission (Fri, Sat & Sun)',
      'Spectacular views over Yas Marina & yachts',
      'Overlooks support pits and marina chicane',
      'Direct proximity to Yas Marina promenade dining',
      'Access to all 4 Yasalam After-Race Concerts',
      'Includes Yas Island theme park pass'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'low_inventory',
    maxPerOrder: 6
  },

  // 5. South Grandstand (Beneath W Hotel)
  {
    id: 't-abu-south-wknd',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Weekend Pass',
    name: 'South Grandstand (Covered)',
    section: 'Turns 11 to 14 · W Abu Dhabi Hotel Facade',
    description: 'Wraps around the marina basin, right beneath the glowing color-changing LED canopy of the W Abu Dhabi hotel. Watch cars negotiate technical turns before blasting into the hotel underpass.',
    price: 470,
    fee: 30,
    capacity: 4200,
    availableQuantity: 95,
    features: [
      '3-Day admission (Fri, Sat & Sun)',
      'Views of Turns 11, 12, 13 and hotel bridge',
      'Stunning nighttime light reflections on water',
      'Access to all 4 Yasalam After-Race Concerts',
      'Includes Yas Island theme park pass'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 8
  },

  // 6. Abu Dhabi Hill (General Admission 3-Day)
  {
    id: 't-abu-hill-wknd',
    eventId: 'abu-dhabi-gp-2026',
    category: 'general_admission',
    raceDay: 'Weekend Pass',
    name: 'Abu Dhabi Hill (3-Day Pass)',
    section: 'Open Grass Banking Opposite North Grandstand',
    description: 'A popular open-air grassy viewing hill with elevated panoramic views from Turn 2 through Turn 5. Enjoy the festive trackside atmosphere, roaming food trucks, and big screens.',
    price: 260,
    fee: 20,
    capacity: 10000,
    availableQuantity: 1120,
    features: [
      '3-Day access (Fri, Sat & Sun)',
      'Open grassy viewing mounds with picnic freedom',
      'Large video screens and audio commentary',
      'Access to all 4 Yasalam After-Race Concerts',
      'Access to F1 Fanzone entertainment'
    ],
    isAssignedSeating: false,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 10
  },

  // 7. Abu Dhabi Hill (Sunday Race Day Only)
  {
    id: 't-abu-hill-sun',
    eventId: 'abu-dhabi-gp-2026',
    category: 'general_admission',
    raceDay: 'Sunday',
    name: 'Abu Dhabi Hill (Sunday Twilight Finale)',
    section: 'Open Grass Viewing Banking',
    description: 'Single-day entry for the dramatic Sunday season finale under the floodlights. Includes the finale after-race concert at Etihad Park.',
    price: 195,
    fee: 15,
    capacity: 6000,
    availableQuantity: 430,
    features: [
      'Sunday full day race admission',
      'Formula 1 championship finale (58 Laps)',
      'Post-race fireworks show viewing',
      'Entry to Sunday night Yasalam concert at Etihad Park'
    ],
    isAssignedSeating: false,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 8
  },

  // 8. Main Grandstand (Sunday Only)
  {
    id: 't-abu-main-sun',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Sunday',
    name: 'Main Grandstand (Sunday Race Day)',
    section: 'Start/Finish Straight · Numbered Covered Seat',
    description: 'Sunday race day pass opposite the start grid and podium. Experience the pre-race grid tension, start lights, and the world champion crowning moment.',
    price: 395,
    fee: 25,
    capacity: 1800,
    availableQuantity: 76,
    features: [
      'Sunday full race day admission',
      'Allocated numbered covered seat',
      'View of start line, pit lane & podium ceremony',
      'Includes Sunday night Yasalam concert access'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 6
  },

  // 9. North Grandstand (Saturday Qualifying Only)
  {
    id: 't-abu-north-sat',
    eventId: 'abu-dhabi-gp-2026',
    category: 'grandstand',
    raceDay: 'Saturday',
    name: 'North Grandstand (Saturday Qualifying)',
    section: 'Turn 5 Hairpin · Under Night Floodlights',
    description: 'Single-day admission for Saturday Free Practice 3 and the high-stakes Qualifying shootout under the night floodlights.',
    price: 280,
    fee: 20,
    capacity: 1200,
    availableQuantity: 110,
    features: [
      'Saturday single day admission',
      'FP3 and Night Qualifying shootout',
      'Allocated covered grandstand seat',
      'Includes Saturday night Yasalam concert entry'
    ],
    isAssignedSeating: true,
    deliveryType: 'instant_eticket',
    status: 'available',
    maxPerOrder: 6
  },

  // 10. Yas Suites North (Hospitality)
  {
    id: 't-abu-suite-north',
    eventId: 'abu-dhabi-gp-2026',
    category: 'vip_hospitality',
    raceDay: 'Weekend Pass',
    name: 'Yas Suites North Grandstand (3-Day Pass)',
    section: 'Private Air-Conditioned Suite & Shaded Balcony',
    description: 'The sweet spot of luxury and comfort. Climate-controlled indoor lounge with private dining, premium bar, plus private shaded outdoor balcony seating right at Turn 5.',
    price: 1450,
    originalPrice: 1600,
    fee: 80,
    capacity: 450,
    availableQuantity: 28,
    features: [
      '3-Day hospitality access (Fri-Sun)',
      'Air-conditioned suite with private lounge',
      'Curated gourmet buffet and soft beverage package',
      'Padded outdoor balcony seats at Turn 5',
      'Golden Circle access for all Yasalam concerts',
      'Complimentary multi-park Yas Island access'
    ],
    isAssignedSeating: true,
    deliveryType: 'official_transfer',
    status: 'available',
    maxPerOrder: 4
  }
];

export const INITIAL_CONCERTS: Concert[] = [
  {
    id: 'c-abu-calvin-harris',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Yasalam Opening Night: Calvin Harris',
    artist: 'Calvin Harris Live',
    venue: 'Etihad Park, Yas Island, Abu Dhabi',
    date: 'Thursday, December 03, 2026',
    time: '20:30 - 23:30',
    price: 85,
    description: 'Global superstar producer and DJ Calvin Harris kicks off the Abu Dhabi Grand Prix weekend with a massive open-air electronic spectacle featuring dazzling lasers and pyrotechnics at Etihad Park.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    entryConditions: 'Included FREE with any 3-Day/4-Day Abu Dhabi GP race ticket. Standalone concert entry passes available.',
    requiresRaceTicket: false,
    availableTickets: 800
  },
  {
    id: 'c-abu-eminem',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Yasalam Friday Night: Eminem',
    artist: 'Eminem (The Rap God Tour)',
    venue: 'Etihad Park, Yas Island, Abu Dhabi',
    date: 'Friday, December 04, 2026',
    time: '21:00 - 23:45',
    price: 110,
    description: 'Hip-hop icon Eminem takes over the Etihad Park stage right after Friday twilight practice. A historic high-octane performance of multi-platinum anthems.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    entryConditions: 'Included with Friday or 3-Day race tickets. Golden Circle upgrades available.',
    requiresRaceTicket: true,
    availableTickets: 650
  },
  {
    id: 'c-abu-maroon5',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Yasalam Saturday Night: Maroon 5',
    artist: 'Maroon 5 Live in Abu Dhabi',
    venue: 'Etihad Park, Yas Island, Abu Dhabi',
    date: 'Saturday, December 05, 2026',
    time: '21:00 - 23:45',
    price: 95,
    description: 'Adam Levine and Maroon 5 deliver an unforgettable Saturday night performance immediately following the intense F1 Night Qualifying shootout.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    entryConditions: 'Included with Saturday or 3-Day race tickets.',
    requiresRaceTicket: true,
    availableTickets: 500
  },
  {
    id: 'c-abu-foo-fighters',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Yasalam Championship Finale: Foo Fighters',
    artist: 'Foo Fighters Live',
    venue: 'Etihad Park, Yas Island, Abu Dhabi',
    date: 'Sunday, December 06, 2026',
    time: '21:15 - 23:45',
    price: 125,
    description: 'Celebrate the crowning of the 2026 Formula 1 World Champion with rock legends Foo Fighters closing out the season in epic fashion under the Abu Dhabi night sky.',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    entryConditions: 'Requires valid Sunday Grand Prix race ticket to activate.',
    requiresRaceTicket: true,
    availableTickets: 420
  },
  {
    id: 'c-abu-golden-circle-4day',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Yasalam 4-Day Golden Circle VIP Fast-Track Upgrade',
    artist: 'All 4 Headline Artists (Thurs–Sun)',
    venue: 'Etihad Park Front-of-Stage VIP Enclosure',
    date: 'Dec 03 – 06, 2026',
    time: 'All 4 Concerts',
    price: 195,
    description: 'Exclusive front-of-stage Golden Circle access directly in front of the main concert stage for all 4 nights. Includes fast-track entry and dedicated beverage bars.',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
    entryConditions: 'Requires valid F1 Abu Dhabi Grand Prix race ticket.',
    requiresRaceTicket: true,
    availableTickets: 250
  }
];

export const INITIAL_PREMIUM_PACKAGES: PremiumPackage[] = [
  {
    id: 'p-abu-paddock-club',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Formula 1 Paddock Club™ Yas Marina Circuit',
    tier: 'Paddock Club™',
    price: 5200,
    description: 'The pinnacle of Formula 1 luxury entertainment, situated directly above the F1 team pit garages with panoramic views of the start/finish straight and pit lane.',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Prime pit building location with shaded viewing balcony above garages',
      'Daily curated multi-course gourmet lunches by international celebrity chefs',
      'All-day open bar serving free-flowing Champagne, fine wines and signature cocktails',
      'Daily VIP Pit Lane Walks with up-close garage and car viewing',
      'Live guest appearances by current Formula 1 drivers and team principals',
      'Guided tour of the Formula 1 Paddock & safety car garage',
      'VIP Golden Circle pass for all 4 Yasalam After-Race Concerts',
      'Complimentary Yas Island theme park access and VIP valet parking'
    ],
    daysIncluded: 'Friday, Saturday & Sunday (3-Day Access)',
    availableQuantity: 12
  },
  {
    id: 'p-abu-superyacht',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Yas Marina Trackside Superyacht VIP Hospitality',
    tier: 'Superyacht VIP',
    price: 3850,
    description: 'Step aboard a luxury 45-meter tri-deck superyacht moored trackside in Yas Marina between Turns 9 and 10. Feel the roar of the engines from the water.',
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Direct trackside yacht berth with multi-level outdoor viewing decks',
      'All-day Champagne, premium spirits, craft beer and bespoke cocktails',
      'All-day fine dining: live cooking stations, oyster bar and fresh sushi',
      'Live DJ sets and sunset party atmosphere on deck',
      'Speedboat transfer across Yas Marina basin',
      'Full weekend Yasalam concert passes included'
    ],
    daysIncluded: 'Friday, Saturday & Sunday (3-Day Access)',
    availableQuantity: 16
  },
  {
    id: 'p-abu-champions-club',
    eventId: 'abu-dhabi-gp-2026',
    name: 'Champions Club Turn 1 Hospitality Suite',
    tier: 'Champions Club',
    price: 2650,
    description: 'High-octane views of Turn 1 where the pack storms off the starting line. Air-conditioned suite luxury paired with an open-air trackside terrace.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Climate-controlled Turn 1 suite with outdoor viewing balcony',
      'Gourmet international buffets and all-day wine & beer hospitality',
      'Q&A session with an F1 insider or former driver',
      'Formula 1 Grid Walk and World Championship Trophy photo opportunity',
      'Access to all 4 Yasalam concerts at Etihad Park'
    ],
    daysIncluded: 'Saturday & Sunday (2-Day Access)',
    availableQuantity: 20
  },
  {
    id: 'p-abu-shams-suite',
    eventId: 'abu-dhabi-gp-2026',
    name: 'The Shams Suite Luxury Terrace (Turn 5)',
    tier: 'Shams VIP Suite',
    price: 1950,
    description: 'Exclusive hospitality perched above the North Grandstand Turn 5 hairpin. Unrivaled vantage point of heavy braking into the hairpin and acceleration down the straight.',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Air-conditioned VIP lounge with private shaded outdoor grandstand seats',
      'Sumptuous buffet lunch, afternoon tea, and evening hors d’oeuvres',
      'Complimentary beverage package including beer, wine, and spirits',
      'Direct fast-track gate access and Yasalam concert access'
    ],
    daysIncluded: 'Friday, Saturday & Sunday (3-Day Access)',
    availableQuantity: 24
  }
];

export const INITIAL_DISCOUNTS: DiscountCode[] = [
  {
    id: 'disc-abu-dhabi-main',
    code: 'ABUDHABI2026',
    discountPercent: 10,
    minSpend: 250,
    maxUsage: 1000,
    usedCount: 0,
    validUntil: '2026-12-06',
    active: true
  },
  {
    id: 'disc-yas-island',
    code: 'YASISLAND15',
    discountPercent: 15,
    minSpend: 400,
    maxUsage: 500,
    usedCount: 0,
    validUntil: '2026-12-01',
    active: true
  },
  {
    id: 'disc-vip-cash',
    code: 'VIP100',
    discountAmount: 100,
    minSpend: 800,
    maxUsage: 200,
    usedCount: 0,
    validUntil: '2026-12-06',
    active: true
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_EMAIL_JOBS: EmailJob[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

