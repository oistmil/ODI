import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SvgGoBack from '@/assets/svg/SvgGoBack';
import { Tabs, Tab } from '@/pages/Profile/components/Tab';
import partyHistoryStore from '@/stores/usePartyHistoryStore';
import { IPartyHistory } from '@/types/PartyHistory';
import {
  categoryList,
  categoryColorList,
  genderRestrictionList,
  partyStateList,
  stateColorList,
  calcDate,
  formatDate,
} from '@/components/BottomSheet/BottomSheetContent';
import SvgRouteIcon from '@/assets/svg/SvgRouteIcon';
import SvgTimerIcon from '@/assets/svg/SvgTimerIcon';
import SvgParticipantsIcon from '@/assets/svg/SvgParticipantsIcon';
import PartyItemMap from '@/pages/Home/components/PartyItemMap';

const PartyHistory = () => {
  const nav = useNavigate();
  const { parties } = partyHistoryStore();

  const partyModalRef = useRef<HTMLDialogElement>(null);
  const [selectedParty, setSelectedParty] = useState<IPartyHistory | null>(null);

  const openModal = (party: IPartyHistory) => {
    setSelectedParty(party);
  };

  const closeModal = () => {
    setSelectedParty(null);
  };

  console.log(parties);

  useEffect(() => {
    if (selectedParty && partyModalRef.current) {
      partyModalRef.current.showModal();
    } else if (!selectedParty && partyModalRef.current) {
      partyModalRef.current.close();
    }
  }, [selectedParty]);

  return (
    <>
      {selectedParty && (
        <dialog ref={partyModalRef} className='modal'>
          <div className='modal-box w-11/12 h-[60%] bg-white flex flex-col'>
            <h3 className='font-bold text-black text-[20px]'>예상 이동 경로</h3>
            <div className='mt-1 border border-gray-300'></div>

            <div className='w-[100%] h-[100%] flex flex-col items-center'>
              <div className='w-[100%] h-[70%] mx-8 mt-8 rounded-xl flex flex-col items-center justify-center overflow-hidden'>
                <PartyItemMap
                  departuresLocation={selectedParty.departuresLocation}
                  arrivalsLocation={selectedParty.arrivalsLocation}
                />
              </div>

              <button
                className='btn mt-8 w-[40%] bg-OD_GREEN text-black font-bold border-none'
                onClick={() =>
                  nav(`/party/${selectedParty.id}`, { state: { from: '/profile/party/history' } })
                }>
                자세히 보기
              </button>
            </div>

            <div className='modal-action'>
              <button
                className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5 text-black'
                onClick={closeModal}>
                ✕
              </button>
            </div>
          </div>
        </dialog>
      )}
      <div className='relative w-[100%] h-[5%] bg-black z-10 flex items-center'>
        <div
          className='px-4 z-10'
          onClick={() => {
            nav('/profile', { replace: true });
          }}>
          <SvgGoBack />
        </div>
        <div className='absolute w-[100%] flex justify-center text-[18px] font-semibold text-white'>
          이용 내역
        </div>
      </div>
      <Tabs useStore={partyHistoryStore}>
        <Tab label='전체 내역' value='all'>
          {parties ? (
            parties.map(party => (
              <div
                key={party.id}
                className='w-[100%] h-[220px] border rounded-xl my-5 p-3 cursor-pointer'
                onClick={() => openModal(party)}>
                <div className='w-[100%] h-[15%] flex items-center gap-4'>
                  <div
                    className={`py-[2px] px-1 border ${categoryColorList[party.category]} rounded-lg text-[13px] font-semibold`}>
                    {categoryList[party.category]}
                  </div>
                  <div className='py-[2px] px-1 border border-gray-200 bg-gray-200 rounded-lg text-gray-500 text-[13px] font-semibold'>
                    {genderRestrictionList[party.genderRestriction]}
                  </div>
                  {party.category === 'MATCHING' ? (
                    <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                      {calcDate(party.createAt)}
                    </div>
                  ) : (
                    <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                      {calcDate(party.departuresDate)}
                    </div>
                  )}
                </div>
                <div className='w-[100%] h-[25%] flex items-center text-[18px] font-bold'>
                  {party.title}
                </div>
                <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                  <SvgRouteIcon />
                  <div>{party.departuresName}</div>
                  <div>{'->'}</div>
                  <div>{party.arrivalsName}</div>
                </div>
                {party.category === 'MATCHING' ? (
                  <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                    <SvgTimerIcon />
                    <div>{formatDate(party.createAt)}</div>
                  </div>
                ) : (
                  <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                    <SvgTimerIcon />
                    <div>{formatDate(party.departuresDate)}</div>
                  </div>
                )}
                <div className='w-[100%] h-[30%] flex items-center gap-4'>
                  {party.partyMemberDTOList.map(member => (
                    <div
                      key={member.id}
                      className='w-[40px] h-[40px] flex items-center rounded-full overflow-hidden'>
                      <img src={member.profileImage} alt={`${member.role} PROFILE`} />
                    </div>
                  ))}

                  <div
                    className={`py-[2px] px-1 ml-auto border ${stateColorList[party.state]} rounded-lg text-[13px] font-semibold`}>
                    {partyStateList[party.state]}
                  </div>
                  {/* <div className='w-[40%] h-[15%] flex justify-end items-center gap-2 text-gray-500 ml-auto mr-4'>
                    <SvgParticipantsIcon />
                    <div className='text-[13px]'>{`${party.currentParticipants} / ${party.maxParticipants}`}</div>
                  </div> */}
                </div>
              </div>
            ))
          ) : (
            <div className='flex flex-col items-center justify-center mt-3 gap-6 w-[100%]'>
              <div className='text-lg text-gray-400'>게시글이 없습니다 :(</div>
            </div>
          )}
        </Tab>
        <Tab label='만든 파티' value='organizer'>
          {parties ? (
            parties.map(party => (
              <div
                key={party.id}
                className='w-[100%] h-[220px] border rounded-xl my-5 p-3 cursor-pointer'
                onClick={() => openModal(party)}>
                <div className='w-[100%] h-[15%] flex items-center gap-4'>
                  <div
                    className={`py-[2px] px-1 border ${categoryColorList[party.category]} rounded-lg text-[13px] font-semibold`}>
                    {categoryList[party.category]}
                  </div>
                  <div className='py-[2px] px-1 border border-gray-200 bg-gray-200 rounded-lg text-gray-500 text-[13px] font-semibold'>
                    {genderRestrictionList[party.genderRestriction]}
                  </div>
                  {party.category === 'MATCHING' ? (
                    <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                      {calcDate(party.createAt)}
                    </div>
                  ) : (
                    <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                      {calcDate(party.departuresDate)}
                    </div>
                  )}
                </div>
                <div className='w-[100%] h-[25%] flex items-center text-[18px] font-bold'>
                  {party.title}
                </div>
                <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                  <SvgRouteIcon />
                  <div>{party.departuresName}</div>
                  <div>{'->'}</div>
                  <div>{party.arrivalsName}</div>
                </div>
                {party.category === 'MATCHING' ? (
                  <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                    <SvgTimerIcon />
                    <div>{formatDate(party.createAt)}</div>
                  </div>
                ) : (
                  <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                    <SvgTimerIcon />
                    <div>{formatDate(party.departuresDate)}</div>
                  </div>
                )}
                <div className='w-[100%] h-[30%] flex items-center gap-4'>
                  {party.partyMemberDTOList.map(member => (
                    <div
                      key={member.id}
                      className='w-[40px] h-[40px] flex items-center rounded-full overflow-hidden'>
                      <img src={member.profileImage} alt={`${member.role} PROFILE`} />
                    </div>
                  ))}

                  <div
                    className={`py-[2px] px-1 ml-auto border ${stateColorList[party.state]} rounded-lg text-[13px] font-semibold`}>
                    {partyStateList[party.state]}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='flex flex-col items-center justify-center mt-3 gap-6 w-[100%]'>
              <div className='text-lg text-gray-400'>게시글이 없습니다 :(</div>
            </div>
          )}
        </Tab>
        <Tab label='참여한 파티' value='other'>
          {parties ? (
            parties.map(party => (
              <div
                key={party.id}
                className='w-[100%] h-[220px] border rounded-xl my-5 p-3 cursor-pointer'
                onClick={() => openModal(party)}>
                <div className='w-[100%] h-[15%] flex items-center gap-4'>
                  <div
                    className={`py-[2px] px-1 border ${categoryColorList[party.category]} rounded-lg text-[13px] font-semibold`}>
                    {categoryList[party.category]}
                  </div>
                  <div className='py-[2px] px-1 border border-gray-200 bg-gray-200 rounded-lg text-gray-500 text-[13px] font-semibold'>
                    {genderRestrictionList[party.genderRestriction]}
                  </div>
                  {party.category === 'MATCHING' ? (
                    <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                      {calcDate(party.createAt)}
                    </div>
                  ) : (
                    <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                      {calcDate(party.departuresDate)}
                    </div>
                  )}
                </div>
                <div className='w-[100%] h-[25%] flex items-center text-[18px] font-bold'>
                  {party.title}
                </div>
                <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                  <SvgRouteIcon />
                  <div>{party.departuresName}</div>
                  <div>{'->'}</div>
                  <div>{party.arrivalsName}</div>
                </div>
                {party.category === 'MATCHING' ? (
                  <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                    {calcDate(party.createAt)}
                  </div>
                ) : (
                  <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
                    <SvgTimerIcon />
                    <div>{formatDate(party.departuresDate)}</div>
                  </div>
                )}
                <div className='w-[100%] h-[30%] flex items-center gap-4'>
                  {party.partyMemberDTOList.map(member => (
                    <div
                      key={member.id}
                      className='w-[40px] h-[40px] flex items-center rounded-full overflow-hidden'>
                      <img src={member.profileImage} alt={`${member.role} PROFILE`} />
                    </div>
                  ))}

                  <div
                    className={`py-[2px] px-1 ml-auto border ${stateColorList[party.state]} rounded-lg text-[13px] font-semibold`}>
                    {partyStateList[party.state]}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='flex flex-col items-center justify-center mt-3 gap-6 w-[100%]'>
              <div className='text-lg text-gray-400'>게시글이 없습니다 :(</div>
            </div>
          )}
        </Tab>
      </Tabs>
    </>
  );
};

export default PartyHistory;
