import { Status, Wrapper } from '@googlemaps/react-wrapper';
import { ViteConfig } from '@/apis/ViteConfig';
import { useEffect, useRef } from 'react';
import autoPartyStore from '@/stores/useAutoPartyStore';
import DEPARTURE from '@/assets/image/icons/departureMarker.png';
import ARRIVAL from '@/assets/image/icons/arrivalMarker.png';
import jwtAxios from '@/utils/JWTUtil';
import { ILocation } from '@/types/Map';

const MapRef = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { depLoc, arrLoc } = autoPartyStore();

  useEffect(() => {
    if (!ref.current) return;

    const map = new window.google.maps.Map(ref.current, {
      disableDefaultUI: true,
      // styles: DarkModeStyle,
      clickableIcons: false,
      zoom: 16,
      minZoom: 5,
      maxZoom: 18,
      draggable: false,
      restriction: {
        latLngBounds: {
          north: 43,
          south: 33,
          west: 124,
          east: 132,
        },
        strictBounds: true,
      },
    });

    const bounds = new google.maps.LatLngBounds();

    const convertPathFormat = (pathList: [number, number][]) => {
      return pathList.map(
        point =>
          ({
            lat: point[1], // 두 번째 항목이 위도
            lng: point[0], // 첫 번째 항목이 경도
          }) as google.maps.LatLngLiteral,
      );
    };

    const updateBoundsWithPath = (path: google.maps.LatLngLiteral[]) => {
      path.forEach(location => {
        bounds.extend(new google.maps.LatLng(location.lat, location.lng));
      });
      map.fitBounds(bounds);
    };

    const startMarker = new window.google.maps.Marker({
      icon: {
        url: DEPARTURE,
        scaledSize: new window.google.maps.Size(40, 40),
      },
      zIndex: 10,
      animation: google.maps.Animation.DROP,
    });

    const endMarker = new window.google.maps.Marker({
      icon: {
        url: ARRIVAL,
        scaledSize: new window.google.maps.Size(40, 40),
      },
      zIndex: 10,
      animation: google.maps.Animation.DROP,
    });

    const directionRoute = async (start: ILocation, end: ILocation) => {
      try {
        const result = await jwtAxios.get(
          `/api/maps/path-info?departuresX=${start.longitude}&departuresY=${start.latitude}&arrivalsX=${end.longitude}&arrivalsY=${end.latitude}`,
        );
        const pathData = JSON.parse(result.data.data).route.traoptimal[0].path;
        const pathList = convertPathFormat(pathData);
        new google.maps.Polyline({
          map: map,
          path: pathList,
          geodesic: true,
          strokeColor: '#2196F3',
          strokeOpacity: 1.0,
          strokeWeight: 4,
        });

        // 출발지와 도착지 경계를 맞추기 위해 경계 확장
        bounds.extend(new google.maps.LatLng(start.latitude, start.longitude));
        bounds.extend(new google.maps.LatLng(end.latitude, end.longitude));
        map.fitBounds(bounds);
      } catch (error) {
        console.error(error);
      }
    };

    // 초기 위치 설정과 마커 추가
    if (depLoc && depLoc.latitude !== 0 && depLoc.longitude !== 0) {
      const startPos = new google.maps.LatLng(depLoc.latitude, depLoc.longitude);
      startMarker.setPosition(startPos);
      startMarker.setMap(map);
      bounds.extend(startPos);
    }

    if (
      depLoc &&
      depLoc.latitude !== 0 &&
      depLoc.longitude !== 0 &&
      arrLoc &&
      arrLoc.latitude !== 0 &&
      arrLoc.longitude !== 0
    ) {
      const endPos = new google.maps.LatLng(arrLoc.latitude, arrLoc.longitude);
      endMarker.setPosition(endPos);
      endMarker.setMap(map);
      bounds.extend(endPos);
      directionRoute(depLoc, arrLoc);
    }

    // 모든 마커가 추가된 후, 맵 경계를 조정
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [depLoc, arrLoc]);

  return <div ref={ref} id='map' className='w-[100%] h-[100%]' />;
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <>
          <span className='loading loading-dots loading-lg'></span>
        </>
      );
    case Status.FAILURE:
      return <>에러 발생</>;
    case Status.SUCCESS:
      return <MapRef />;
  }
};

const AutoPartyMap = () => {
  return (
    <Wrapper apiKey={ViteConfig.VITE_GOOGLE_MAP_API_KEY} render={render} libraries={['marker']} />
  );
};

export default AutoPartyMap;
