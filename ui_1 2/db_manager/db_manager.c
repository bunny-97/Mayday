// 중간 표시한 부분 빼고 모두 이선영이 작성한 코드입니다 (231~235줄: 권여준)

#include <stdio.h>
#include <sqlite3.h>
#include <string.h>

// 데이터베이스 연결 및 테이블 생성 함수
sqlite3* get_db_connection() {
    sqlite3 *conn;
    // 데이터베이스 연결
    int rc = sqlite3_open("../users.db", &conn);

    // 연결 실패 시 에러 출력 및 NULL 반환
    if (rc) {
        fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(conn));
        return NULL;
    } else {
        char *err_msg = 0;

        // users 테이블 생성 (사용자 정보를 저장)
        const char *sql_users = "CREATE TABLE IF NOT EXISTS users ("
                                "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                                "username TEXT UNIQUE NOT NULL,"  // 사용자 이름 (중복 불가)
                                "password TEXT NOT NULL"          // 비밀번호
                                ");";

        rc = sqlite3_exec(conn, sql_users, 0, 0, &err_msg);

        // 테이블 생성 실패 시 에러 출력
        if (rc != SQLITE_OK) {
            fprintf(stderr, "SQL error (users table): %s\n", err_msg);
            sqlite3_free(err_msg);
            sqlite3_close(conn);
            return NULL;
        }

        // events 테이블 생성 (이벤트 정보를 저장)
        const char *sql_events = "CREATE TABLE IF NOT EXISTS events ("
                                 "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                                 "username TEXT NOT NULL,"    // 이벤트 소유 사용자 이름
                                 "date TEXT NOT NULL,"        // 이벤트 날짜
                                 "title TEXT NOT NULL,"       // 이벤트 제목
                                 "start_time TEXT NOT NULL,"  // 시작 시간
                                 "end_time TEXT NOT NULL"     // 종료 시간
                                 ");";

        rc = sqlite3_exec(conn, sql_events, 0, 0, &err_msg);

        // 테이블 생성 실패 시 에러 출력
        if (rc != SQLITE_OK) {
            fprintf(stderr, "SQL error (events table): %s\n", err_msg);
            sqlite3_free(err_msg);
            sqlite3_close(conn);
            return NULL;
        }
    }
    return conn;  // 성공 시 데이터베이스 연결 반환
}

// 사용자 로그인 함수
int login(const char *username, const char *password) {
    sqlite3 *conn = get_db_connection();
    if (conn == NULL) return 0;

    sqlite3_stmt *stmt;
    // users 테이블에서 해당 username과 password를 검색
    const char *sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    int rc = sqlite3_prepare_v2(conn, sql, -1, &stmt, 0);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to execute statement: %s\n", sqlite3_errmsg(conn));
        sqlite3_close(conn);
        return 0;
    }

    // SQL 쿼리에 사용자 입력 바인딩
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, password, -1, SQLITE_STATIC);

    // 쿼리 실행: 결과가 ROW이면 로그인 성공
    rc = sqlite3_step(stmt);
    int success = (rc == SQLITE_ROW);

    sqlite3_finalize(stmt); // SQL 문 정리
    sqlite3_close(conn);    // 데이터베이스 연결 닫기

    return success; // 성공 여부 반환
}

// 사용자 회원가입 함수
int register_user(const char *username, const char *password) {
    sqlite3 *conn = get_db_connection();
    if (conn == NULL) return 0;

    const char *sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    sqlite3_stmt *stmt;

    int rc = sqlite3_prepare_v2(conn, sql, -1, &stmt, 0);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to execute statement: %s\n", sqlite3_errmsg(conn));
        sqlite3_close(conn);
        return 0;
    }

    // 입력 데이터를 SQL 쿼리에 바인딩
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, password, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt); // 쿼리 실행
    if (rc != SQLITE_DONE) {
        fprintf(stderr, "Failed to insert data: %s\n", sqlite3_errmsg(conn));
        sqlite3_finalize(stmt);
        sqlite3_close(conn);
        return 0; // 중복 아이디 등으로 실패했을 때
    }

    sqlite3_finalize(stmt);
    sqlite3_close(conn);
    return 1; // 회원가입 성공 시
}

// 이벤트 저장 함수
int save_event(const char *username, const char *date, const char *title, const char *start_time, const char *end_time) {
    sqlite3 *conn = get_db_connection();
    if (conn == NULL) return 0;

    const char *sql = "INSERT INTO events (username, date, title, start_time, end_time) VALUES (?, ?, ?, ?, ?)";
    sqlite3_stmt *stmt;

    int rc = sqlite3_prepare_v2(conn, sql, -1, &stmt, 0);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to prepare statement: %s\n", sqlite3_errmsg(conn));
        sqlite3_close(conn);
        return 0;
    }

    // 이벤트 정보를 SQL 쿼리에 바인딩
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, date, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, title, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, start_time, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 5, end_time, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    if (rc != SQLITE_DONE) {
        fprintf(stderr, "Failed to insert event: %s\n", sqlite3_errmsg(conn));
        sqlite3_finalize(stmt);
        sqlite3_close(conn);
        return 0; // 이벤트 저장 실패
    }

    sqlite3_finalize(stmt);
    sqlite3_close(conn);
    return 1; // 이벤트 저장 성공
}

// 이벤트 로드 함수
int load_events(const char *username, const char *date) {
    sqlite3 *conn = get_db_connection();
    if (conn == NULL) return 0;

    const char *sql = "SELECT title, start_time, end_time FROM events WHERE username = ? AND date = ?";
    sqlite3_stmt *stmt;

    int rc = sqlite3_prepare_v2(conn, sql, -1, &stmt, 0);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to prepare statement: %s\n", sqlite3_errmsg(conn));
        sqlite3_close(conn);
        return 0;
    }

    // 사용자와 날짜 정보를 바인딩
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, date, -1, SQLITE_STATIC);

    // 성공 메시지 출력
    printf("success\n");

    // 쿼리 결과를 반복하며 각 이벤트를 출력
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        const unsigned char *title = sqlite3_column_text(stmt, 0);
        const unsigned char *start_time = sqlite3_column_text(stmt, 1);
        const unsigned char *end_time = sqlite3_column_text(stmt, 2);
        printf("%s;%s;%s\n", title, start_time, end_time); // 이벤트 정보 출력
    }

    sqlite3_finalize(stmt);
    sqlite3_close(conn);
    return 1;
}

int main(int argc, char *argv[]) {
    // 프로그램 실행 시 최소 2개의 인자가 필요
    if (argc < 2) {
        printf("Invalid command or arguments\n");
        return 1;
    }

    // 로그인 명령
    if (strcmp(argv[1], "login") == 0 && argc == 4) {
        const char *username = argv[2];
        const char *password = argv[3];
        if (login(username, password)) {
            printf("success\n");
        } else {
            printf("fail\n");
        }

    // 회원가입 명령
    } else if (strcmp(argv[1], "register") == 0 && argc == 4) {
        const char *username = argv[2];
        const char *password = argv[3];
        if (register_user(username, password)) {
            printf("success\n");
        } else {
            printf("fail\n");
        }

    // 이벤트 저장 명령
    } else if (strcmp(argv[1], "save_event") == 0 && argc == 8) {
        const char *username = argv[2];
        const char *date = argv[3];
        const char *title = argv[4];
        const char *start_time = argv[5];
        const char *end_time = argv[6];
        const char *trans_time = argv[7];

        if (save_event(username, date, title, start_time, end_time)) {

            // 여기부터 권여준이 작성한 코드
            if (strcmp(trans_time, "") != 0 && trans_time != NULL) {
                // 이동 시간 이벤트도 저장
                char transit_title[256];
                snprintf(transit_title, sizeof(transit_title), "%s에 대한 이동시간", title);
                save_event(username, date, transit_title, trans_time, start_time);
            }
            // 여기까지 권여준이 작성한 코드

            printf("success\n");
        } else {
            printf("fail\n");
        }

    // 이벤트 로드 명령
    } else if (strcmp(argv[1], "load_events") == 0 && argc == 4) {
        const char *username = argv[2];
        const char *date = argv[3];
        if (!load_events(username, date)) {
            printf("fail\n");
        }

    // 잘못된 명령 처리
    } else {
        printf("Invalid command or arguments\n");
    }

    return 0;
}