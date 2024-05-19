import jwtAxios from '@/utils/JWTUtil';
import axios from 'axios';
import { getCookie } from '@/utils/CookieUtil';
import { IPostParty } from '@/types/Party';
import TopHeader from '@/components/TopHeader.tsx';
import SvgGoBack from '@/assets/svg/SvgGoBack';
import SvgDepartureMarker from '@/assets/svg/SvgDepartureMarker';
import SvgArrivalMarker from '@/assets/svg/SvgArrivalMarker';
import Front from '@/assets/image/icons/Front.png';
import watchPositionHook from '@/hooks/useRefreshLocation';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import partyStore, { ILocation } from '@/stores/usePartyStore';
import { Category } from '@/constants/constants';
import latLngAddStore from '@/stores/useLatLngAddStore';
import PartyMap from './components/PartyMap';
import Calendar from '@/components/Calendar.tsx';
import TimePicker from '@/components/Maps/TimePicker';
import { toast } from 'react-toastify';

// NOTE : 유효성 검사
const PartyCreatePage = () => {
  watchPositionHook();
  const { departuresName, departuresLocation, arrivalsName, arrivalsLocation } = partyStore();
  const [title, setTitle] = useState<string>('');
  const titleRef = useRef<HTMLInputElement>(null);
  const { currentAdd, currentLat, currentLng } = latLngAddStore();
  const { setDepartures, setArrivals } = partyStore();
  const nav = useNavigate();
  const [departuresDate, setDeparturesDate] = useState<Date | string>('');
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [isChangeMaxParticipants, setIsChangeMaxParticipants] = useState<boolean>(false);
  const [genderRestriction, setGenderRestriction] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());
  const [showDate, setShowDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedHour, setSelectedHour] = useState<number>(today.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(today.getMinutes());
  const passengersModalRef = useRef<HTMLDialogElement>(null);
  const dateModalRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const changeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const goSetDeparture = () => {
    nav('departure');
  };

  const goSetArrival = () => {
    nav('arrival');
  };

  const changeMaxParticipants = (e: ChangeEvent<HTMLSelectElement>) => {
    setMaxParticipants(parseInt(e.target.value));
    console.log(maxParticipants);
  };

  const changeContent = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const changeCategory = (categoryTag: string) => {
    setCategory(categoryTag);
  };

  const openPassengersModal = () => {
    if (passengersModalRef.current) {
      passengersModalRef.current.showModal();
    }
  };

  const openDateModal = () => {
    if (dateModalRef.current) {
      dateModalRef.current.showModal();
    }
  };

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

  const setTimeClick = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
  };

  const setDate = () => {
    const rsvDate = `${selectedYear}-${selectedMonth + 1 >= 10 ? `${selectedMonth + 1}` : `0${selectedMonth + 1}`}-${(selectedDate as number) >= 10 ? `${selectedDate}` : `0${selectedDate}`}T${selectedHour >= 10 ? `${selectedHour}` : `0${selectedHour}`}:${selectedMinute >= 10 ? `${selectedMinute}` : `0${selectedMinute}`}:00`;
    console.log(rsvDate);
    setShowDate(
      `${selectedYear}-${selectedMonth + 1 >= 10 ? `${selectedMonth + 1}` : `0${selectedMonth + 1}`}-${(selectedDate as number) >= 10 ? `${selectedDate}` : `0${selectedDate}`} ${selectedHour >= 10 ? `${selectedHour}` : `0${selectedHour}`}:${selectedMinute >= 10 ? `${selectedMinute}` : `0${selectedMinute}`}`,
    );
    setDeparturesDate(rsvDate);
  };

  const getAddByLatLng = async (lat: number, lng: number) => {
    try {
      const { data } = await axios.get(`/api/places/place?longitude=${lng}&latitude=${lat}`, {
        headers: { AUTHORIZATION: `Bearer ${getCookie('Authorization')}` },
      });

      return data.data.roadNameAddress === null
        ? data.data.roadNameAddress === null
          ? '주소 정보 미제공'
          : data.data.jibunAddress
        : data.data.roadNameAddress;
    } catch (error) {}
  };

  const postParty = async () => {
    if (title === '') {
      toast.error('제목을 입력해 주세요.');
      titleRef.current?.focus();
      return;
    } else if (arrivalsName === '도착지를 설정해 주세요.') {
      toast.error('도착지를 설정해 주세요.');
      window.scrollTo(0, 0);
      return;
    } else if (departuresDate === '') {
      toast.error('출발시간을 설정해 주세요.');
      window.scrollTo(0, 200);
      return;
    } else if (isChangeMaxParticipants === false) {
      toast.error('모집인원을 설정해 주세요.');
      window.scrollTo(0, 300);
      return;
    } else if (category === '') {
      toast.error('카테고리를 선택해 주세요.');
      window.scrollTo(0, 300);
      return;
    }

    let newDepartureName = departuresName;

    if (departuresName === '내 위치') {
      newDepartureName = await getAddByLatLng(
        departuresLocation!.latitude,
        departuresLocation!.longitude,
      );
    }
    const partyData: IPostParty = {
      title: title,
      departuresName: departuresName as string,
      departuresLocation: departuresLocation as ILocation,
      arrivalsName: arrivalsName as string,
      arrivalsLocation: arrivalsLocation as ILocation,
      departuresDate: departuresDate as string,
      maxParticipants: maxParticipants,
      category: category,
      genderRestriction: genderRestriction,
      content: content,
    };
    console.log(partyData);
    try {
      const result = await jwtAxios.post(`/api/party-boards`, partyData);
      console.log(result.data.data);
      if (result.data.data) {
        setDepartures?.('내 위치', { latitude: currentLat, longitude: currentLng });
        setArrivals?.('도착지를 설정해 주세요.', { latitude: 0, longitude: 0 });
        nav(`/party/${result.data.data}`);
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (!departuresName) {
      setDepartures?.('내 위치', { latitude: currentLat, longitude: currentLng });
    }
  }, []);

  let passengersModal = (
    <>
      <dialog ref={passengersModalRef} id='my_modal_4' className='modal'>
        <div className='modal-box w-11/12'>
          <h3 className='font-bold text-[20px]'>모집인원</h3>
          <div className='mt-1 border border-gray-300'></div>
          <div className='flex flex-col justify-between]'>
            <h4 className='mt-5 text-lg'>몇 명 이동하실 건가요?</h4>
            <div className=''>
              <select
                value={maxParticipants}
                onChange={changeMaxParticipants}
                className='select select-ghost select-md text-[15px] text-center mt-2 focus:outline-none'>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <h4 className='mt-5 text-lg'>원하시는 합승스타일이 있을까요?</h4>
            <div className='flex items-center'>
              <input
                type='checkbox'
                className='toggle toggle-success mt-3'
                checked={genderRestriction}
                onChange={e => setGenderRestriction(e.target.checked)}
              />
              <div className='px-4 mt-3'>
                {genderRestriction === true ? '동성과 함께 탑승할래요.' : '상관없어요!'}
              </div>
            </div>
          </div>
          <div className='modal-action'>
            <form method='dialog'>
              <button className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5'>✕</button>
              <button
                className='btn bg-OD_PURPLE text-white'
                onClick={() => setIsChangeMaxParticipants(true)}>
                선택완료
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );

  let setDateModal = (
    <>
      <dialog ref={dateModalRef} id='my_modal_4' className='modal'>
        <div className='modal-box w-11/12 bg-white'>
          <h3 className='font-bold text-[20px] text-black'>출발시간</h3>
          <div className='mt-1 border border-gray-300'></div>
          <h4 className='mt-3 text-lg text-black'>날짜</h4>
          <Calendar onDateClick={setDateClick} selectedDate={selectedDate} />
          {/* <p className='flex py-2 justify-end'>날짜를 선택해 주세요.</p> */}
          <h4 className='mt-3 text-lg text-black'>시간</h4>
          <div className='flex justify-center'>
            <TimePicker onTimeChange={setTimeClick} />
          </div>
          {/* <p className='flex py-2 justify-end'>시간을 선택해 주세요.</p> */}
          <div className='modal-action'>
            <form method='dialog'>
              <button className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5 text-black'>
                ✕
              </button>
              <button className='btn bg-OD_PURPLE text-white border-none' onClick={setDate}>
                선택완료
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );

  return (
    <div className='w-[100%] h-[95%] '>
      {/* <TopHeader
        isBack={true}
        title='파티 만들기'
        rightButtonText='만들기'
        onRightButtonClick={() => postParty(partyData)}
      /> */}
      <div className='relative w-[100%] h-[5%] bg-black z-10 flex items-center'>
        <div
          className='px-4 z-10'
          onClick={() => {
            nav(-1);
          }}>
          <SvgGoBack />
        </div>
        <div className='absolute w-[100%] flex justify-center text-[18px] font-semibold text-white'>
          파티 생성
        </div>
        {/* <div
          className='absolute w-[15%] h-[80%] right-0 mx-4 bg-OD_PURPLE rounded-lg flex justify-center items-center font-semibold text-white hover:text-OD_YELLOW'
          onClick={postParty}>
          만들기
        </div> */}
      </div>
      <div className='w-100 px-8 mt-3'>
        <input
          type='text'
          ref={titleRef}
          value={title}
          maxLength={16}
          onChange={changeTitle}
          placeholder='제목을 입력해 주세요.'
          className='input w-full font-bold text-[20px] placeholder:font-extrabold placeholder:text-[20px] placeholder:text-gray-500'
        />
        <div className='border-b-2 border-gray-500'></div>
      </div>
      <div className='h-[25%] mx-8 mt-5 border border-gray-500 rounded-xl flex flex-col items-center justify-center overflow-hidden'>
        <PartyMap />
      </div>
      <div className='h-[20%] mx-8 mt-5'>
        <div className='w-[100%] h-[50%] flex justify-between'>
          <div className='w-[8%] h-[100%]'>
            <SvgDepartureMarker width={'100%'} height={'100%'} />
          </div>
          <div className='w-[85%]' onClick={goSetDeparture}>
            <div className='flex justify-between'>
              <div className='font-bold mb-1 text-[17px]'>
                {!!departuresName ? departuresName : currentAdd}
              </div>
              <div className='w-[10%] flex justify-center items-center'>
                <img src={Front} alt='출발지 설정' />
              </div>
            </div>
            <div className='text-gray-500'>출발지</div>
          </div>
        </div>
        <div className='w-[100%] h-[50%] flex justify-between'>
          <div className='w-[8%] h-[100%]'>
            <SvgArrivalMarker width={'100%'} height={'35px'} />
          </div>
          <div className='w-[85%]' onClick={goSetArrival}>
            <div className='flex justify-between'>
              <div className='font-bold mb-1 text-[17px]'>{arrivalsName}</div>
              <div className='w-[10%] flex justify-center items-center'>
                <img src={Front} alt='도착지 설정' />
              </div>
            </div>
            <div className='text-gray-500'>도착지</div>
          </div>
        </div>
      </div>
      <div className='border-b-[8px] border-gray-200'></div>
      <div className='h-[7%] mt-6 mx-8 flex flex-col justify-between' onClick={openDateModal}>
        <div className='font-bold  text-[18px]'>출발시간</div>
        <div className='flex justify-between'>
          <div className='text-gray-500'>
            {showDate === '' ? '탑승 일시를 선택해주세요.' : (showDate as string)}
          </div>
          <div className='w-[10%] flex justify-center items-center'>
            <img src={Front} alt='출발시간 설정' />
          </div>
        </div>
      </div>
      {'탑승일시 정하는 모달' && setDateModal}
      <div
        className=' h-[7%] mt-9 mx-8 flex flex-col justify-between'
        onClick={openPassengersModal}>
        <div className='font-bold  text-[18px]'>모집인원</div>
        <div className='flex justify-between'>
          <div className='text-gray-500'>
            {isChangeMaxParticipants
              ? genderRestriction
                ? `동성 ${maxParticipants} 명`
                : `성별무관 ${maxParticipants} 명`
              : '모집 인원을 선택해 주세요.'}
          </div>
          <div className='w-[10%] flex justify-center items-center'>
            <img src={Front} alt='출발시간 설정' />
          </div>
        </div>
      </div>
      {'모집인원 및 성별제한 정하는 모달' && passengersModal}
      <div className='h-[13%] mt-9 mx-8 flex flex-col justify-between'>
        <div className='font-bold  text-[18px]'>카테고리</div>
        <div className='text-gray-500'>카테고리를 선택해 주세요.</div>
        <div className='flex gap-3 overflow-x-auto whitespace-nowrap'>
          {Category.map(({ tag, name }) => {
            switch (tag) {
              case 'DAILY':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_GREEN rounded-full text-OD_GREEN ${category === tag ? 'bg-OD_GREEN bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
              case 'UNIVERSITY':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_JORDYBLUE rounded-full text-OD_JORDYBLUE ${category === tag ? 'bg-OD_JORDYBLUE bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
              case 'COMMUTE':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_YELLOW rounded-full text-OD_ORANGE ${category === tag ? 'bg-OD_YELLOW bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
              case 'CONCERT':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_PINK rounded-full text-OD_PINK ${category === tag ? 'bg-OD_PINK bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
              case 'AIRPORT':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_SKYBLUE rounded-full text-OD_SKYBLUE ${category === tag ? 'bg-OD_SKYBLUE bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
              case 'TRAVEL':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_ORANGE rounded-full text-OD_ORANGE ${category === tag ? 'bg-OD_ORANGE bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
              case 'RESERVIST':
                return (
                  <div key={tag} onClick={() => setCategory(tag)}>
                    <div
                      className={`px-5 py-2 border border-OD_SCARLET rounded-full text-OD_SCARLET ${category === tag ? 'bg-OD_SCARLET bg-opacity-30' : ''}`}>
                      {name}
                    </div>
                  </div>
                );
            }
          })}
        </div>
      </div>
      <div className='h-[30%] mt-9 mx-8'>
        <div className='font-bold  text-[18px]'>파티 설명 (선택)</div>
        <label className='form-control'>
          <textarea
            className='textarea textarea-bordered min-h-32 resize-none mt-5'
            ref={contentRef}
            value={content}
            placeholder='자유롭게 파티를 설명해 주세요.'
            maxLength={100}
            onChange={changeContent}>
            {content}
          </textarea>
          <div className='label'>
            <span className='label-text-alt'></span>
            <span className='label-text-alt'>{content.length} / 100</span>
          </div>
        </label>
      </div>
      <div className='h-[15%] my-5 mx-8'>
        <button
          className='w-[100%] h-[50%] bg-OD_PURPLE rounded-full text-white font-bold text-[20px] hover:bg-OD_GREEN'
          onClick={postParty}>
          파티 만들기
        </button>
      </div>
    </div>
  );
};

export default PartyCreatePage;
