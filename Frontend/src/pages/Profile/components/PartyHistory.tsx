import { useNavigate } from 'react-router-dom';
import SvgGoBack from '@/assets/svg/SvgGoBack';
import { Tabs, Tab } from '@/pages/Profile/components/Tab';
import partyHistoryStore from '@/stores/usePartyHistoryStore';

const PartyHistory = () => {
  const nav = useNavigate();
  const { parties } = partyHistoryStore();

  console.log(parties);

  return (
    <>
      <div className='relative w-[100%] h-[5%] bg-black z-10 flex items-center'>
        <div
          className='px-4 z-10'
          onClick={() => {
            nav(-1);
          }}>
          <SvgGoBack />
        </div>
        <div className='absolute w-[100%] flex justify-center text-[18px] font-semibold text-white'>
          이용 내역
        </div>
      </div>
      <Tabs useStore={partyHistoryStore}>
        <Tab label='전체 내역' value='all'>
          {parties.map((party: any) => (
            <div key={party.createAt}>{party.title}</div>
          ))}
        </Tab>
        <Tab label='만든 파티' value='organizer'>
          {parties.map((party: any) => (
            <div key={party.createAt}>{party.title}</div>
          ))}
        </Tab>
        <Tab label='참여한 파티' value='other'>
          {parties.map((party: any) => (
            <div key={party.createAt}>{party.title}</div>
          ))}
        </Tab>
      </Tabs>
    </>
  );
};

export default PartyHistory;
