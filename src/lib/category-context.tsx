'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Category = 'All' | 'Free' | 'Honey' | 'Boasts';

interface CategoryContextType {
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  return (
    <CategoryContext.Provider value={{ selectedCategory, setSelectedCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
} 