import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse bg-[#e3e1da] dark:bg-[#252830] rounded-lg ${className}`} />
);

export const TableRowSkeleton: React.FC<{ columns?: number; rows?: number }> = ({
  columns = 5,
  rows = 5,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-[#e3e1da] dark:border-[#252830] animate-pulse">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3">
              <div
                className={`h-4 bg-[#e3e1da] dark:bg-[#252830] rounded-md ${
                  cIdx === 0 ? 'w-3/4' : cIdx === columns - 1 ? 'w-16' : 'w-1/2'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-28 bg-[#e3e1da] dark:bg-[#252830] rounded-md" />
      <div className="w-8 h-8 rounded-lg bg-[#e3e1da] dark:bg-[#252830]" />
    </div>
    <div className="h-6 w-32 bg-[#e3e1da] dark:bg-[#252830] rounded-md mb-2" />
    <div className="h-3 w-20 bg-[#e3e1da] dark:bg-[#252830] rounded-md" />
  </div>
);
