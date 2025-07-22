# 전체 권여준 코드

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import sys
import time
import subprocess

# Chrome 옵션 설정
# headless 모드로 브라우저 동작 (브라우저 창을 표시하지 않음)
options = webdriver.ChromeOptions()
options.add_argument("headless")

def get_transit_time_with_selenium(start_coords, end_coords, input_hour, input_min):
    # 입력 시간 값이 없을 경우 기본값(0)으로 설정
    input_hour = input_hour if input_hour else "0"
    input_min = input_min if input_min else "0"

    # 웹드라이버 매니저를 통해 ChromeDriver 동적 설치 및 서비스 생성
    service = Service(ChromeDriverManager().install())
    # WebDriver 객체 생성
    driver = webdriver.Chrome(service=service, options=options)

    # 네이버 지도 대중교통 경로 URL 생성 및 접속
    # 예: https://map.naver.com/p/directions/출발좌표/도착좌표/-/transit
    url = f"https://map.naver.com/p/directions/{start_coords}/{end_coords}/-/transit?c=14.00,0,0,0,dh"
    driver.get(url)

    # 페이지 로드가 완료될 때까지 대기 (여기서는 단순 sleep 사용)
    time.sleep(10)

    try:
        # 출발 시간 변경을 위한 '시간 옵션' 버튼 클릭 대기 후 클릭
        first_button = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '.btn_time_option.btn_option'))
        ).click()

        # 시(hour) 설정을 위해 시 옵션 버튼 클릭
        driver.find_element(By.CSS_SELECTOR, '.timeset_option.timeset_option_hour').click()

        # 드롭다운(레이어) 로딩 대기
        scroll_container = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "layer_timeset"))
        )

        # 스크롤을 통해 원하는 시간(hour) 버튼을 찾은 뒤 클릭
        desired_text = f"{input_hour}"
        button_found = False

        # 최대 10회 스크롤하며 찾는 시간 버튼을 탐색
        for _ in range(10):
            buttons = scroll_container.find_elements(By.CSS_SELECTOR, 'button[type="button"][role="option"]')
            for button in buttons:
                # 버튼 위치로 스크롤
                driver.execute_script("arguments[0].scrollIntoView(true);", button)
                time.sleep(0.2)
                # 버튼 텍스트가 원하는 시간인지 확인
                if driver.execute_script("return arguments[0].textContent.trim();", button) == desired_text:
                    # 해당 버튼 클릭
                    driver.execute_script("arguments[0].click();", button)
                    button_found = True
                    break
            if button_found:
                break
            # 스크롤 컨테이너를 아래로 스크롤
            driver.execute_script("arguments[0].scrollTop += 200;", scroll_container)
            time.sleep(2)

        # 오버레이가 사라질 때까지 대기 (레이어 사라지는 것을 대기)
        WebDriverWait(driver, 20).until(
            EC.invisibility_of_element((By.CLASS_NAME, "sc-tge8yo"))
        )    

        # 분(minute) 옵션 버튼 클릭
        min_button = WebDriverWait(driver,30).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR,'.timeset_option.timeset_option_minute'))
        ).click()

        time.sleep(0.5)

        # 분 옵션 목록 로딩 대기 후 모두 찾기
        min_buttons = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'button[type="button"][role="option"]'))
        )
        
        # 원하는 분(minute) 버튼 클릭
        for button in min_buttons:
            if button.text.strip() == f"{input_min}":
                button.click()
                break

        # 변경된 시간 옵션이 반영된 경로 정보 영역에서 소요 시간 정보 추출
        time_info = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '.base_info.wrap_time_taken'))
        )
        time_text = time_info.text
        print(time_text)

        # 최단 시간 반환
        return time_text

    except Exception as e:
        print("오류 발생:", e)
    finally:
        # WebDriver 종료
        driver.quit()

# 메인 로직
if __name__ == "__main__":
    # 인자 개수 체크
    if len(sys.argv) != 5:
        print("Usage: python3 get_transit_time.py <start_coords> <end_coords> <hour> <minute>")
        sys.exit(1)

    start_coords = sys.argv[1]
    end_coords = sys.argv[2]
    input_hour = sys.argv[3]
    input_min = sys.argv[4]

    # 함수 호출로 대중교통 소요 시간 얻기
    get_transit_time_with_selenium(start_coords, end_coords, input_hour, input_min)