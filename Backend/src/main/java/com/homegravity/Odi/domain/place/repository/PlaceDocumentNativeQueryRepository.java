package com.homegravity.Odi.domain.place.repository;

import co.elastic.clients.elasticsearch._types.InlineScript;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.json.JsonData;
import com.homegravity.Odi.domain.place.entity.PlaceDocument;
import com.homegravity.Odi.global.response.error.ErrorCode;
import com.homegravity.Odi.global.response.error.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.Queries;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.data.elasticsearch.core.query.GeoDistanceOrder;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@RequiredArgsConstructor
@Repository
public class PlaceDocumentNativeQueryRepository {

    // 탐색할 최대 거리 값.
    private static final String PLACE_MAX_DISTANCE = "10km";

    private final ElasticsearchOperations elasticsearchOperations;

    // 검색어로 장소 검색.
    // 정렬 기준은 가까우면서 검색어의 유사도가 높은 항목 -> 거리가 멀면서 검색어의 유사도가 높은 항목 -> 유사도가 낮은 항목
    public List<PlaceDocument> searchPlaces(String searchWord, GeoPoint geoPoint, Pageable pageable) {


        // multi match query
        MultiMatchQuery multiMatchPhrase = MultiMatchQuery.of(mmq -> mmq.query(searchWord).fields(List.of("major_category^100", "sub_category^100", "road_name_address.analyzed^14", "jibun_address", "place_name^10", "place_name.analyzed^7", "building_name.analyzed^5", "busstop_name.analyzed", "bus_stop_num")).type(TextQueryType.Phrase));
        MultiMatchQuery multiMatchBestFields = MultiMatchQuery.of(mmq -> mmq.query(searchWord).fields(List.of("place_name.analyzed", "busstop_name.analyzed^0.01")).type(TextQueryType.BestFields));

        // 위치 (geoPoint로 부터 10Km 떨어진 값은 decay만큼 감쇠)
        DecayPlacement decayPlacement = DecayPlacement.of(dp -> dp.scale(JsonData.of("500km")).offset(JsonData.of("1km")).decay(0.01).origin(JsonData.of(geoPoint)));

        // Decay function
        DecayFunction decayFunction = DecayFunction.of(df -> df.field("location-geopoint").placement(decayPlacement));

        // Script Score function : '~역'검색 시 지하철 및 기차역 우선 검색
        InlineScript script = InlineScript.of(s -> s.source("if (params.query_content.endsWith('역') && doc['major_category.keyword'].contains('지하철 및 도시철도')) { return 100000; } else { return 1; }")
                .params("query_content", JsonData.of(searchWord)));
        ScriptScoreFunction scriptScoreFunction = ScriptScoreFunction.of(ssf -> ssf.script(s -> s.inline(script)));

        // phrase 검색 결과 없을 시 best_fields 사용
        BoolQuery boolQuery = BoolQuery.of(bq -> bq.should(multiMatchPhrase._toQuery(), multiMatchBestFields._toQuery()).minimumShouldMatch("1"));


        // 검색어의 유사도 * 거리 (decay 함수 사용)
        Query query = NativeQuery.builder()
                .withQuery(QueryBuilders.functionScore(fs -> fs
                                .query(fsq -> fsq.bool(boolQuery))
                                .functions(f -> f.linear(decayFunction))
                                .functions(f -> f.scriptScore(scriptScoreFunction))
                                .scoreMode(FunctionScoreMode.Multiply)
                                .boostMode(FunctionBoostMode.Multiply)
                        )
                )
                .withPageable(pageable)
                .build();

        SearchHits<PlaceDocument> searchHits = elasticsearchOperations.search(query, PlaceDocument.class);

        if (searchHits.isEmpty()) {
            throw new BusinessException(ErrorCode.NEAR_PLACE_NOT_EXIST, "검색어에 해당하는 결과가 없습니다.");
        }

        return searchHits.stream().map(SearchHit::getContent).toList();
    }

    // 가장 가까운 장소 조회
    public PlaceDocument getNearestPlace(GeoPoint geoPoint) {

        Query query = NativeQuery.builder()
                .withQuery(QueryBuilders.geoDistance(gd -> gd.distance(PLACE_MAX_DISTANCE).field("location-geopoint").location(loc -> loc.latlon(Queries.latLon(geoPoint)))))
                .withSort(Sort.by(new GeoDistanceOrder("location-geopoint", geoPoint)))
                .withMaxResults(1)
                .build();

        SearchHits<PlaceDocument> searchHits = elasticsearchOperations.search(query, PlaceDocument.class);

        if (searchHits.isEmpty()) {
            throw new BusinessException(ErrorCode.NEAR_PLACE_NOT_EXIST, "반경 " + PLACE_MAX_DISTANCE + "내에 있는 장소를 찾을 수 없습니다.");
        }

        return searchHits.getSearchHit(0).getContent();
    }
}
