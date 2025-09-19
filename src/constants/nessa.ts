// Nessa Farm Constants - Location and Agricultural Data
// Nessa, Rogaland County, Norway

// Geographic coordinates for Nessa farm area
export const NESSA_LOCATION = {
  latitude: 58.9,
  longitude: 5.7,
  elevation: 45, // meters above sea level
  utmZone: '32N',
  municipality: 'Strand',
  county: 'Rogaland',
  country: 'Norway'
} as const;

// Norwegian growing season calendar
export const GROWING_SEASON = {
  // Indoor seedling start
  seedlingStart: { month: 3, day: 15 }, // March 15
  
  // Outdoor transplanting window
  transplantStart: { month: 5, day: 1 }, // May 1
  transplantEnd: { month: 6, day: 15 }, // June 15
  
  // Harvest seasons by crop type
  appleHarvest: {
    early: { month: 7, day: 15 }, // July 15
    main: { month: 8, day: 20 }, // August 20
    late: { month: 9, day: 30 } // September 30
  },
  
  pearHarvest: {
    early: { month: 8, day: 1 }, // August 1
    main: { month: 9, day: 10 }, // September 10
    late: { month: 10, day: 15 } // October 15
  },
  
  // Critical frost protection period
  frostRiskPeriod: {
    start: { month: 4, day: 1 }, // April 1
    end: { month: 5, day: 31 } // May 31
  }
} as const;

// Apple varieties suitable for Norwegian coastal climate
export const APPLE_VARIETIES = [
  {
    name: 'Discovery',
    harvestMonth: 8,
    storageMonths: 2,
    diseaseResistance: ['scab'],
    norwegian: true
  },
  {
    name: 'Aroma',
    harvestMonth: 9,
    storageMonths: 6,
    diseaseResistance: ['scab', 'mildew'],
    norwegian: true
  },
  {
    name: 'Summerred',
    harvestMonth: 8,
    storageMonths: 1,
    diseaseResistance: [],
    norwegian: false
  }
] as const;

// Pear varieties for Norwegian climate
export const PEAR_VARIETIES = [
  {
    name: 'Clara Frijs',
    harvestMonth: 9,
    storageMonths: 3,
    norwegian: true
  },
  {
    name: 'Herzogin Elsa',
    harvestMonth: 9,
    storageMonths: 2,
    norwegian: true
  }
] as const;

// Common diseases in Norwegian apple/pear orchards
export const DISEASES = {
  appleScab: {
    name: 'Apple Scab',
    scientific: 'Venturia inaequalis',
    riskPeriod: 'April-June',
    weatherTrigger: 'wet_cool_weather',
    norwegian: 'Epleskurv'
  },
  fireBlight: {
    name: 'Fire Blight',
    scientific: 'Erwinia amylovora',
    riskPeriod: 'May-July',
    weatherTrigger: 'warm_humid_weather',
    norwegian: 'Ildskudd'
  },
  powderyMildew: {
    name: 'Powdery Mildew',
    scientific: 'Podosphaera leucotricha',
    riskPeriod: 'May-September',
    weatherTrigger: 'warm_dry_weather',
    norwegian: 'Meldugg'
  }
} as const;

// Norwegian weather station references
export const WEATHER_STATIONS = {
  stavanger: {
    id: 'SN44560',
    name: 'Stavanger - Våland',
    distance: 15, // km from Nessa
    coordinates: { lat: 58.9699, lng: 5.7331 }
  },
  tau: {
    id: 'SN44580',
    name: 'Tau',
    distance: 8, // km from Nessa
    coordinates: { lat: 58.9236, lng: 5.8944 }
  }
} as const;

// Growing degree day base temperatures (Celsius)
export const GDD_BASE_TEMPS = {
  apple: 5, // °C base temperature for apples
  pear: 5, // °C base temperature for pears
  general: 10 // °C general agriculture base
} as const;

// Critical temperature thresholds
export const TEMP_THRESHOLDS = {
  frostWarning: 2, // °C - activate frost protection
  frostDamage: -2, // °C - severe frost damage risk
  optimalGrowth: { min: 15, max: 25 }, // °C optimal growing range
  heatStress: 30 // °C heat stress threshold
} as const;

// Norwegian agricultural compliance
export const NORWEGIAN_COMPLIANCE = {
  debio: {
    name: 'DEBIO Organic Certification',
    website: 'https://debio.no',
    requirements: ['no_synthetic_pesticides', 'organic_fertilizers', 'biodiversity_measures']
  },
  mattilsynet: {
    name: 'Norwegian Food Safety Authority',
    website: 'https://mattilsynet.no',
    requirements: ['food_safety_plan', 'traceability', 'hygiene_standards']
  },
  landbruksdirektoratet: {
    name: 'Norwegian Agriculture Agency',
    website: 'https://landbruksdirektoratet.no',
    subsidies: ['acreage_support', 'environmental_measures', 'organic_bonus']
  }
} as const;

// Norwegian date/time formatting
export const NORWEGIAN_FORMATS = {
  date: 'DD.MM.YYYY',
  time: 'HH:mm',
  dateTime: 'DD.MM.YYYY HH:mm',
  timezone: 'Europe/Oslo',
  locale: 'nb-NO'
} as const;