import React from 'react';

interface IStateBadge {
  state: string;
  category: string;
}

const StateBadge: React.FC<IStateBadge> = ({ state, category }) => {
  if (category === 'MATCHING') {
    return (
      <div
        className={`badge w-20 h- flex justify-center rounded bg-blue-100 text-blue-500 font-bold`}>
        <p className='text-center'>자동매칭</p>
      </div>
    );
  }

  const badgeStyle =
    state === 'GATHERING' ? 'bg-blue-100 text-blue-500' : 'bg-red-100 text-red-500';

  const badgeText = state === 'GATHERING' ? '모집중' : '모집마감';

  return (
    <div className={`py-3 badge flex justify-center rounded ${badgeStyle} font-bold`}>
      <div className='flex text-center'>
        <p>{badgeText}</p>
      </div>
    </div>
  );
};

export default StateBadge;
