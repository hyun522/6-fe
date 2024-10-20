import React from 'react';
import { cookies } from 'next/headers';
import Header from '@/components/common/Header';
import classNames from 'classnames/bind';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // 리다이렉트를 위한 모듈
import { getFetchFeedDetail, getFetchUser } from '@/app/api/api';
import { FaTrashAlt } from 'react-icons/fa';
import styles from './mainId.module.scss';
import CommentSection from './CommentSection';
import LikeButton from './LikeButton';
import CommentLikeButton from './CommentLikeButton';

const cx = classNames.bind(styles);

export default async function FeedDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const cookieStore = cookies();
  const token = cookieStore.get('JWT')?.value;

  const submitComment = async (formData: FormData) => {
    'use server';

    const comment = formData.get('comment') as string;
    // 닉네임 업데이트 요청
    const response = await fetch(
      `http://13.209.88.22:8080/api/v1/comment/${id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include the Authorization header
          accept: '*/*', // This matches the curl command's accept header
        },
        body: comment, // nickname을 JSON으로 변환하여 전달
      },
    );

    if (!response.ok) {
      throw new Error('댓글 추가에 실패 했습니다');
    }

    // 성공 시, /로 리다이렉트
    revalidatePath(`/main/${id}`);
  };

  const deleteComment = async (formData: FormData) => {
    'use server';

    const commentId = formData.get('commentId') as string;

    const response = await fetch(
      `http://13.209.88.22:8080/api/v1/comment/${commentId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      },
    );

    if (!response.ok) {
      throw new Error('댓글 삭제에 실패 했습니다');
    }

    // 성공 시, 페이지를 다시 로드
    revalidatePath(`/main/${id}`);
  };
  // 토큰이 없으면 /signin 페이지로 리다이렉트
  if (!token) {
    redirect('/signin');
  }

  try {
    // 초기 피드 데이터 가져오기
    const FeedData = await getFetchFeedDetail({
      id,
      token,
    });

    const UserData = await getFetchUser({
      token,
    });

    // 리다이렉트 응답일 경우 처리
    if (!FeedData) {
      redirect('/signin');
    }

    // console.log('initialFeedData:', FeedData);
    // console.log('UserData', UserData);
    return (
      <>
        <Header user={UserData} isShowButton isShowProfile>
          트립테리어
        </Header>
        <div className={cx('feed-container')}>
          <div className={cx('feed-post')}>
            <div className={cx('profile')}>
              <Image
                className={cx('big-avatar')}
                src={FeedData.profileImage}
                alt="avatar"
                width={50}
                height={50}
              />
              <div className={cx('profile-info')}>
                <div className={cx('user-name')}>{FeedData.nickname}</div>
                <div className={cx('location')}>{FeedData.place}</div>
              </div>
              <div className={cx('date')}>{FeedData.createDate}</div>
            </div>
            <h2 className={cx('title')}>{FeedData.title}</h2>
            <p className={cx('text-content')}>{FeedData.content}</p>
            <div className={cx('image-container')}>
              {FeedData.imageList.map((image: string) => (
                <Image
                  key={image}
                  src={`http://13.209.88.22:8080/api/v1/image/${image}`}
                  alt={`이미지 ${image}`}
                  className={cx('image')}
                  width={150}
                  height={150}
                />
              ))}
            </div>
            <div className={cx('actions')}>
              <LikeButton
                feedId={FeedData.id}
                initialIsLiked={FeedData.isLiked}
                initialLikeCnt={FeedData.likeCnt}
                userNickName={UserData.nickName}
                FeedNickName={FeedData.nickname}
              />
              <Image
                src="/svgs/main-comment.svg"
                alt="comment"
                width={15}
                height={15}
              />
              {FeedData.commentList?.length || 0}
            </div>
          </div>
          <div className={cx('comment-section')}>
            {FeedData.commentList.map((comment: any) => (
              <div className={cx('comment')} key={comment.id}>
                <div className={cx('comment-container')}>
                  <div className={cx('avatar')}>
                    <Image
                      src={comment.profileImage}
                      alt={`${comment.nickname}의 아바타`}
                      width={25}
                      height={25}
                      className={cx('img')}
                    />
                  </div>
                  <div className={cx('content')}>
                    <div className={cx('username-title-box')}>
                      <div className={cx('username')}>{comment.nickname}</div>
                      <div className={cx('date')}>{comment.createdAt}</div>
                    </div>
                    <div className={cx('text')}>{comment.comment}</div>
                  </div>
                </div>
                <div className={cx('buttons')}>
                  {comment.nickname === UserData.nickName && (
                    <form action={deleteComment} method="post">
                      <input
                        type="hidden"
                        name="commentId"
                        value={comment.id}
                      />
                      <button type="submit" className={cx('delete-button')}>
                        <FaTrashAlt />
                      </button>
                    </form>
                  )}
                  <CommentLikeButton
                    commentId={comment.id}
                    initialIsLiked={comment.isLiked}
                    initialLikeCnt={comment.likeCnt}
                    token={token}
                    userNickName={UserData.nickName}
                    CommentNickName={comment.nickname}
                  />
                </div>
              </div>
            ))}
            <div className={cx('comment')}>
              <div className={cx('avatar')}>
                <Image
                  src={UserData.profileImage}
                  alt="avatar"
                  width={35}
                  height={35}
                  className={cx('avatar')}
                />
              </div>
              {/* <input className={cx('add-comment')} placeholder="댓글추가" /> */}
              <CommentSection
                submitComment={submitComment} // submitComment 함수 전달
              />
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    // redirect('/signin');
  }
}
