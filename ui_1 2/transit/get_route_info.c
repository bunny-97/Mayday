// 전체 김성현 코드

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <curl/curl.h>
#include "cJSON.h"
#include "get_route_info.h"

//호출받은 좌표를 통

// 메모리에 데이터를 저장하기 위한 구조체
// API 응답 바디를 해당 구조체에 담아 추후 파싱에 사용
struct MemoryStruct {
    char *memory;
    size_t size;
};

// curl 콜백 함수 - API 응답 데이터를 메모리에 누적 저장
static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;

    // 기존에 할당된 메모리에 응답 데이터를 추가로 담기 위해 재할당
    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if (ptr == NULL) {
        printf("메모리 부족\n");
        return 0;
    }

    mem->memory = ptr;
    // 현재까지 쌓인 응답 뒤에 새로 받은 응답 데이터 복사
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    // 문자열 종료 처리
    mem->memory[mem->size] = 0;

    return realsize;
}

// 출발지와 도착지 좌표를 이용하여 네이버 지도 Directions API를 호출하고
// 최단 소요 시간을 추출하는 함수
void get_duration(const char* start_coords, const char* end_coords) {
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;
    // 응답 데이터 저장용 구조체 초기화
    chunk.memory = malloc(1);
    chunk.size = 0;

    // curl 라이브러리 전역 초기화
    curl_global_init(CURL_GLOBAL_DEFAULT);
    // curl 핸들러 초기화
    curl = curl_easy_init();

    if(curl) {
        // 요청할 URL 구성
        char url[512];
        snprintf(url, sizeof(url), "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=%s&goal=%s", start_coords, end_coords);

        // 환경변수에서 API 키 정보 읽기
        const char* api_key_id = getenv("NAVER_API_KEY_ID");
        const char* api_key_secret = getenv("NAVER_API_KEY_SECRET");

        // API 키 미존재 시 에러 처리
        if (api_key_id == NULL || api_key_secret == NULL) {
            fprintf(stderr, "API 키를 찾을 수 없습니다. .env 파일을 로드했는지 확인하세요.\n");
            return;
        }

        // HTTP 헤더 설정을 위한 리스트 생성
        struct curl_slist *headers = NULL;
        char api_key_id_header[100];
        char api_key_secret_header[100];
        snprintf(api_key_id_header, sizeof(api_key_id_header), "X-NCP-APIGW-API-KEY-ID: %s", api_key_id);
        snprintf(api_key_secret_header, sizeof(api_key_secret_header), "X-NCP-APIGW-API-KEY: %s", api_key_secret);

        // 헤더 리스트에 API 키 정보 추가
        headers = curl_slist_append(headers, api_key_id_header);
        headers = curl_slist_append(headers, api_key_secret_header);

        // curl 옵션 설정
        curl_easy_setopt(curl, CURLOPT_URL, url);                    // 요청할 URL
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);         // 헤더 설정
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback); // 응답 처리 콜백 함수
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);   // 콜백 함수에 전달할 데이터 구조체

        // HTTP 요청 전송 및 응답 수신
        res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            // 요청 실패 시 에러 메세지 출력
            fprintf(stderr, "curl_easy_perform() 실패: %s\n", curl_easy_strerror(res));
        } else {
            // 응답 데이터 JSON 파싱
            cJSON *json = cJSON_Parse(chunk.memory);
            if (json) {
                // "route" 객체 추출
                cJSON *route = cJSON_GetObjectItem(json, "route");
                if (route) {
                    // "traoptimal" 배열 추출 (최적 경로 정보)
                    cJSON *traoptimal = cJSON_GetObjectItem(route, "traoptimal");
                    if (traoptimal && cJSON_GetArraySize(traoptimal) > 0) {
                        // 최적 경로 중 첫 번째 경로 추출
                        cJSON *first_route = cJSON_GetArrayItem(traoptimal, 0);
                        // 경로 요약 정보(summary) 추출
                        cJSON *summary = cJSON_GetObjectItem(first_route, "summary");
                        if (summary) {
                            // 소요 시간(duration) 추출 (단위: 밀리초)
                            const cJSON *duration = cJSON_GetObjectItem(summary, "duration");
                            if (duration) {
                                // duration 값을 초 단위로 변환
                                int duration_seconds = duration->valueint / 1000;
                                int hours = duration_seconds / 3600;
                                int minutes = (duration_seconds % 3600) / 60;

                                // 시간 형식에 맞게 출력
                                if (hours > 0) {
                                    printf("%d시간 %d분\n", hours, minutes);
                                } else {
                                    printf("%d분\n", minutes);
                                }
                            }
                        }
                    }
                }
                // JSON 객체 메모리 해제
                cJSON_Delete(json);
            }
        }

        // curl 정리 및 응답 데이터 메모리 해제
        curl_easy_cleanup(curl);
        free(chunk.memory);
    }

    // curl 전역 종료
    curl_global_cleanup();
}


int main(int argc, char *argv[]) {
    // 사용자에게 출발지, 도착지 좌표를 인자로 받음
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <출발지 좌표> <도착지 좌표>\n", argv[0]);
        return 1;
    }

    const char *start_coords = argv[1];
    const char *end_coords = argv[2];

    // 좌표를 바탕으로 최단 소요 시간 가져오기
    get_duration(start_coords, end_coords);

    return 0;
}