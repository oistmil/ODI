import jwtAxios from '@/utils/JWTUtil';
import React, { useState, useEffect, ReactNode } from 'react';

interface TabsProps {
  children: React.ReactElement<TabProps>[] | React.ReactElement<TabProps>;
  useStore: () => {
    range: string;
    sort: string;
    setRange: (range: string) => void;
    setSort: (sort: string) => void;
    setParties: (parties: any) => void;
  };
}

interface TabProps {
  label?: string;
  value?: string;
  children: ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => <>{children}</>;

export const Tabs: React.FC<TabsProps> = ({ children, useStore }) => {
  const { range, sort, setRange, setSort, setParties } = useStore();

  const handleClick = (value: string) => {
    setRange(value);
    setSort('desc');
  };

  const getPartyHistory = async () => {
    const response = await jwtAxios(
      `api/members/me/party?range=${range}&page=0&size=30&sort=createAt,${sort}`,
    );
    console.log(response.data.data.content);
    setParties(response.data.data.content);
  };

  useEffect(() => {
    getPartyHistory();
  }, [range, sort]);

  return (
    <div>
      <ul className='w-[100%] h-[95%] flex justify-center'>
        {React.Children.map(children, child => (
          <li
            key={child.props.value}
            className={`w-[30%] m-3 p-2 text-center cursor-pointer font-semibold ${child.props.value === range ? 'text-OD_PURPLE border-OD_PURPLE border-b-2' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => handleClick(child.props.value as string)}>
            {child.props.label}
          </li>
        ))}
      </ul>
      <div className='p-4'>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'desc' | 'asc')}
          className='select select-bordered w-full mb-4'>
          <option value='desc'>최근 순서로 정렬</option>
          <option value='asc'>오래된 순서로 정렬</option>
        </select>
        {React.Children.map(children, child => {
          if (child.props.value === range) return <div key={child.props.value}>{child}</div>;
          else return null;
        })}
      </div>
    </div>
  );
};
