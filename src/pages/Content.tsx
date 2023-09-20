import { useEffect, useState } from "react";
import { dbService } from "../fbase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { PostType } from "../types/types";
import { styled } from "styled-components";
import { PathMatch, useLocation, useMatch } from "react-router-dom";
import Modal from "../components/UI/Modal";
import PreviewPost from "../components/Post/PreviewPost";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { getUserData } from "../api/user";
import Category from "../components/UI/Category";
import Pagination from "../components/UI/Pagination";
import { setPlaceKeywordReducer } from "../store/checkedListSlice";
import { setSearchedPostsReducer } from "../store/searchedPostsSlice";

const Content = () => {
  const dispatch = useDispatch();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  // useMatch()의 인자로 url을 넘기면 해당 url과 일치할 경우 url의 정보를 반환하고, 일치하지 않을 경우 null을 반환한다.
  const bigMatch: PathMatch<string> | null = useMatch(`content/:id`);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [userData, setUserData] = useState<any>({}); // userInfo의 userId를 통해 얻은 userData
  const [isAllPostBtnClicked, setIsAllPostBtnClicked] = useState(false); // '전체' 버튼 클릭 여부
  const { isLiked } = useSelector((state: RootState) => state.isLiked);
  const { searchedPosts } = useSelector(
    (state: RootState) => state.searchedPosts
  ); // 검색한 결과값

  // category
  const [matchingPosts, setMatchingPosts] = useState<PostType[]>([]); // 클릭한 카테고리에 해당되는 게시물들이 들어가는 배열
  const [isUnmatched, setIsUnmatched] = useState(false); // 클릭한 카테고리에 해당되는 게시물이 없는지 여부
  const checkedList: string[] = useSelector(
    (state: RootState) => state.category.checkedList
  );
  const isChecked: boolean = useSelector(
    (state: RootState) => state.category.isChecked
  );
  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(12);
  const lastPostIdx = currentPage * postsPerPage;
  const firstPostIdx = lastPostIdx - postsPerPage;
  const currentPosts = matchingPosts.slice(firstPostIdx, lastPostIdx);

  // const getPosts = async () => {
  //   // const q = query(collection(dbService, "posts"));
  //   const dbPosts = await getDocs(collection(dbService, "posts"));
  //   dbPosts.forEach((doc) => {
  //     const postObj = {
  //       ...doc.data(),
  //       id: doc.id,
  //     };
  //     setPosts((prev) => [postObj, ...prev]);
  //     console.log("postObj", postObj);
  //   });
  // };

  const getPosts = () => {
    // query 함수를 사용하면서 여기에 인자로 orderBy 함수 등을 사용. dbService의 컬렉션 중 "posts" Docs에서 찾음
    const q = query(
      collection(dbService, "posts"),
      orderBy("createdAt", "desc") // document를 글을 쓴 순서대로 차례대로 내림차순으로 정렬하기
    );
    // 실시간으로 문서 업데이트 가져오기 (onSnapshot) - 사용자가 새로고침을 하지 않고도 데이터 변경이 실시간으로 반영된다.
    onSnapshot(q, (querySnapshot) => {
      const postsArr: PostType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsArr);
    });
  };

  useEffect(() => {
    getPosts();
    dispatch(setPlaceKeywordReducer([]));
  }, []); // []를 주면 처음 한번 실행되는거지만, 여기서는 한번 구독하고 그후에는 Firebase의 데이터로 자동으로 업데이트되는것임.

  useEffect(() => {
    if (searchedPosts.length > 0) {
      setMatchingPosts(searchedPosts);
      setIsAllPostBtnClicked(false);
    } else {
      setMatchingPosts(posts);
      setIsUnmatched(false);
    }
  }, [posts]);

  useEffect(() => {
    if (userInfo) {
      getUserData(userInfo.uid, setUserData); // 리턴값 -> setUserData(userDocSnap.data());
    }
  }, [isLiked]);

  // 카테고리 처음 클릭
  // 전체 post 중에 내가 클릭한 카테고리와 일치하는 post가 있는지 조회 -> 일치하는 경우 postsArr배열에 post를 추가함
  const matchingSeq1 = (
    postsArr: PostType[] // []
  ) => {
    for (let post of posts) {
      const result = post.placeKeyword.filter(
        (item) => item === checkedList[0]
      );
      if (result.length === 1) {
        console.log("seq1: result", result);
        postsArr.push(post);
        setIsUnmatched(false);
      }
    }
    return postsArr;
  };

  // 카테고리가 2개 이상 클릭되있는 경우 (카테고리가 2개 클릭되있는 경우에 n -> 0 , 1)
  const matchingSeq2 = (
    n: number, // index // 빼는 경우엔 1
    postsArr: PostType[], // []
    matchingPosts: PostType[] // temp = [...matchingPosts]
  ) => {
    // seq1에서 한 setMatchingPosts가 갱신이 안되어 값을(7개(자연)) 제대로 받아오지 못하고있음
    console.log("seq2: matchingPosts", matchingPosts);

    postsArr = [];

    // 일치하는 게시물이 있는 경우
    // 이전에 추려진 값들을 갖고있는 matchingPosts에서 더 추려내는 작업
    if (checkedList.length > 1) {
      // matchingPosts 중에 내가 클릭한 카테고리와 일치하는 post가 있는지 조회
      for (let matchingPost of matchingPosts) {
        const result = matchingPost.placeKeyword.filter(
          (item) => item === checkedList[n] // 마지막으로 추가된 요소와 비교
        );
        console.log("seq2: result", result);
        // 일치하는 경우 postsArr배열에 추가함
        if (result.length === 1) {
          postsArr.push(matchingPost);
          setIsUnmatched(false);
        }
      }
      console.log("seq2: postsArr", postsArr);

      // 일치하는 게시물이 없는 경우 - 위의 작업 후, 일치하지 않으면 여전히 빈[]임
      if (postsArr.length === 0) {
        console.log("일치하는 게시물이 없습니다");
        setIsUnmatched(true);
      }
    }
    return postsArr;
  };

  const getMatchingPosts = () => {
    let postsArr: PostType[] = [];
    let temp = [...matchingPosts];

    // 2. 클릭했던 걸 해제. 빼는 경우
    if (!isChecked) {
      console.log("뺐음");
      // 추가할때 했던 동작을 반복
      // seq1->seq2

      // matchingSeq1의 리턴값을 가져온다.
      let resultPostsArr = matchingSeq1(postsArr);

      temp = [...resultPostsArr];

      // 반복문 돌면서 temp 값을 계속 바꿔줘서 이전에 추려진 matchingPosts를 계속 가져올 수 있음
      for (let i = 1; i < checkedList.length; i++) {
        temp = matchingSeq2(i, postsArr, temp); // checkedList[1]부터 조회
      }
      postsArr = temp;

      // 1. 버튼 클릭해서 카테고리를 추가하는 경우
    } else {
      // 1-1. 첫번째 추가 - matchingSeq1 실행
      if (checkedList.length === 1) {
        postsArr = matchingSeq1(postsArr);
        console.log("seq1: postsArr", postsArr);
      } else if (checkedList.length > 1) {
        // 1-2. 두번째 추가부터 - matchingSeq2 실행
        postsArr = matchingSeq2(checkedList.length - 1, postsArr, temp);
      }
    }
    setMatchingPosts(postsArr);
  };

  const AllPostBtnClick = () => {
    setMatchingPosts([...posts]);
    setIsAllPostBtnClicked(true);
    setIsUnmatched(false);
    dispatch(setSearchedPostsReducer([]));
  };

  // 카테고리를 클릭할떼
  useEffect(() => {
    getMatchingPosts();
    setCurrentPage(1);

    if (checkedList.length > 0) {
      setIsAllPostBtnClicked(false);
    } else {
      if (searchedPosts.length > 0) {
        setMatchingPosts([...searchedPosts]);
        setIsAllPostBtnClicked(false);
      } else {
        setMatchingPosts([...posts]);
        setIsAllPostBtnClicked(true);
      }
    }
  }, [checkedList]);

  console.log("matchingPosts.length", matchingPosts.length);
  // console.log("checkedList", checkedList);
  console.log("searchedPosts", searchedPosts);

  return (
    <Container>
      <CategoryContainer>
        <AllPostBtn
          onClick={AllPostBtnClick}
          $isallpostbtnclicked={isAllPostBtnClicked}
        >
          전체
        </AllPostBtn>
        <Category isAllPostBtnClicked={isAllPostBtnClicked} />
      </CategoryContainer>

      <ContentContainer>
        {isUnmatched ? (
          <AlertText>일치하는 게시물이 없습니다.</AlertText>
        ) : (
          <PreviewContainer>
            {currentPosts &&
              currentPosts.map((post) => (
                <PreviewPost key={post.id} post={post} />
              ))}
          </PreviewContainer>
        )}
      </ContentContainer>

      <Pagination
        totalPosts={matchingPosts.length}
        postsPerPage={postsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      {bigMatch ? (
        <Modal userData={userData} postId={bigMatch?.params.id}></Modal>
      ) : null}
    </Container>
  );
};

export default Content;

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 3rem 7.3rem 6rem 7.3rem;
`;

const CategoryContainer = styled.section`
  margin: 0 auto;
  margin-bottom: 3rem;
  width: 40rem;
  height: 3rem;
  display: flex;
  justify-content: space-between;
`;

const AllPostBtn = styled.button<{ $isallpostbtnclicked: boolean }>`
  padding: 0.6rem 1rem 0.54rem 1rem;
  margin-top: 0.42rem;
  margin-right: 1rem;
  width: 3.7rem;
  height: 2.17rem;
  cursor: pointer;
  border-radius: 2rem;
  transition: background-color 0.2s ease;
  background-color: ${(props) =>
    props.$isallpostbtnclicked ? "#ffe787" : props.theme.colors.lightGray};
  font-size: 0.85rem;
  font-weight: 500;
  color: ${(props) =>
    props.$isallpostbtnclicked
      ? props.theme.colors.black
      : props.theme.colors.black};
`;

const ContentContainer = styled.section`
  width: 100%;
  height: 100%;
  margin-bottom: 1.2rem;
`;

const AlertText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 11.2rem;
  font-size: 1.1rem;
  font-weight: 400;
`;

const PreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(auto-fill, 15.3rem);
  column-gap: 1.5rem;
  row-gap: 1.5rem;
  margin-bottom: 0.5rem;
`;