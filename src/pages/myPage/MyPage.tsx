import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, storageService } from "../../fbase";
import { updateProfile } from "firebase/auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { styled } from "styled-components";
import MyPostList from "../../components/MyPage/MyPostList/MyPostList";

interface MyPageProps {
  userObj: any | null;
  refreshUser: () => any;
}

const MyPage = ({ userObj, refreshUser }: MyPageProps) => {
  const navigate = useNavigate();
  const [attachment, setAttachment] = useState<any>("");
  const fileInput = useRef<HTMLInputElement>(null); // 기본값으로 null을 줘야함
  const [newDisplayName, setNewDisplayName] = useState<string>(
    userObj.displayName
  );

  const onLogOutClick = async () => {
    await authService.signOut();
    navigate("/");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let photoUrl: string = "";

    if (attachment) {
      const attachmentRef = ref(storageService, `${userObj.uid}/${uuidv4()}`); // 파일 경로 참조 생성
      await uploadString(attachmentRef, attachment, "data_url"); // 파일 업로드(이 경우는 url)
      await getDownloadURL(attachmentRef)
        .then((url) => {
          console.log("url", url);
          photoUrl = url;
        })
        .catch((err) => {
          console.log(err);
        });
    }
    // 업데이트 - input창에 뭐라도 쓴 경우
    if (userObj.displayName !== newDisplayName) {
      await updateProfile(authService.currentUser!, {
        displayName: newDisplayName,
        photoURL: photoUrl,
      });
    }
    // 업데이트 - input창이 비어있거나 그대로인(파일만 올린) 경우
    if (newDisplayName === "" || newDisplayName === userObj.displayName) {
      await updateProfile(authService.currentUser!, {
        displayName: userObj.displayName,
        photoURL: photoUrl,
      });
    }
    refreshUser();
    setAttachment(""); //파일 미리보기 img src 비워주기
    fileInput.current!.value = "";
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDisplayName(e.currentTarget.value);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const theFile = e.currentTarget.files![0];
    console.log(theFile);
    const reader = new FileReader();
    reader.onloadend = (finishedEvent) => {
      console.log("finishedEvent", finishedEvent);
      setAttachment(reader.result);
    }; // 파일을 다 읽으면 finishedEvent를 받는다.
    reader.readAsDataURL(theFile); // 그 다음 데이터를 얻는다.
  };

  const onClearAttachment = () => {
    setAttachment("");
    fileInput.current!.value = ""; // 사진을 선택했다가 clear를 눌렀을때, 선택된 파일명을 지워줌.
  };

  const onDeleteClick = async () => {
    await updateProfile(authService.currentUser!, {
      displayName: newDisplayName,
      photoURL: "",
    });
    refreshUser();
  };

  return (
    <Container>
      <button onClick={onDeleteClick}>Delete Avatar</button>

      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={newDisplayName}
          onChange={onChange}
          placeholder="Display name"
        />
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          ref={fileInput}
        />
        <input type="submit" value="Update Profile" />
        {attachment && (
          <>
            <img src={attachment} width="50px" height="50px" alt="preview" />
            <button onClick={onClearAttachment}>Clear</button>
          </>
        )}
      </form>

      <button onClick={onLogOutClick}>Log Out</button>

      <Space />
      <MyPostList userObj={userObj} />
    </Container>
  );
};

export default MyPage;

const Container = styled.div``;

const Space = styled.div`
  height: 5rem;
`;
