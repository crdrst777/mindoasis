import { useEffect, useState } from "react";
import { styled } from "styled-components";
import { PlaceType, PaginaionType } from "../../types/map";
import { useDispatch, useSelector } from "react-redux";
import { setPlaceInfoReducer } from "../../store/placeInfoSlice";
import { RootState } from "../../store";

const { kakao }: any = window; // 카카오맵을 쓰기 위한 코드

interface SearchMapProps {
  searchPlace: string;
}

const SearchMap = ({ searchPlace }: SearchMapProps) => {
  const dispatch = useDispatch();
  const [places, setPlaces] = useState<PlaceType[]>([]);
  const { placeInfo } = useSelector((state: RootState) => state.placeInfo);
  const [pagination, setPagination] = useState<PaginaionType | null>(null);
  const markers: any = [];
  let marker: any = null;

  useEffect(() => {
    const mapContainer = document.getElementById("myMap"); // 지도를 표시할 div
    const mapOption = {
      center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
      level: 3, // 지도의 확대 레벨
    };
    const map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성
    const geocoder = new kakao.maps.services.Geocoder(); // 주소-좌표 변환 객체를 생성
    const ps = new kakao.maps.services.Places(); // 장소 검색 객체를 생성
    const infowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성

    // 검색하고 결과 목록과 마커를 표출하는 함수
    const placesSearchCB = (data: any, status: any, pagination: any) => {
      if (status === kakao.maps.services.Status.OK) {
        const bounds = new kakao.maps.LatLngBounds();

        for (let i = 0; i < data.length; i++) {
          // 마커를 생성하고 지도에 표시
          const placePosition = new kakao.maps.LatLng(data[i].y, data[i].x);
          marker = addMarker(placePosition, i);

          // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해 LatLngBounds 객체에 좌표를 추가
          bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));

          // 마커와 검색결과 항목에 mouseover 했을때 해당 장소에 인포윈도우에 장소명을 표시합니다. mouseout 했을 때는 인포윈도우를 닫습니다
          (function (marker, title) {
            kakao.maps.event.addListener(marker, "mouseover", function () {
              displayInfowindow(marker, title);
            });
            kakao.maps.event.addListener(marker, "mouseout", function () {
              infowindow.close();
            });
          })(marker, data[i].place_name);

          // 마커 클릭시 실행되는 함수 - 클릭한 마커의 장소정보를 저장
          kakao.maps.event.addListener(marker, "click", function () {
            dispatch(
              setPlaceInfoReducer({
                placeName: data[i].place_name,
                placeAddr: data[i].address_name,
              })
            );
          });
        }

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정
        map.setBounds(bounds);
        setPlaces(data);
        setPagination(pagination);

        // 지도 클릭시 마커를 생성하고 주소를 받아온다.
        if (data) {
          const NewMarker = new kakao.maps.Marker();

          // 지도에 클릭 이벤트를 등록
          kakao.maps.event.addListener(
            map,
            "click",
            function (mouseEvent: any) {
              NewMarker.setPosition(mouseEvent.latLng); // 클릭한 위도 경도 정보를 가져오고, 마커 위치를 그 위치로 옮김
              NewMarker.setMap(map);

              const searchDetailAddrFromCoords = (
                latlng: any,
                callback: any
              ) => {
                // 좌표로 법정동 상세 주소 정보를 요청합니다
                geocoder.coord2Address(
                  latlng.getLng(),
                  latlng.getLat(),
                  callback
                );
              };

              // 좌표로 법정동 상세 주소 정보를 요청
              searchDetailAddrFromCoords(
                mouseEvent.latLng,
                function (result: any, status: any) {
                  if (status === kakao.maps.services.Status.OK) {
                    dispatch(
                      setPlaceInfoReducer({
                        placeName: "",
                        placeAddr: result[0].address.address_name,
                      })
                    );
                  }
                }
              );
            }
          );
        }
      }
    };

    // 장소검색 객체를 통해 키워드로 장소검색을 요청
    ps.keywordSearch(searchPlace, placesSearchCB);

    // 마커를 생성하고 지도 위에 마커를 표시하는 함수
    const addMarker = (position: any, idx: number) => {
      var imageSrc =
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new kakao.maps.Size(36, 37), // 마커 이미지의 크기
        imgOptions = {
          spriteSize: new kakao.maps.Size(36, 691), // 스프라이트 이미지의 크기
          spriteOrigin: new kakao.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
          offset: new kakao.maps.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new kakao.maps.MarkerImage(
          imageSrc,
          imageSize,
          imgOptions
        ),
        marker = new kakao.maps.Marker({
          position: position, // 마커의 위치
          image: markerImage,
        });

      marker.setMap(map); // 지도 위에 마커를 표출
      markers.push(marker); // 배열에 생성된 마커를 추가

      return marker;
    };

    // 마커를 생성하고 리스트에 마커를 표시하는 함수
    const addListMarker = (idx: number) => {
      var imageSrc =
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url, 스프라이트 이미지를 씀
        imageSize = new kakao.maps.Size(36, 37), // 마커 이미지의 크기
        imgOptions = {
          spriteSize: new kakao.maps.Size(36, 691), // 스프라이트 이미지의 크기
          spriteOrigin: new kakao.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
          offset: new kakao.maps.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new kakao.maps.MarkerImage(
          imageSrc,
          imageSize,
          imgOptions
        ),
        marker = new kakao.maps.Marker({
          // position: position, // 마커의 위치
          image: markerImage,
        });

      marker.setMap(map); // 지도 위에 마커를 표출
      markers.push(marker); // 배열에 생성된 마커를 추가

      return marker;
    };

    // 인포윈도우에 장소명을 표시
    const displayInfowindow = (marker: any, title: string) => {
      infowindow.setContent(
        '<div style="padding:5px;font-size:12px;">' + title + "</div>"
      );
      infowindow.open(map, marker);
    };
  }, [searchPlace]);

  const onPageNumClick = (idx: number) => () => {
    if (pagination) {
      pagination.gotoPage(idx);
    }
  };

  const onPlaceItemClick = (placeName: string, placeAddr: string) => {
    dispatch(
      setPlaceInfoReducer({
        placeName: placeName,
        placeAddr: placeAddr,
      })
    );
  };

  // console.log("searchPlace", searchPlace);
  // console.log("placeInfo", placeInfo);

  return (
    <Container>
      <SelectedPlaceText>
        <PlaceName>{placeInfo.placeName}</PlaceName>
        <PlaceAddr>{placeInfo.placeAddr}</PlaceAddr>
      </SelectedPlaceText>

      <Map id="myMap" />
      <PlaceList>
        {places.map((item, i) => (
          <PlaceItem
            key={i}
            onClick={() => onPlaceItemClick(item.place_name, item.address_name)}
          >
            <ItemNum index={i}></ItemNum>
            <ItemNameContainer>
              <ItemPlaceName>{item.place_name}</ItemPlaceName>
              <ItemAddrName>{item.address_name}</ItemAddrName>
            </ItemNameContainer>
          </PlaceItem>
        ))}

        <PaginationContainer>
          {pagination &&
            // 요소가 n개인 배열로부터 인덱스를 꺼내와 <Page/>에 넣어줌
            Array.from(Array(pagination.last), (_, idx) => (
              <Page key={idx} onClick={onPageNumClick(idx + 1)}>
                {idx + 1}
              </Page>
            ))}
        </PaginationContainer>
      </PlaceList>
    </Container>
  );
};

export default SearchMap;

const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin: auto;
  width: 38.7rem;
`;

const SelectedPlaceText = styled.div`
  display: flex;
  justify-content: center;
  font-weight: 600;
  margin: 1.7rem 0;
  font-size: 1rem;
`;

const PlaceName = styled.span`
  color: ${(props) => props.theme.colors.darkGray};
  margin-right: 0.8rem;
`;
const PlaceAddr = styled.span`
  color: #5392e4;
`;

const Map = styled.div`
  width: 100%;
  height: 14.1rem;
  margin-bottom: 0.9rem;
`;

const PlaceList = styled.div`
  width: 100%;
  height: 11.88rem;
  font-size: 1rem;
  color: ${(props) => props.theme.colors.darkGray};
  border-radius: 5px;
  border: ${(props) => props.theme.borders.gray};
  overflow: scroll;
  overflow-x: hidden;
  padding: 0.4rem 1.4rem 1.4rem 1.4rem;
`;

const PlaceItem = styled.div`
  display: flex;
  margin: 0.4rem 0;
  padding: 0.5rem 0;
  cursor: pointer;
`;

const ItemNum = styled.span<{ index: number }>`
  width: 2.3rem;
  margin-right: 1rem;
  background-image: url("https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png");
  background-position: ${(props) => props.theme.markerPosition[props.index]};
`;

const ItemNameContainer = styled.div``;

const ItemPlaceName = styled.div`
  color: ${(props) => props.theme.colors.darkGray};
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 0.1rem;
`;

const ItemAddrName = styled.div`
  color: ${(props) => props.theme.colors.gray};
  font-size: 0.8rem;
  font-weight: 400;
`;

const PaginationContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  // PaginationContainer 의 바로 아래 자식 요소들에만 적용.
  // > 이걸 안하면 PaginationContainer의 모든 자식 요소에 적용
  > * {
    margin: 0 0.35rem;
  }
`;

const Page = styled.span`
  cursor: pointer;
`;
