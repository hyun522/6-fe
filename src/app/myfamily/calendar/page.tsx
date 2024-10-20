'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import classNames from 'classnames/bind';
import DatePicker from '@/components/common/DatePicker';
import CommonButton from '@/components/common/CommonButton';
import GroupHeader from '@/components/common/GroupHeader';
import './Calendar.scss';
import {
  familyData,
  travelAllData,
  travelSchedulePost,
  getUserData,
} from '@/app/api/api';
import DateBetween from '@/utils/dateBetween';
import Cookies from 'js-cookie';
import styles from './CalendarPage.module.scss';

const cx = classNames.bind(styles);

// 이벤트 타입 정의
type EventType = {
  title: string; // 이벤트 제목
  start: string; // 시작 날짜
  end: string; // 종료 날짜
  color: string; // 이벤트 색상
};

interface TravelData {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  checklist: {
    id: number;
    checkName: string;
    content: string;
    success: boolean;
  }[];
  familyId: number;
}

interface Event {
  title: string;
  start: string;
  end: string;
  color: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventType[]>([]); // 이벤트 목록 상태 관리
  const [isAddScheduleVisible, setIsAddScheduleVisible] = useState(false); // 일정 추가 모달 표시 여부 상태 관리
  const [isStartPickerVisible, setIsStartPickerVisible] = useState(false); // 시작 날짜 선택기 표시 여부 상태 관리
  const [isEndPickerVisible, setIsEndPickerVisible] = useState(false); // 종료 날짜 선택기 표시 여부 상태 관리
  const [isButtonEnabled, setIsButtonEnabled] = useState(false); // 완료 버튼 활성화 여부 상태 관리
  const [destination, setDestination] = useState(''); // 여행지 입력 상태 관리
  const [errorMessage, setErrorMessage] = useState(''); // 오류 메시지 상태 관리
  const [touched, setTouched] = useState(false); // 입력 값이 변경되었는지 여부 상태 관리
  const [groupImage, setGroupImage] = useState(''); // 입력 값이 변경되었는지 여부 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startPickerRef = useRef<HTMLDivElement>(null); // 시작 날짜 선택기 참조
  const endPickerRef = useRef<HTMLDivElement>(null); // 종료 날짜 선택기 참조

  const [startPickerValue, setStartPickerValue] = useState({
    year: '',
    month: '',
    day: '',
  });
  const [endPickerValue, setEndPickerValue] = useState({
    year: '',
    month: '',
    day: '',
  });

  const fetchTravelData = async () => {
    try {
      const data: TravelData[] = await travelAllData();

      // travelData를 이벤트 형식으로 변환
      const formattedEvents: Event[] = data.map((travel: TravelData) => ({
        title: travel.name,
        start: travel.startDate,
        end: travel.endDate,
        color: '#5302FF',
      }));

      setEvents(formattedEvents); // 이벤트를 설정
    } catch (err) {
      console.error('Error liking feed:', err);
    }
  };
  useEffect(() => {
    fetchTravelData();
  }, []);

  useEffect(() => {
    const fetchGroupImage = async () => {
      try {
        // userData를 실행하여 familyId 추출
        const user = await getUserData();
        const { familyId } = user;

        // familyId로 familyData 호출하여 profileImage 가져오기
        const family = await familyData(familyId);
        const { profileImage } = family;

        // 가져온 profileImage를 state에 저장
        setGroupImage(profileImage);
      } catch (err) {
        console.error('Error fetching group image:', err);
      }
    };

    fetchGroupImage();
  }, []);

  // 클릭 이벤트가 선택기 바깥에서 발생했는지 확인하고 선택기를 닫음
  const handleClickOutside = (event: MouseEvent) => {
    if (
      startPickerRef.current &&
      !startPickerRef.current.contains(event.target as Node)
    ) {
      setIsStartPickerVisible(false);
    }
    if (
      endPickerRef.current &&
      !endPickerRef.current.contains(event.target as Node)
    ) {
      setIsEndPickerVisible(false);
    }
  };

  // 컴포넌트가 마운트되거나 언마운트될 때 클릭 이벤트 리스너 추가/제거
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 버튼 활성화 여부를 검증하는 함수
  const validateButton = () => {
    setErrorMessage(''); // 검증 전에 오류 메시지 초기화

    // 여행지가 비어있는지 확인
    if (destination.trim() === '') {
      setErrorMessage('여행지를 입력하세요.');
      setIsButtonEnabled(false);
      return;
    }

    // 시작 날짜와 종료 날짜가 설정되었는지 확인
    if (
      !startPickerValue.year ||
      !startPickerValue.month ||
      !startPickerValue.day ||
      !endPickerValue.year ||
      !endPickerValue.month ||
      !endPickerValue.day
    ) {
      setErrorMessage('시작 날짜와 종료 날짜를 모두 선택하세요.');
      setIsButtonEnabled(false);
      return;
    }

    // 날짜를 비교 가능한 형식(예: YYYY-MM-DD)으로 변환
    const startDate = new Date(
      `${startPickerValue.year}-${startPickerValue.month}-${startPickerValue.day}`,
    );
    const endDate = new Date(
      `${endPickerValue.year}-${endPickerValue.month}-${endPickerValue.day}`,
    );

    // 종료 날짜가 시작 날짜보다 빠른지 확인
    if (endDate < startDate) {
      setErrorMessage('종료 날짜는 시작 날짜와 같거나 이후여야 합니다.');
      setIsButtonEnabled(false);
      return;
    }

    // 모든 검증을 통과하면 버튼 활성화
    setIsButtonEnabled(true);
  };

  // 입력 값이 변경될 때마다 검증 실행
  useEffect(() => {
    if (touched) validateButton();
  }, [destination, startPickerValue, endPickerValue, touched]);

  // FullCalendar의 각 날짜 셀 콘텐츠를 렌더링하는 함수
  const renderDayCellContent = (renderProps: any) => {
    const dayNumber = renderProps.dayNumberText.replace('일', '');
    return <span>{dayNumber}</span>;
  };

  // 일정 추가 버튼 클릭 시 모달 표시
  const handleAddClick = () => {
    setIsAddScheduleVisible(true);
  };

  // 일정 추가 모달 닫기
  const handleClose = () => {
    setIsAddScheduleVisible(false);
  };

  // 일정생성 완료 api
  const handleCreateSchedule = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true); // Start submitting

    const myCookie = Cookies.get('JWT');

    const startDate = DateBetween(
      startPickerValue.year,
      startPickerValue.month,
      startPickerValue.day,
    );
    const endDate = DateBetween(
      endPickerValue.year,
      endPickerValue.month,
      endPickerValue.day,
    );

    if (touched) {
      try {
        // Schedule creation API call
        await travelSchedulePost(destination, startDate, endDate, myCookie);

        // Fetch travel data again after creating schedule
        await fetchTravelData();

        // Close the modal
        setIsAddScheduleVisible(false);
      } catch (error) {
        console.error('Error creating schedule:', error);
      } finally {
        setIsSubmitting(false); // Reset submitting state
      }
    } else {
      setIsSubmitting(false); // Reset submitting state if not touched
    }
  };

  // 폼과의 상호작용 시 상태 변경
  const handleInteraction = () => {
    setTouched(true);
    validateButton();
  };

  return (
    <div className={cx('container')}>
      <GroupHeader groupImage={groupImage} isShowButton isShowProfile>
        MY FAMILY
      </GroupHeader>
      <div className={cx('calendar-container')}>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          events={events}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next',
          }}
          titleFormat={{
            year: 'numeric',
            month: 'numeric',
          }}
          dayCellContent={renderDayCellContent}
          height="auto"
        />
      </div>
      <Image
        src="/svgs/add-icon.svg"
        alt="Add Icon"
        width={48}
        height={48}
        priority
        className={cx('button')}
        onClick={handleAddClick}
      />
      <div
        className={cx('overlay', { show: isAddScheduleVisible })}
        onClick={handleClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClose();
          }
        }}
      >
        <div
          className={cx('addSchedule', { show: isAddScheduleVisible })}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.currentTarget.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="여행일정 추가"
        >
          <p>여행일정 추가</p>
          <div className={cx('addSchedule-name')}>
            여행지 설정
            <input
              className={cx('addSchedule-name-input')}
              type="text"
              placeholder="여행지를 입력하세요"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                handleInteraction();
              }}
            />
          </div>
          <div className={cx('addSchedule-date')}>
            여행 일정
            <div className={cx('addSchedule-date-inputs')}>
              <button
                type="button"
                className={cx('addSchedule-date-input', {
                  invisible: isStartPickerVisible,
                })}
                onClick={() => {
                  setIsStartPickerVisible(true);
                  handleInteraction();
                }}
              >
                <span
                  className={cx('text-content', {
                    invisible: isStartPickerVisible,
                  })}
                >
                  {`${startPickerValue.year}-${startPickerValue.month}-${startPickerValue.day}` ||
                    '시작 날짜'}
                </span>
                {isStartPickerVisible && (
                  <div className={cx('picker-overlay')} ref={startPickerRef}>
                    <DatePicker
                      pickerValue={startPickerValue}
                      setPickerValue={setStartPickerValue}
                    />
                  </div>
                )}
              </button>
              <span>-</span>
              <button
                type="button"
                className={cx('addSchedule-date-input', {
                  invisible: isEndPickerVisible,
                })}
                onClick={() => {
                  setIsEndPickerVisible(true);
                  handleInteraction();
                }}
              >
                <span
                  className={cx('text-content', {
                    invisible: isEndPickerVisible,
                  })}
                >
                  {`${endPickerValue.year}-${endPickerValue.month}-${endPickerValue.day}` ||
                    '종료 날짜'}
                </span>
                {isEndPickerVisible && (
                  <div className={cx('picker-overlay')} ref={endPickerRef}>
                    <DatePicker
                      pickerValue={endPickerValue}
                      setPickerValue={setEndPickerValue}
                    />
                  </div>
                )}
              </button>
            </div>
          </div>
          <CommonButton
            isEnabled={isButtonEnabled && !isSubmitting}
            onClick={handleCreateSchedule}
            text={isSubmitting ? '등록 중...' : '완료'}
          />
          {touched && errorMessage && (
            <p className={cx('error-message')}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
