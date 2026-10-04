import React from 'react';
import {
  Utensils,
  Plane,
  GraduationCap,
  ShoppingBag,
  Gamepad2,
  Receipt,
  HeartPulse,
  Laptop,
  Tag
} from 'lucide-react';
import { getCategoryById } from '../utils/categories';

const iconMap = {
  Utensils,
  Plane,
  GraduationCap,
  ShoppingBag,
  Gamepad2,
  Receipt,
  HeartPulse,
  Laptop,
  Tag
};

const CategoryIcon = ({ categoryId, className = 'w-4 h-4', size = 'md' }) => {
  const cat = getCategoryById(categoryId);
  const IconComponent = iconMap[cat.icon] || Tag;

  const sizeClasses = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2.5 rounded-xl',
    lg: 'p-3.5 rounded-2xl'
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border ${sizeClasses[size]}`}
      style={{
        backgroundColor: cat.badgeBg,
        borderColor: cat.borderColor,
        color: cat.color
      }}
    >
      <IconComponent className={className} />
    </div>
  );
};

export default CategoryIcon;
