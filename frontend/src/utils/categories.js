export const CATEGORIES = [
  {
    id: 'Food',
    name: 'Food',
    color: '#38bdf8', // sky/cyan
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: 'Utensils',
    defaultBudget: 2500
  },
  {
    id: 'Travel',
    name: 'Travel',
    color: '#06b6d4', // cyan
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    icon: 'Plane',
    defaultBudget: 1500
  },
  {
    id: 'Education',
    name: 'Education',
    color: '#a855f7', // purple
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    icon: 'GraduationCap',
    defaultBudget: 2000
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    color: '#ec4899', // pink
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    icon: 'ShoppingBag',
    defaultBudget: 1000
  },
  {
    id: 'Entertainment',
    name: 'Entertainment',
    color: '#f43f5e', // rose
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    icon: 'Gamepad2',
    defaultBudget: 800
  },
  {
    id: 'Bills',
    name: 'Bills',
    color: '#6366f1', // indigo
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    icon: 'Receipt',
    defaultBudget: 1000
  },
  {
    id: 'Healthcare',
    name: 'Healthcare',
    color: '#10b981', // emerald
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'HeartPulse',
    defaultBudget: 500
  },
  {
    id: 'Electronics',
    name: 'Electronics',
    color: '#3b82f6', // blue
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    icon: 'Laptop',
    defaultBudget: 500
  },
  {
    id: 'Other',
    name: 'Other',
    color: '#94a3b8', // slate
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    icon: 'Tag',
    defaultBudget: 200
  }
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer'
];

export const getCategoryById = (id) => {
  if (!id) {
    return CATEGORIES[8]; // Other
  }
  const cleanId = String(id).trim().toLowerCase();
  return CATEGORIES.find(c => 
    c.id.toLowerCase() === cleanId || 
    c.name.toLowerCase() === cleanId
  ) || {
    id: id || 'Other',
    name: id || 'Other',
    color: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    icon: 'Tag',
    defaultBudget: 50
  };
};
