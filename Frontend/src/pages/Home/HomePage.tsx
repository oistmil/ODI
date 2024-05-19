// import getUserInfoQuery
import { useEffect } from 'react';
import Map from '@/components/Maps/Map';
import { Layout } from '@/components/Layout';
import watchPositionHook from '@/hooks/useRefreshLocation';

const HomePage = () => {
  // console.log(window.innerWidth, window.innerHeight);
  watchPositionHook();
  return (
    <Layout>
      <Map />
    </Layout>
  );
};

export default HomePage;
