export type PriorityLevel = 'high' | 'medium' | 'low';

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  section: string;
  supermarkets: string[];
  priority: PriorityLevel;
  completed: boolean;
  notes?: string;
  imageUrl?: string;
  addedBy: string;
  completedBy?: string;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryItem {
  id: string;
  itemId?: string;
  name: string;
  quantity: string;
  section: string;
  supermarkets: string[];
  boughtAt: number;
  boughtBy: string;
  timesBought: number;
}

export interface FilterState {
  search: string;
  section: string; // 'all' or section name
  supermarket: string; // 'all' or supermarket name
  priority: string; // 'all' | 'high' | 'medium' | 'low'
  status: 'active' | 'completed' | 'all';
}

export interface AuthorizedUser {
  email: string;
  name: string;
  avatar: string;
}

export const AUTHORIZED_EMAILS = [
  'paulpeeling@gmail.com',
  'huichiao45@gmail.com'
];

export const AUTHORIZED_USERS: Record<string, AuthorizedUser> = {
  'paulpeeling@gmail.com': {
    email: 'paulpeeling@gmail.com',
    name: 'Paul Peeling',
    avatar: '👨‍💻'
  },
  'huichiao45@gmail.com': {
    email: 'huichiao45@gmail.com',
    name: 'Hui-Chiao',
    avatar: '👩‍⚕️'
  }
};

export const DEFAULT_SECTIONS = [
  'Produce',
  'Dairy & Eggs',
  'Bakery',
  'Meat & Seafood',
  'Pantry & Grains',
  'Frozen Foods',
  'Snacks & Beverages',
  'Household & Cleaning',
  'Personal Care',
  'Other'
] as const;

export const DEFAULT_SUPERMARKETS = [
  'Tesco',
  "Sainsbury's",
  'Waitrose'
] as const;

export const SECTION_ICONS: Record<string, string> = {
  'Produce': '🥬',
  'Dairy & Eggs': '🥛',
  'Bakery': '🍞',
  'Meat & Seafood': '🥩',
  'Pantry & Grains': '🥫',
  'Frozen Foods': '🧊',
  'Snacks & Beverages': '🍿',
  'Household & Cleaning': '🧹',
  'Personal Care': '🧼',
  'Other': '🛒'
};

export const SUPERMARKET_COLORS: Record<string, string> = {
  'Tesco': 'bg-blue-600 text-white border-blue-700',
  "Sainsbury's": 'bg-amber-600 text-white border-amber-700',
  'Waitrose': 'bg-emerald-700 text-white border-emerald-800'
};
