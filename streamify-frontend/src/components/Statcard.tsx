import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode; 
  loading?: boolean; 
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, loading }) => {
  return (
    <div className='p-[1px] rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-purple-500/50 transition-shadow duration-100'>
    <div className="group relative p-5 bg-black/80 border border-white/10 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-400">
          {icon}
        </div>
        <div className='flex space-x-4'>
        <p className="text-sm text-gray-400">{title}</p>
        <div className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
        </div>
  
      </div>
      <div className="relative">
        {loading ? (
          <div className="h-9 w-3/4 bg-gray-700 rounded-md animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-white">{value}</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default StatCard;