// 전체 권여준 코드

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include "cJSON.h"

///// 네이버 map geocoding api를 통해 입력된 출발지와 도착지의 좌표를 호출하는 소스코드 /////

// 메모리에 데이터를 저장하기 위한 구조체 정의
// API 응답 바디를 이 구조체에 담아 추후 처리할 수 있음
struct MemoryStruct {
    char *memory;
    size_t size;
};

// curl 콜백 함수 - API 응답 데이터를 메모리에 누적 저장하는 역할
static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;

    // 현재까지 저장된 메모리 사이즈에 응답 데이터 사이즈를 더해 재할당
    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if(ptr == NULL) {
        printf("Not enough memory\n");
        return 0;
    }

    mem->memory = ptr;
    // 현재까지 쌓인 데이터 뒤에 새로운 응답 데이터 추가
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    // 마지막에 널문자 추가로 문자열 종료 처리
    mem->memory[mem->size] = 0;

    return realsize;
}

// 주소를 받아 해당 주소의 좌표를 가져오는 함수
// 네이버 지도 API(geocoding) 호출 -> JSON 응답 파싱 -> 좌표 추출
char* get_coordinates(const char* address) {
    CURL *curl;
    CURLcode res;

    // 응답 데이터를 저장할 구조체 초기화
    struct MemoryStruct chunk;
    chunk.memory = malloc(1);
    chunk.size = 0;

    // curl 라이브러리 전역 초기화
    curl_global_init(CURL_GLOBAL_DEFAULT);
    // curl 핸들러 초기화
    curl = curl_easy_init();

    if(curl) {
        char url[256];

        // 요청 시 필요한 주소 인코딩 (한글, 공백 등 특수문자 처리)
        char *encoded_address = curl_easy_escape(curl, address, 0);

        // 최종 요청 URL 구성
        snprintf(url, sizeof(url), "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=%s", encoded_address);
        // 인코딩에 사용한 메모리 해제
        curl_free(encoded_address);

        // 환경변수에서 API 키 정보 가져오기 (X-NCP-APIGW-API-KEY-ID, X-NCP-APIGW-API-KEY)
        const char* api_key_id = getenv("NAVER_API_KEY_ID");
        const char* api_key_secret = getenv("NAVER_API_KEY_SECRET");

        // API 키 미설정 시 에러 처리
        if (api_key_id == NULL || api_key_secret == NULL) {
            fprintf(stderr, "API 키를 찾을 수 없습니다. .env 파일을 로드했는지 확인하세요.\n");
            return NULL;
        }

        // HTTP 헤더 설정을 위한 리스트
        struct curl_slist *headers = NULL;
        char api_key_id_header[100];
        char api_key_secret_header[100];

        // 헤더 문자열 생성
        snprintf(api_key_id_header, sizeof(api_key_id_header), "X-NCP-APIGW-API-KEY-ID: %s", api_key_id);
        snprintf(api_key_secret_header, sizeof(api_key_secret_header), "X-NCP-APIGW-API-KEY: %s", api_key_secret);

        // 헤더 리스트에 추가
        headers = curl_slist_append(headers, api_key_id_header);
        headers = curl_slist_append(headers, api_key_secret_header);

        // curl 옵션 설정
        // 1) 요청할 URL 설정
        curl_easy_setopt(curl, CURLOPT_URL, url);
        // 2) 설정한 헤더 추가
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        // 3) 응답 데이터를 처리할 콜백 함수 등록
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
        // 4) 콜백 함수로 전달할 구조체 포인터 지정
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);

        // HTTP 요청 전송 및 응답 수신
        res = curl_easy_perform(curl);
        if(res != CURLE_OK) {
            // 요청 실패 시 에러 메세지 출력
            fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        } else {
            // 응답 JSON 파싱 시작
            cJSON *json = cJSON_Parse(chunk.memory);
            if (json == NULL) {
                printf("Error parsing JSON\n");
                free(chunk.memory);
                return NULL;
            }

            // "addresses" 배열 추출 (결과 리스트)
            cJSON *addresses = cJSON_GetObjectItem(json, "addresses");
            if (addresses == NULL || cJSON_GetArraySize(addresses) == 0) {
                printf("No addresses found.\n");
                cJSON_Delete(json);
                free(chunk.memory);
                return NULL;
            }

            // 첫 번째 결과 아이템 추출
            cJSON *first = cJSON_GetArrayItem(addresses, 0);
            if (first == NULL) {
                printf("No address data found.\n");
                cJSON_Delete(json);
                free(chunk.memory);
                return NULL;
            }

            // 결과 중 x(경도), y(위도) 추출
            const char *x = cJSON_GetObjectItem(first, "x")->valuestring;
            const char *y = cJSON_GetObjectItem(first, "y")->valuestring;

            // "x,y" 형태의 문자열로 좌표 구성
            char *coordinates = (char *)malloc(50);
            snprintf(coordinates, 50, "%s,%s", x, y);

            // JSON 객체 메모리 해제
            cJSON_Delete(json);
            // 응답 데이터 메모리 해제
            free(chunk.memory);
            // curl 종료
            curl_easy_cleanup(curl);

            // 좌표 문자열 반환
            return coordinates;
        }

        // 요청 중에 문제가 발생했을 경우 자원 정리
        curl_easy_cleanup(curl);
        free(chunk.memory);
    }

    // curl 전역 종료
    curl_global_cleanup();
    return NULL;
}

int main(int argc, char *argv[]) {
    // 프로그램 실행 시 출발지와 도착지를 인자로 받아야 함
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <출발지 주소> <도착지 주소>\n", argv[0]);
        return 1;
    }

    const char *departure = argv[1];
    const char *destination = argv[2];

    // 출발지 좌표 가져오기
    char *start_coords = get_coordinates(departure);
    if (start_coords) {
        printf("%s\n", start_coords);
        free(start_coords);
    } else {
        fprintf(stderr, "출발지 좌표를 가져오는 데 실패했습니다.\n");
        return 1;
    }

    // 도착지 좌표 가져오기
    char *end_coords = get_coordinates(destination);
    if (end_coords) {
        printf("%s\n", end_coords);
        free(end_coords);
    } else {
        fprintf(stderr, "도착지 좌표를 가져오는 데 실패했습니다.\n");
        return 1;
    }

    return 0;
}