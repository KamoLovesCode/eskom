import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, className = '', titleClassName = '' }) => {
  return (
    <div className={`bg-gray-900 border border-gray-700/50 rounded-2xl shadow-lg shadow-black/20 p-8 flex flex-col transition-all duration-300 ${className}`}>
      {title && (
        <div className="flex items-center mb-4">
          {icon}
          <h2 className={`text-xl font-bold text-white ${titleClassName}`}>{title}</h2>
        </div>
      )}
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
};