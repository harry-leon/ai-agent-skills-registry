'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const StackContext = createContext(null);

export function StackProvider({ children }) {
  const [stack, setStack] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load stack from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('skillvault_stack');
      if (saved) {
        setStack(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  // Save stack to localStorage on changes
  const saveStack = (newStack) => {
    setStack(newStack);
    try {
      localStorage.setItem('skillvault_stack', JSON.stringify(newStack));
    } catch {
      // Ignore quota errors
    }
  };

  const addToStack = (skill) => {
    if (!skill || !skill.id) return;
    if (stack.some((s) => s.id === skill.id)) return;
    const newStack = [
      ...stack,
      {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        handle: skill.owner?.handle || 'community',
        version: skill.currentVersion?.number || 1,
        fileCount: skill.currentVersion?._count?.files || 0,
      },
    ];
    saveStack(newStack);
    setIsOpen(true); // Automatically open drawer when adding
  };

  const removeFromStack = (skillId) => {
    const newStack = stack.filter((s) => s.id !== skillId);
    saveStack(newStack);
  };

  const clearStack = () => {
    saveStack([]);
  };

  const isInStack = (skillId) => {
    return stack.some((s) => s.id === skillId);
  };

  const generateCliCommand = () => {
    if (stack.length === 0) return '';
    const targets = stack.map((s) => `@${s.handle}/${s.slug}`).join(' ');
    return `npx skillvault add ${targets}`;
  };

  return (
    <StackContext.Provider
      value={{
        stack,
        isOpen,
        setIsOpen,
        addToStack,
        removeFromStack,
        clearStack,
        isInStack,
        generateCliCommand,
      }}
    >
      {children}
    </StackContext.Provider>
  );
}

export function useStack() {
  const context = useContext(StackContext);
  if (!context) {
    throw new Error('useStack must be used within a StackProvider');
  }
  return context;
}
