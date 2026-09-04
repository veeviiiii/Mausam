/**
 * The city set the radar's air-quality layer draws.
 *
 * Tiered on purpose. Air quality is the one layer that cannot be a raster —
 * see design/tokens.ts §9 — so the app draws its own labels, and a label set
 * that is right for a district view is an unreadable pile at country zoom.
 * Rather than fight that with collision detection after the fact, each city
 * declares the smallest map it deserves to appear on:
 *
 *   tier 0 — state and UT capitals plus the metros. Always drawn.
 *   tier 1 — large cities (roughly million-plus, plus regional hubs).
 *   tier 2 — everything else worth a pin once you are looking at one region.
 *
 * Coordinates are city-centre to four decimals, which is far finer than a map
 * label needs; they exist to place a pin, not to identify a monitoring station.
 * The AQI itself comes from Open-Meteo per coordinate — see lib/openMeteoAqi.ts.
 */

export interface AqiCity {
  name: string;
  lat: number;
  lon: number;
  /** 0 = capital/metro, 1 = large city, 2 = regional. */
  tier: 0 | 1 | 2;
}

export const AQI_CITIES: AqiCity[] = [
  /* ---- tier 0: state / UT capitals and the metros ---- */
  { name: "Delhi", lat: 28.6139, lon: 77.209, tier: 0 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, tier: 0 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, tier: 0 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, tier: 0 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, tier: 0 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867, tier: 0 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, tier: 0 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, tier: 0 },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462, tier: 0 },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126, tier: 0 },
  { name: "Patna", lat: 25.5941, lon: 85.1376, tier: 0 },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794, tier: 0 },
  { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366, tier: 0 },
  { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245, tier: 0 },
  { name: "Raipur", lat: 21.2514, lon: 81.6296, tier: 0 },
  { name: "Ranchi", lat: 23.3441, lon: 85.3096, tier: 0 },
  { name: "Dehradun", lat: 30.3165, lon: 78.0322, tier: 0 },
  { name: "Shimla", lat: 31.1048, lon: 77.1734, tier: 0 },
  { name: "Srinagar", lat: 34.0837, lon: 74.7973, tier: 0 },
  { name: "Jammu", lat: 32.7266, lon: 74.857, tier: 0 },
  { name: "Panaji", lat: 15.4909, lon: 73.8278, tier: 0 },
  { name: "Gandhinagar", lat: 23.2156, lon: 72.6369, tier: 0 },
  { name: "Amaravati", lat: 16.5131, lon: 80.5165, tier: 0 },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362, tier: 0 },
  { name: "Itanagar", lat: 27.0844, lon: 93.6053, tier: 0 },
  { name: "Imphal", lat: 24.817, lon: 93.9368, tier: 0 },
  { name: "Shillong", lat: 25.5788, lon: 91.8933, tier: 0 },
  { name: "Aizawl", lat: 23.7271, lon: 92.7176, tier: 0 },
  { name: "Kohima", lat: 25.6751, lon: 94.1086, tier: 0 },
  { name: "Agartala", lat: 23.8315, lon: 91.2868, tier: 0 },
  { name: "Gangtok", lat: 27.3314, lon: 88.6138, tier: 0 },
  { name: "Puducherry", lat: 11.9416, lon: 79.8083, tier: 0 },
  { name: "Port Blair", lat: 11.6234, lon: 92.7265, tier: 0 },
  { name: "Leh", lat: 34.1526, lon: 77.5771, tier: 0 },
  { name: "Pune", lat: 18.5204, lon: 73.8567, tier: 0 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882, tier: 0 },

  /* ---- tier 1: large cities and regional hubs ---- */
  { name: "Surat", lat: 21.1702, lon: 72.8311, tier: 1 },
  { name: "Kanpur", lat: 26.4499, lon: 80.3319, tier: 1 },
  { name: "Indore", lat: 22.7196, lon: 75.8577, tier: 1 },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185, tier: 1 },
  { name: "Vadodara", lat: 22.3072, lon: 73.1812, tier: 1 },
  { name: "Ludhiana", lat: 30.901, lon: 75.8573, tier: 1 },
  { name: "Agra", lat: 27.1767, lon: 78.0081, tier: 1 },
  { name: "Nashik", lat: 19.9975, lon: 73.7898, tier: 1 },
  { name: "Meerut", lat: 28.9845, lon: 77.7064, tier: 1 },
  { name: "Rajkot", lat: 22.3039, lon: 70.8022, tier: 1 },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739, tier: 1 },
  { name: "Amritsar", lat: 31.634, lon: 74.8723, tier: 1 },
  { name: "Prayagraj", lat: 25.4358, lon: 81.8463, tier: 1 },
  { name: "Jodhpur", lat: 26.2389, lon: 73.0243, tier: 1 },
  { name: "Coimbatore", lat: 11.0168, lon: 76.9558, tier: 1 },
  { name: "Madurai", lat: 9.9252, lon: 78.1198, tier: 1 },
  { name: "Kochi", lat: 9.9312, lon: 76.2673, tier: 1 },
  { name: "Gwalior", lat: 26.2183, lon: 78.1828, tier: 1 },
  { name: "Jabalpur", lat: 23.1815, lon: 79.9864, tier: 1 },
  { name: "Vijayawada", lat: 16.5062, lon: 80.648, tier: 1 },
  { name: "Chhatrapati Sambhajinagar", lat: 19.8762, lon: 75.3433, tier: 1 },
  { name: "Kota", lat: 25.2138, lon: 75.8648, tier: 1 },
  { name: "Hubballi", lat: 15.3647, lon: 75.124, tier: 1 },
  { name: "Mysuru", lat: 12.2958, lon: 76.6394, tier: 1 },
  { name: "Tiruchirappalli", lat: 10.7905, lon: 78.7047, tier: 1 },
  { name: "Guntur", lat: 16.3067, lon: 80.4365, tier: 1 },
  { name: "Noida", lat: 28.5355, lon: 77.391, tier: 1 },
  { name: "Ghaziabad", lat: 28.6692, lon: 77.4538, tier: 1 },
  { name: "Faridabad", lat: 28.4089, lon: 77.3178, tier: 1 },
  { name: "Gurugram", lat: 28.4595, lon: 77.0266, tier: 1 },
  { name: "Jamshedpur", lat: 22.8046, lon: 86.2029, tier: 1 },
  { name: "Bhilai", lat: 21.1938, lon: 81.3509, tier: 1 },
  { name: "Cuttack", lat: 20.4625, lon: 85.883, tier: 1 },
  { name: "Siliguri", lat: 26.7271, lon: 88.3953, tier: 1 },
  { name: "Jalandhar", lat: 31.326, lon: 75.5762, tier: 1 },
  { name: "Mangaluru", lat: 12.9141, lon: 74.856, tier: 1 },
  { name: "Tirupati", lat: 13.6288, lon: 79.4192, tier: 1 },
  { name: "Udaipur", lat: 24.5854, lon: 73.7125, tier: 1 },
  { name: "Kolhapur", lat: 16.705, lon: 74.2433, tier: 1 },
  { name: "Muzaffarpur", lat: 26.1209, lon: 85.3647, tier: 1 },
  { name: "Moradabad", lat: 28.8386, lon: 78.7733, tier: 1 },
  { name: "Aligarh", lat: 27.8974, lon: 78.088, tier: 1 },
  { name: "Gorakhpur", lat: 26.7606, lon: 83.3732, tier: 1 },
  { name: "Bikaner", lat: 28.0229, lon: 73.3119, tier: 1 },
  { name: "Solapur", lat: 17.6599, lon: 75.9064, tier: 1 },
  { name: "Salem", lat: 11.6643, lon: 78.146, tier: 1 },

  /* ---- tier 2: regional, drawn once you are looking at one area ---- */
  { name: "Thane", lat: 19.2183, lon: 72.9781, tier: 2 },
  { name: "Navi Mumbai", lat: 19.033, lon: 73.0297, tier: 2 },
  { name: "Pimpri-Chinchwad", lat: 18.6298, lon: 73.7997, tier: 2 },
  { name: "Amravati", lat: 20.932, lon: 77.7523, tier: 2 },
  { name: "Nanded", lat: 19.1383, lon: 77.321, tier: 2 },
  { name: "Akola", lat: 20.7002, lon: 77.0082, tier: 2 },
  { name: "Latur", lat: 18.4088, lon: 76.5604, tier: 2 },
  { name: "Chandrapur", lat: 19.9615, lon: 79.2961, tier: 2 },
  { name: "Bareilly", lat: 28.367, lon: 79.4304, tier: 2 },
  { name: "Saharanpur", lat: 29.968, lon: 77.546, tier: 2 },
  { name: "Mathura", lat: 27.4924, lon: 77.6737, tier: 2 },
  { name: "Jhansi", lat: 25.4484, lon: 78.5685, tier: 2 },
  { name: "Firozabad", lat: 27.1592, lon: 78.3957, tier: 2 },
  { name: "Rampur", lat: 28.8154, lon: 79.025, tier: 2 },
  { name: "Muzaffarnagar", lat: 29.4727, lon: 77.7085, tier: 2 },
  { name: "Ujjain", lat: 23.1765, lon: 75.7885, tier: 2 },
  { name: "Sagar", lat: 23.8388, lon: 78.7378, tier: 2 },
  { name: "Satna", lat: 24.6005, lon: 80.8322, tier: 2 },
  { name: "Ratlam", lat: 23.3315, lon: 75.0367, tier: 2 },
  { name: "Ajmer", lat: 26.4499, lon: 74.6399, tier: 2 },
  { name: "Bhilwara", lat: 25.3407, lon: 74.6313, tier: 2 },
  { name: "Alwar", lat: 27.5666, lon: 76.6252, tier: 2 },
  { name: "Sri Ganganagar", lat: 29.9094, lon: 73.8798, tier: 2 },
  { name: "Panipat", lat: 29.3909, lon: 76.9635, tier: 2 },
  { name: "Hisar", lat: 29.1492, lon: 75.7217, tier: 2 },
  { name: "Rohtak", lat: 28.8955, lon: 76.6066, tier: 2 },
  { name: "Karnal", lat: 29.6857, lon: 76.9905, tier: 2 },
  { name: "Ambala", lat: 30.3782, lon: 76.7767, tier: 2 },
  { name: "Yamunanagar", lat: 30.129, lon: 77.2674, tier: 2 },
  { name: "Patiala", lat: 30.3398, lon: 76.3869, tier: 2 },
  { name: "Bathinda", lat: 30.211, lon: 74.9455, tier: 2 },
  { name: "Pathankot", lat: 32.2643, lon: 75.6421, tier: 2 },
  { name: "Haridwar", lat: 29.9457, lon: 78.1642, tier: 2 },
  { name: "Rudrapur", lat: 28.9845, lon: 79.4141, tier: 2 },
  { name: "Haldwani", lat: 29.2183, lon: 79.513, tier: 2 },
  { name: "Gaya", lat: 24.7955, lon: 85.0002, tier: 2 },
  { name: "Bhagalpur", lat: 25.2425, lon: 86.9842, tier: 2 },
  { name: "Darbhanga", lat: 26.1542, lon: 85.8918, tier: 2 },
  { name: "Purnia", lat: 25.7771, lon: 87.4753, tier: 2 },
  { name: "Durgapur", lat: 23.5204, lon: 87.3119, tier: 2 },
  { name: "Asansol", lat: 23.6739, lon: 86.9524, tier: 2 },
  { name: "Haldia", lat: 22.0667, lon: 88.0698, tier: 2 },
  { name: "Kharagpur", lat: 22.3302, lon: 87.3237, tier: 2 },
  { name: "Rourkela", lat: 22.2604, lon: 84.8536, tier: 2 },
  { name: "Sambalpur", lat: 21.4669, lon: 83.9812, tier: 2 },
  { name: "Berhampur", lat: 19.3149, lon: 84.7941, tier: 2 },
  { name: "Talcher", lat: 20.9497, lon: 85.2334, tier: 2 },
  { name: "Dhanbad", lat: 23.7957, lon: 86.4304, tier: 2 },
  { name: "Bokaro", lat: 23.6693, lon: 86.1511, tier: 2 },
  { name: "Korba", lat: 22.3595, lon: 82.7501, tier: 2 },
  { name: "Bilaspur", lat: 22.0797, lon: 82.1409, tier: 2 },
  { name: "Nellore", lat: 14.4426, lon: 79.9865, tier: 2 },
  { name: "Rajahmundry", lat: 16.9891, lon: 81.7837, tier: 2 },
  { name: "Kurnool", lat: 15.8281, lon: 78.0373, tier: 2 },
  { name: "Tirunelveli", lat: 8.7139, lon: 77.7567, tier: 2 },
  { name: "Thoothukudi", lat: 8.7642, lon: 78.1348, tier: 2 },
  { name: "Vellore", lat: 12.9165, lon: 79.1325, tier: 2 },
  { name: "Kozhikode", lat: 11.2588, lon: 75.7804, tier: 2 },
  { name: "Thrissur", lat: 10.5276, lon: 76.2144, tier: 2 },
  { name: "Kollam", lat: 8.8932, lon: 76.6141, tier: 2 },
  { name: "Kannur", lat: 11.8745, lon: 75.3704, tier: 2 },
  { name: "Belagavi", lat: 15.8497, lon: 74.4977, tier: 2 },
  { name: "Kalaburagi", lat: 17.3297, lon: 76.8343, tier: 2 },
  { name: "Davanagere", lat: 14.4644, lon: 75.9218, tier: 2 },
  { name: "Shivamogga", lat: 13.9299, lon: 75.5681, tier: 2 },
  { name: "Bhavnagar", lat: 21.7645, lon: 72.1519, tier: 2 },
  { name: "Jamnagar", lat: 22.4707, lon: 70.0577, tier: 2 },
  { name: "Junagadh", lat: 21.5222, lon: 70.4579, tier: 2 },
  { name: "Ankleshwar", lat: 21.6266, lon: 73.0017, tier: 2 },
  { name: "Silchar", lat: 24.8333, lon: 92.7789, tier: 2 },
  { name: "Dibrugarh", lat: 27.4728, lon: 94.912, tier: 2 },
  { name: "Nagaon", lat: 26.3464, lon: 92.684, tier: 2 },
];

/** Cities that appear at or below a given tier — the zoom gate reads this. */
export function citiesUpTo(tier: 0 | 1 | 2): AqiCity[] {
  return AQI_CITIES.filter((c) => c.tier <= tier);
}
