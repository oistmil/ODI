import { Status, Wrapper } from '@googlemaps/react-wrapper';
import { ViteConfig } from '@/apis/ViteConfig';
import { useEffect, useRef } from 'react';
import DEPARTURE from '@/assets/image/icons/departureMarker.png';
import ARRIVAL from '@/assets/image/icons/arrivalMarker.png';
import jwtAxios from '@/utils/JWTUtil';
import { ILocation } from '@/types/Map';

interface PartyMapProps {
  departuresLocation: ILocation;
  arrivalsLocation: ILocation;
}

const PartyMap: React.FC<PartyMapProps> = ({ departuresLocation, arrivalsLocation }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const map = new window.google.maps.Map(ref.current, {
      disableDefaultUI: true,
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
      return pathList.map(point => ({
        lat: point[1], // 두 번째 항목이 위도
        lng: point[0], // 첫 번째 항목이 경도
      }));
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

        bounds.extend(new google.maps.LatLng(start.latitude, start.longitude));
        bounds.extend(new google.maps.LatLng(end.latitude, end.longitude));
        map.fitBounds(bounds);
      } catch (error) {
        console.error(error);
      }
    };

    if (departuresLocation.latitude !== 0 && departuresLocation.longitude !== 0) {
      const startPos = new google.maps.LatLng(
        departuresLocation.latitude,
        departuresLocation.longitude,
      );
      startMarker.setPosition(startPos);
      startMarker.setMap(map);
      bounds.extend(startPos);
    }

    if (
      departuresLocation.latitude !== 0 &&
      departuresLocation.longitude !== 0 &&
      arrivalsLocation.latitude !== 0 &&
      arrivalsLocation.longitude !== 0
    ) {
      const endPos = new google.maps.LatLng(arrivalsLocation.latitude, arrivalsLocation.longitude);
      endMarker.setPosition(endPos);
      endMarker.setMap(map);
      bounds.extend(endPos);
      directionRoute(departuresLocation, arrivalsLocation);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [departuresLocation, arrivalsLocation]);

  return <div ref={ref} id='map' className='w-[100%] h-[100%]' />;
};

const render = (status: Status, props: PartyMapProps) => {
  switch (status) {
    case Status.LOADING:
      return <span className='loading loading-dots loading-lg'></span>;
    case Status.FAILURE:
      return <>에러 발생</>;
    case Status.SUCCESS:
      return <PartyMap {...props} />;
  }
};

const PartyItemMap: React.FC<PartyMapProps> = ({ departuresLocation, arrivalsLocation }) => {
  return (
    <Wrapper
      apiKey={ViteConfig.VITE_GOOGLE_MAP_API_KEY}
      render={status => render(status, { departuresLocation, arrivalsLocation })}
      libraries={['marker']}
    />
  );
};

export default PartyItemMap;
