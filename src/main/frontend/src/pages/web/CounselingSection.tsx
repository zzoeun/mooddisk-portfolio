// import { useState, useEffect } from 'react';
// import { CounselingEntry, CounselingCreateData, CommentCreateData } from "@mooddisk/types/domain/counseling";
// import { CounselingList } from '../../components/features/counseling/CounselingList';
// import { CounselingWrite } from '../../components/features/counseling/CounselingWrite';
// import { CounselingDetail } from '../../components/features/counseling/CounselingDetail';
// import { CounselingHeader } from '../../components/features/counseling/CounselingHeader';
// import { CounselingFilters } from '../../components/features/counseling/CounselingFilters';
// import { 
//   useCounselingData, 
//   useCounselingActions, 
//   useCounselingView,
//   useErrorHandler
// } from '@mooddisk/hooks';
// import { ErrorModal } from '../../components/common/modals/ErrorModal';

// interface CounselingSectionProps {
//   onWritingModeChange?: (isWriting: boolean) => void;
//   onBackFromWriting?: () => void;
//   onHeaderSubmit?: () => void;
//   onTitleChange?: (title: string) => void;
//   onDetailModeChange?: (isDetail: boolean) => void;
//   isSubmitting?: boolean;
//   setIsSubmitting?: (submitting: boolean) => void;
//   shouldGoBack?: boolean;
//   setShouldGoBack?: (shouldGoBack: boolean) => void;
//   shouldSubmit?: boolean;
//   setShouldSubmit?: (shouldSubmit: boolean) => void;
// }

// export default function CounselingSection({ 
//   onWritingModeChange,
//   onBackFromWriting,
//   onHeaderSubmit,
//   onTitleChange,
//   onDetailModeChange,
//   isSubmitting,
//   setIsSubmitting,
//   shouldGoBack,
//   setShouldGoBack,
//   shouldSubmit,
//   setShouldSubmit
// }: CounselingSectionProps) {
//   const [selectedCategory, setSelectedCategory] = useState('ALL');
//   const [searchTerm, setSearchTerm] = useState('');

//   // 고민 작성 관련 상태
//   const [newPost, setNewPost] = useState({
//     category: 'SELF',
//     title: '',
//     content: '',
//     author: '익명'
//   });

//   // 댓글 작성 관련 상태
//   const [newComment, setNewComment] = useState({
//     content: '',
//     author: '익명'
//   });

//   // 게시물 수정 모드 상태
//   const [isEditingPost, setIsEditingPost] = useState(false);
//   const [editingPost, setEditingPost] = useState<CounselingEntry | null>(null);

//   // 커스텀 훅 사용
//   const {
//     posts,
//     loading,
//     loadingMore,
//     hasNext,
//     fetchCounselings,
//     fetchCounselingDetail,
//     loadMorePosts,
//     setError
//   } = useCounselingData();

//   const { errorMessage, showErrorModal, handleError, clearError } = useErrorHandler();

//   const {
//     submitCounseling,
//     submitComment,
//     handleLikeCounseling,
//     handleLikeComment,
//     handleEditPost,
//     handleDeletePost,
//     handleEditComment,
//     handleDeleteComment
//   } = useCounselingActions({
//     onSuccess: () => {
//       // 성공 시 목록 새로고침
//       fetchCounselings(selectedCategory === 'ALL' ? undefined : selectedCategory, searchTerm);
//     },
//     onError: (errorMessage: string) => {
//       setError(errorMessage);
//     }
//   });

//   const {
//     view,
//     selectedPost,
//     setSelectedPost,
//     handleBack,
//     handleBackFromWriting,
//     goToDetail,
//     goToWrite,
//     goToList
//   } = useCounselingView({
//     onWritingModeChange,
//     onDetailModeChange,
//     onTitleChange,
//     onBackFromWriting
//   });

//   // 게시물 수정 핸들러
//   const handleEditPostClick = () => {
//     if (selectedPost) {
//       setEditingPost(selectedPost);
//       setIsEditingPost(true);
//     }
//   };

//   // 게시물 수정 취소 핸들러
//   const handleCancelEditPost = () => {
//     setIsEditingPost(false);
//     setEditingPost(null);
//   };

//   // 게시물 수정 저장 핸들러
//   const handleSaveEditPost = async (updatedPost: CounselingCreateData) => {
//     if (editingPost && handleEditPost) {
//       try {
//         await handleEditPost(editingPost.id, updatedPost);
//         setIsEditingPost(false);
//         setEditingPost(null);
//         // 상세보기 새로고침
//         if (selectedPost) {
//           const refreshedPost = await fetchCounselingDetail(selectedPost.id);
//           if (refreshedPost) {
//             setSelectedPost(refreshedPost);
//           }
//         }
//       } catch (error) {
//         handleError(error);
//       }
//     }
//   };

//   // 게시물 삭제 핸들러
//   const handleDeletePostClick = async () => {
//     if (selectedPost && handleDeletePost) {
//       if (window.confirm('정말로 이 고민글을 삭제하시겠습니까?')) {
//         try {
//           await handleDeletePost(selectedPost.id);
//           // 목록으로 돌아가기
//           goToList();
//         } catch (error) {
//           handleError(error);
//         }
//       }
//     }
//   };

//   // 댓글 수정 핸들러
//   const handleEditCommentClick = async (commentId: string, content: string) => {
//     if (handleEditComment) {
//       try {
//         await handleEditComment(commentId, content);
//         // 상세보기 새로고침
//         if (selectedPost) {
//           const refreshedPost = await fetchCounselingDetail(selectedPost.id);
//           if (refreshedPost) {
//             setSelectedPost(refreshedPost);
//           }
//         }
//       } catch (error) {
//         handleError(error);
//       }
//     }
//   };

//   // 댓글 삭제 핸들러
//   const handleDeleteCommentClick = async (commentId: string) => {
//     if (handleDeleteComment) {
//       if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
//         try {
//           await handleDeleteComment(commentId);
//           // 상세보기 새로고침
//           if (selectedPost) {
//             const refreshedPost = await fetchCounselingDetail(selectedPost.id);
//             if (refreshedPost) {
//               setSelectedPost(refreshedPost);
//             }
//           }
//         } catch (error) {
//           handleError(error);
//         }
//       }
//     }
//   };

//   // 현재 사용자가 게시글 작성자인지 확인 (임시로 true 반환)
//   const isCurrentUserPostAuthor = selectedPost ? true : false; // 실제로는 사용자 ID 비교 필요

//   // 초기 데이터 로드
//   useEffect(() => {
//     fetchCounselings();
//   }, []); // fetchCounselings 의존성 제거

//   // 필터링된 게시물 (페이지네이션 리셋)
//   useEffect(() => {
//     fetchCounselings(selectedCategory === 'ALL' ? undefined : selectedCategory, searchTerm);
//   }, [selectedCategory, searchTerm]); // fetchCounselings 의존성 제거

//   // shouldSubmit이 true일 때 고민 등록을 실행
//   useEffect(() => {
//     if (shouldSubmit) {
//       handleSubmitPost();
//       setShouldSubmit?.(false);
//     }
//   }, [shouldSubmit, setShouldSubmit]);

//   // shouldGoBack이 true일 때 상세보기 모드 해제
//   useEffect(() => {
//     if (shouldGoBack) {
//       // useCounselingView의 handleBack 함수를 직접 호출하여 view 상태 변경
//       if (view === 'detail') {
//         handleBack();
//       } else if (view === 'write') {
//         handleBackFromWriting();
//       }
//       setShouldGoBack?.(false);
//     }
//   }, [shouldGoBack, setShouldGoBack, view, handleBack, handleBackFromWriting]);

//   const handleSubmitPost = () => {
//     if (newPost.title.trim() && newPost.content.trim()) {
//       const data: CounselingCreateData = {
//         category: newPost.category,
//         title: newPost.title,
//         content: newPost.content,
//         author: newPost.author || '익명'
//       };
//       submitCounseling(data);
//       setNewPost({ category: 'SELF', title: '', content: '', author: '익명' });
//       goToList();
//     }
//   };

//   const handleSubmitComment = () => {
//     if (newComment.content.trim() && selectedPost) {
//       const data: CommentCreateData = {
//         content: newComment.content,
//         author: '📀 익명이'
//       };
//       submitComment(selectedPost.id, data);
//       setNewComment({ content: '', author: '📀 익명이' });
      
//       // 댓글 등록 후 상세 정보 새로고침
//       fetchCounselingDetail(selectedPost.id).then((post: CounselingEntry | null) => {
//         if (post) {
//           setSelectedPost(post);
//         }
//       });
//     }
//   };

//   const handlePostClick = async (post: CounselingEntry) => {
//     try {
//       const detailedPost = await fetchCounselingDetail(post.id);
//       if (detailedPost) {
//         goToDetail(detailedPost);
//       } else {
//         console.error('❌ 상세 정보를 가져올 수 없음');
//       }
//     } catch (error) {
//       console.error('❌ handlePostClick 에러:', error);
//       handleError(error);
//     }
//   };

//   const toggleLike = (postId: string) => {
//     handleLikeCounseling(postId);
//   };

//   const toggleCommentLike = (commentId: string) => {
//     handleLikeComment(commentId);
//     if (selectedPost) {
//       fetchCounselingDetail(selectedPost.id).then((post: CounselingEntry | null) => {
//         if (post) {
//           setSelectedPost(post);
//         }
//       });
//     }
//   };

//   if (view === 'detail') {
//     return (
//       <>
//         <CounselingDetail
//           post={selectedPost}
//           loading={loading}
//           newComment={newComment}
//           setNewComment={setNewComment}
//           onSubmitComment={handleSubmitComment}
//           onLikePost={() => selectedPost && toggleLike(selectedPost.id)}
//           onLikeComment={toggleCommentLike}
//           onEditPost={handleEditPostClick}
//           onDeletePost={handleDeletePostClick}
//           onEditComment={handleEditCommentClick}
//           onDeleteComment={handleDeleteCommentClick}
//           isPostAuthor={isCurrentUserPostAuthor}
//           onBack={handleBack}
//         />
//         <ErrorModal
//           isOpen={showErrorModal}
//           onClose={clearError}
//           message={errorMessage}
//         />
//       </>
//     );
//   }

//   if (view === 'write') {
//     return (
//       <>
//         <CounselingWrite
//           newPost={newPost}
//           setNewPost={setNewPost}
//           loading={loading}
//           onSubmit={handleSubmitPost}
//           onBack={handleBackFromWriting}
//         />
//         <ErrorModal
//           isOpen={showErrorModal}
//           onClose={clearError}
//           message={errorMessage}
//         />
//       </>
//     );
//   }

//   return (
//     <>
//       <div className="pb-20 min-h-screen">
//         <CounselingHeader
//           selectedCategory={selectedCategory}
//           onCategoryChange={setSelectedCategory}
//           searchTerm={searchTerm}
//           onSearchChange={setSearchTerm}
//         />
        
//         <CounselingFilters
//           posts={posts}
//           selectedCategory={selectedCategory}
//           searchTerm={searchTerm}
//         >
//           {(filteredPosts) => (
//             <div className="px-4 pt-3">
//               <CounselingList
//                 posts={filteredPosts}
//                 loading={loading}
//                 loadingMore={loadingMore}
//                 onPostClick={handlePostClick}
//                 onLoadMore={() => loadMorePosts(selectedCategory, searchTerm)}
//               />
//             </div>
//           )}
//         </CounselingFilters>
//       </div>
      
//       <ErrorModal
//         isOpen={showErrorModal}
//         onClose={clearError}
//         message={errorMessage}
//       />
//     </>
//   );
// }