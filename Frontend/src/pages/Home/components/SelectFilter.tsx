import React, { useState, useEffect, ChangeEvent } from 'react';
import userStore from '@/stores/useUserStore';
import Calendar from '@/components/Calendar';

interface ISelctFilterProps {
  setIsToday?: (isToday: boolean) => void;
  setCategory?: (category: string) => void;
  setDistance?: (distance: string) => void;
  setGender?: (gender: string) => void;
  setDeparturesDate?: (departuresDate: Date | string) => void;
}

const SelectFilter: React.FC<ISelctFilterProps> = ({
  setIsToday,
  setCategory,
  setDistance,
  setGender,
  setDeparturesDate,
}) => {
  const { gender } = userStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [isTodayChecked, setIsTodayChecked] = useState<boolean>(false);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const Category = [
    { tag: 'DAILY', name: '일상' },
    { tag: 'UNIVERSITY', name: '대학교' },
    { tag: 'COMMUTE', name: '출퇴근' },
    { tag: 'CONCERT', name: '콘서트' },
    { tag: 'AIRPORT', name: '공항' },
    { tag: 'TRAVEL', name: '여행' },
    { tag: 'RESERVIST', name: '예비군' },
  ];

  const sortOptions = [
    { value: '', name: '전체 보기' },
    { value: 'distance,asc', name: '가까운 출발지' },
    { value: 'distance,desc', name: '먼 출발지' },
    { value: 'departuresDate,asc', name: '가까운 출발시간' },
    { value: 'departuresDate,desc', name: '먼 출발시간' },
  ];

  const genderOptions = [
    { value: gender, name: '동성' },
    { value: 'any', name: '성별무관' },
  ];

  const setDateClick = (day: number, month: number, year: number) => {
    if (selectedDate === day && selectedMonth === month - 1 && selectedYear === year) {
      setSelectedDate(null);
      setDeparturesDate?.('');
    } else {
      setSelectedDate(day);
      setSelectedMonth(month - 1);
      setSelectedYear(year);
    }
  };

  useEffect(() => {
    if (selectedDate !== null) {
      const rsvDate = `${selectedYear}-${selectedMonth + 1 >= 10 ? `${selectedMonth + 1}` : `0${selectedMonth + 1}`}-${selectedDate >= 10 ? `${selectedDate}` : `0${selectedDate}`}`;
      // console.log(rsvDate);
      setDeparturesDate?.(rsvDate);
    } else {
      setDeparturesDate?.('');
    }
  }, [selectedDate, selectedMonth, selectedYear]);

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const category = event.target.value;
    setSelectedCategory(category);
    setCategory?.(category);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const sort = event.target.value;
    setSelectedSort(sort);
    setDistance?.(sort);
  };

  const handleGenderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const gender = event.target.value;
    setSelectedGender(gender);
    setGender?.(gender);
  };

  const handleIsTodayChange = (event: ChangeEvent<HTMLInputElement>) => {
    const isTodayChecked = event.target.checked;
    setIsTodayChecked(isTodayChecked);
    setIsToday?.(isTodayChecked);
    setDeparturesDate?.('');
  };

  useEffect(() => {
    setDistance?.('distance,asc');
  }, [setDistance]);

  return (
    <>
      <div className='flex justify-between overflow-scroll p-2 border-t-[1px] border-b-[1px] border-gray-300'>
        <div className='form-control'>
          <label className='label cursor-pointer flex flex-col'>
            <span className='label-text text-[13px] text-black'>오늘출발</span>
            <input
              type='checkbox'
              className='toggle toggle-success'
              checked={isTodayChecked}
              onChange={handleIsTodayChange}
            />
          </label>
        </div>
        <div className='self-center flex flex-col'>
          <label className='text-[13px] text-black'>카테고리</label>
          <select
            className='select select-bordered select-xs'
            value={selectedCategory}
            onChange={handleCategoryChange}>
            <option value=''>전체</option>
            {Category.map(category => (
              <option key={category.tag} value={category.tag}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className='self-center flex flex-col'>
          <label className='text-[13px] text-black'>정렬</label>
          <select
            className='select select-bordered select-xs'
            value={selectedSort}
            onChange={handleSortChange}>
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div className='self-center flex flex-col pr-1'>
          <label className='text-[13px] text-black'>성별</label>
          <select
            className='select select-bordered select-xs'
            value={selectedGender}
            onChange={handleGenderChange}>
            <option value=''>전체</option>
            {genderOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isTodayChecked === true ? null : (
        <div className='border-b-[1px] border-gray-300 animate-fadeIn'>
          <Calendar onDateClick={setDateClick} selectedDate={selectedDate} />
        </div>
      )}
    </>
  );
};

export default SelectFilter;
