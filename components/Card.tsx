import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-slate-100
        ${hover ? 'hover:shadow-md hover:border-slate-200 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
