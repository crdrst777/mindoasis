import { styled } from "styled-components";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { dbService, storageService } from "../../fbase";
import { PostType } from "../../types/types";
import { setPlaceInfo } from "../../store/placeInfoSlice";
import MapSection from "../../components/Map/MapSection";
import CheckBox from "../../components/UI/CheckBox";
import { createBrowserHistory } from "history";
import { usePrompt } from "../../hooks/useBlocker";
import imageCompression from "browser-image-compression";

const EditPost = () => {
  const history = createBrowserHistory();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  // DetailsDropdown.tsx에서 받아온 (location.state) 파라미터 취득
  const state = location.state as { post: PostType; postId: string };
  const post = state.post;
  const postId = state.postId;

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  // const [title, setTitle] = useState(post.placeInfo.placeAddr);
  const [title, setTitle] = useState("");
  const [text, setText] = useState(post.text);
  // const [attachment, setAttachment] = useState<any>(post.attachmentUrl);
  const fileInput = useRef<HTMLInputElement>(null); // 기본값으로 null을 줘야함
  const { placeInfo } = useSelector((state: RootState) => state.placeInfo);
  const { placeKeyword } = useSelector(
    (state: RootState) => state.placeKeyword
  );
  const [imageUpload, setImageUpload] = useState({});
  const [uploadPreview, setUploadPreview] = useState<string>(
    post.attachmentUrl
  );

  const [when, setWhen] = useState(true);
  console.log("test", when);
  usePrompt("현재 페이지를 벗어나시겠습니까?", when);

  // 뒤로가기를 할 경우
  useEffect(() => {
    history.listen((location) => {
      if (history.action === "POP") {
        dispatch(
          setPlaceInfo({
            placeName: "",
            placeAddr: "",
          })
        );
      }
    });
  }, []);

  const uploadData = (data: PostType) => {
    const postDocRef = doc(dbService, "posts", `${postId}`);
    updateDoc(postDocRef, { ...data });
    alert("등록 완료");
    setWhen((prev) => !prev);

    setTitle("");
    setText("");
    setUploadPreview(""); // 파일 미리보기 img src 비워주기
    fileInput.current!.value = "";
    dispatch(
      setPlaceInfo({
        placeName: "",
        placeAddr: "",
      })
    );
  };

  // submit 할때마다 document를 생성
  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let attachmentUrl: string = "";

    // 다른 파일을 새로 첨부하지 않고 기존 파일 그대로 업데이트 할 경우
    if (uploadPreview === post.attachmentUrl) {
      attachmentUrl = uploadPreview;

      console.log(
        "다른 파일을 새로 첨부하지 않고 기존 파일 그대로 업데이트 할 경우"
      );
    }
    // 다른 파일을 새로 첨부하는 경우
    else if (imageUpload !== null) {
      const attachmentRef = ref(storageService, `${userInfo.uid}/${uuidv4()}`); // 파일 경로 참조 생성
      // "https://firebasestorage.googleapis.com/v0/b/mind-oasis-66b9e.appspot.com/o/u1D7yAHTq4fOAXeIThoewbT9vYS2%2F070dbc05-c5be-4117-b944-99d620db1201?alt=media&token=ef68906f-49e7-44da-a42d-146caee97d2f"
      // ref정보가 data_url(format)으로 uploadPreview(value)에 담겨 upload 되도록 함
      const response = await uploadString(
        attachmentRef,
        uploadPreview,
        "data_url"
      ); // 파일 업로드(이 경우는 url)
      attachmentUrl = await getDownloadURL(response.ref);
      // 기존 파일을 스토리지에서 삭제
      const postUrlRef = ref(storageService, post.attachmentUrl);
      await deleteObject(postUrlRef);
    }

    const blankPattern = /^\s+|\s+$/g; //공백만 입력된 경우

    if (placeInfo.placeAddr === "") {
      alert("지도에서 위치를 선택해주세요");
    } else if (text.replace(blankPattern, "") === "" || text === "") {
      alert("내용을 입력해주세요");
    } else if (imageUpload === null) {
      alert("사진을 선택해주세요");
    } else if (placeKeyword.length === 0) {
      alert("키워드를 선택해주세요");

      //  title인풋에 공백만 있거나 값이 없는 경우엔 장소이름을 넣어준다.
    } else if (title.replace(blankPattern, "") === "" || title === "") {
      const postObj: PostType = {
        title: placeInfo.placeAddr,
        text: text,
        createdAt: Date.now(),
        creatorId: userInfo.uid,
        attachmentUrl,
        placeInfo,
        placeKeyword,
        likedUsers: [],
        likeState: false,
      };
      await uploadData(postObj);
    } else {
      const postObj: PostType = {
        title: title,
        text: text,
        createdAt: Date.now(),
        creatorId: userInfo.uid,
        attachmentUrl,
        placeInfo,
        placeKeyword,
        likedUsers: [],
        likeState: false,
      };
      await uploadData(postObj);
    }
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.currentTarget.value);
  };

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // 이미지 리사이즈(압축) 함수
  const handleImageCompress = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let file = e.currentTarget?.files[0];

    const options = {
      maxSizeMB: 0.5, // 이미지 최대 용량
      // maxWidthOrHeight: 1920, // 최대 넓이(혹은 높이)
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setImageUpload(compressedFile);

      const promise = imageCompression.getDataUrlFromFile(compressedFile);
      promise.then((result) => {
        setUploadPreview(result);
      });
    } catch (err) {
      console.log(err);
    }
  };

  // 파일을 첨부한 상태에서 clear 버튼을 누르는 경우
  const onClearAttachment = () => {
    setUploadPreview("");
    setImageUpload(null);
    // 선택된 파일명을 지워줌
    fileInput.current!.value = "";
  };

  // 취소 버튼 클릭
  const onCancelClick = () => {
    navigate(`/content`);
  };

  useEffect(() => {
    if (when === false) {
      navigate(`/content`);
    }
  }, [when]);

  return (
    <Container>
      <EditPostContainer>
        <MapContainer>
          <SectionTitle>
            <span>1</span>
            <h2>지도에서 장소를 선택해주세요</h2>
          </SectionTitle>
          <MapSection placeAddr={post.placeInfo.placeAddr} />
        </MapContainer>

        <WriteContainer>
          <SectionTitle>
            <span>2</span>
            <h2>장소에 대해 알려주세요</h2>
          </SectionTitle>
          <SubTitle>제목</SubTitle>
          <TitleInput
            type="text"
            value={title}
            onChange={onTitleChange}
            maxLength={70}
            placeholder={placeInfo.placeAddr}
          />

          <TextInput
            maxLength={500}
            value={text}
            onChange={onTextChange}
            placeholder="자유롭게 장소에 대해 적어주세요!"
          />
        </WriteContainer>

        <FileContainer>
          <SectionTitle>
            <span>3</span>
            <h2>사진을 공유해주세요</h2>
          </SectionTitle>
          <FileInput
            type="file"
            accept="image/*"
            onChange={handleImageCompress}
            ref={fileInput}
          />

          <img src={uploadPreview} width="50px" height="50px" alt="preview" />
          <button onClick={onClearAttachment}>Clear</button>
        </FileContainer>

        <CheckBoxContainer>
          <SectionTitle>
            <span>4</span>
            <h2>키워드를 선택해주세요</h2>
          </SectionTitle>
          <CheckBox checkedListArr={post.placeKeyword} />
        </CheckBoxContainer>

        <BtnContainer>
          <CancelBtn onClick={onCancelClick}>취소</CancelBtn>
          <PostBtn onClick={onSubmit}>등록</PostBtn>
        </BtnContainer>
      </EditPostContainer>
    </Container>
  );
};

export default EditPost;

const Container = styled.div`
  display: flex;
  justify-content: center;
  width: 38.7rem;
  margin: 2.8rem auto;
`;

const EditPostContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const MapContainer = styled.section`
  margin-top: 0.45rem;
  width: 100%;
  margin-bottom: 2rem;
`;

const WriteContainer = styled.section`
  margin-top: 3.3rem;
  width: 100%;
  margin-bottom: 1.7rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  padding: 0.7rem;
  margin-bottom: 1.85rem;
  border-bottom: 3px solid ${(props) => props.theme.colors.lightGray};

  span {
    margin-right: 0.5rem;
    width: 1.6rem;
    height: 1.6rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: ${(props) => props.theme.colors.yellow};
    font-size: 0.95rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.white};
  }

  h2 {
    font-size: 1.43rem;
    font-weight: 640;
  }
`;

const SubTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 5px;
  color: ${(props) => props.theme.colors.darkGray};
`;

const TitleInput = styled.input`
  width: 100%;
  height: 3.3rem;
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.moreDarkGray};
  padding: 0 1.2rem;
  margin-bottom: 0.8rem;
  border-radius: 5px;
  border: ${(props) => props.theme.borders.gray};
  &:hover {
    outline: 1px solid #c9c9c9;
  }
  &:focus {
    outline: 1.8px solid ${(props) => props.theme.colors.yellow};
  }
`;

const TextInput = styled.textarea`
  width: 100%;
  height: 9.3rem;
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.moreDarkGray};
  padding: 1.1rem 1.2rem;
  border-radius: 5px;
  border: ${(props) => props.theme.borders.gray};
  line-height: 1.5rem;
  word-spacing: -0.3rem;
  resize: none;
  &:hover {
    outline: 1px solid #c9c9c9;
  }
  &:focus {
    outline: 1.8px solid ${(props) => props.theme.colors.yellow};
  }
`;

const FileContainer = styled.section`
  margin-top: 3.5rem;
  width: 100%;
  margin-bottom: 1.7rem;
`;

const FileInput = styled.input`
  width: 100%;
  height: 5rem;
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.moreDarkGray};
  padding: 0 1.2rem;
  border-radius: 5px;
  border: ${(props) => props.theme.borders.gray};
  cursor: pointer;
`;

const CheckBoxContainer = styled.section`
  margin-top: 3.5rem;
  width: 100%;
  margin-bottom: 1.7rem;
`;

const BtnContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const CancelBtn = styled.button`
  height: 2rem;
  color: black;
  background-color: ${(props) => props.theme.colors.lightGray};
  border-radius: 4px;
  margin: 0 0.5rem;
  padding: 0 1.25rem;
  font-size: 0.9rem;
  font-weight: 400;

  @media ${(props) => props.theme.mobile} {
    /* width: 5rem;
    height: 2rem; */
  }
`;
const PostBtn = styled(CancelBtn)`
  color: ${(props) => props.theme.colors.white};
  background-color: ${(props) => props.theme.colors.lightBlack};
  font-weight: 500;
  &:hover {
    background-color: ${(props) => props.theme.colors.darkGray};
  }
`;