import React, { useEffect, useRef, useState } from 'react';

export interface CalendarInfo {
  day: number;
  dayOfWeek: string;
}

interface CalendarProps {
  onDateClick: (day: number, month: number, year: number) => void;
  selectedDate: number | null;
}

const generateDate = (year: number, month: number): CalendarInfo[] => {
  const result: CalendarInfo[] = [];
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.toLocaleDateString('ko-KR', { weekday: 'short' });
    result.push({ day, dayOfWeek });
  }
  return result;
};

const Calendar: React.FC<CalendarProps> = ({ onDateClick, selectedDate }) => {
  const today = new Date();
  const year = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [calendarData, setCalendarData] = useState<CalendarInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateRef = useRef<HTMLDivElement | null>(null);
  const todayDate = new Date().getDate();

  useEffect(() => {
    if (!dateRef.current) return;
    const left = dateRef.current!.offsetLeft - window.innerWidth / 2 + dateRef.current.offsetWidth;
    containerRef.current?.scrollTo({ left: left, behavior: 'smooth' });
  }, [selectedMonth]);

  useEffect(() => {
    setCalendarData(generateDate(year, selectedMonth));
  }, [year, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value) - 1);
    onDateClick(1, parseInt(e.target.value), year);
  };

  const handleClick = (day: number) => {
    onDateClick(day, selectedMonth + 1, year);
  };

  const getDayColor = (dayOfWeek: string) => {
    switch (dayOfWeek) {
      case '토':
        return 'text-blue-500';
      case '일':
        return 'text-red-500';
      default:
        return '';
    }
  };

  return (
    <div className='w-[100%] flex flex-row text-black px-4 py-4 gap-2'>
      <div className='flex items-center'>
        <select
          value={selectedMonth + 1}
          onChange={handleMonthChange}
          className='select select-ghost select-sm text-[15px] text-center focus:outline-none'>
          <option value={1}>1월</option>
          <option value={2}>2월</option>
          <option value={3}>3월</option>
          <option value={4}>4월</option>
          <option value={5}>5월</option>
          <option value={6}>6월</option>
          <option value={7}>7월</option>
          <option value={8}>8월</option>
          <option value={9}>9월</option>
          <option value={10}>10월</option>
          <option value={11}>11월</option>
          <option value={12}>12월</option>
        </select>
      </div>
      <div ref={containerRef} className='flex flex-row gap-3 pl-4 overflow-scroll'>
        {calendarData.map((item, id) => (
          <div
            key={id}
            ref={todayDate === item.day ? dateRef : undefined}
            className={`flex flex-col items-center px-3 ${selectedDate === item.day ? 'rounded-2xl bg-gray-300' : ''}`}
            onClick={() => handleClick(item.day)}
            data-day={item.day}>
            <button>
              <p className={`text-[17px] ${getDayColor(item.dayOfWeek)}`}>{item.day}</p>
              <p className={`text-[15px] ${getDayColor(item.dayOfWeek)}`}>{item.dayOfWeek}</p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
