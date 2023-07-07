import { BrowserRouter, Routes, Route } from "react-router-dom";
import { authService } from "./fbase";
import { useEffect, useState } from "react";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import MyPage from "./pages/myPage/MyPage";
import SignUp from "./pages/auth/SignUp";
import Nav from "./components/Layout/Nav";
import Content from "./pages/content/Content";
// import Footer from "./components/Layout/Footer";
import { updateProfile } from "firebase/auth";

function App() {
  const [init, setInit] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userObj, setUserObj] = useState<any | null>(null);

  useEffect(() => {
    authService.onAuthStateChanged(async (user) => {
      // 여기서 받아오는 user는 authService.currentUser 와 같음. 이걸 userObj에 넣어준다.
      if (user) {
        setIsLoggedIn(true);

        // 새 유저가 로그인할때마다 userObj에 저장.
        // 내가 원하는 firebase의 특정 부분만을 가져와서 리액트한테 주기.
        setUserObj({
          displayName: user.displayName,
          uid: user.uid,
          photoURL: user.photoURL,
        });

        // 어째선지 Social Login을 했을때는 displayName이 존재하지만, Local Login을 했을때는 displayName이 null이다. 그래서 아래 코드를 씀.
        if (user.displayName === null) {
          const userName = user.email!.split("@")[0];
          await updateProfile(user, { displayName: userName });
        }
      } else {
        setIsLoggedIn(false);
      }
      setInit(true); // init이 false라면 router를 숨길거임. true일때 나타나게.
    });
  }, []);

  // user를 새로고침하는 기능. firebase의 정보를 가지고 리액트를 업데이트 해주기. 그래야 유저 이름 수정했을때 nav의 유저 이름도 자동으로 바뀜.
  const refreshUser = () => {
    // setUserObj(authService.currentUser);
    // 위와 같이 하면 authService.currentUser가 너무 큰 obj라 리액트가 어떤 부분이 바뀌었는지 판단하기 어려워서 setUserObj() 이 코드가 실행 안됨. -> 아래처럼 쪼개준다.
    const user = authService.currentUser;
    setUserObj({
      displayName: user!.displayName,
      uid: user!.uid,
      photoURL: user!.photoURL,
    });
    // setUserObj(Object.assign({}, user));
  };

  console.log("currentUser", authService.currentUser);
  console.log("isLoggedIn", isLoggedIn);
  console.log("userObj", userObj);

  return (
    <BrowserRouter>
      {init ? (
        <>
          {isLoggedIn && <Nav userObj={userObj} />}
          {/* isLoggedIn이 true면 <Nav/>가 나오도록 */}
          <Routes>
            {isLoggedIn ? (
              <>
                <Route path="/" element={<Home />} />
                <Route
                  path="/mypage"
                  element={
                    <MyPage userObj={userObj} refreshUser={refreshUser} />
                  }
                />
              </>
            ) : (
              <Route path="/" element={<Login />} />
            )}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/content" element={<Content userObj={userObj} />} />
          </Routes>
          {/* <Footer /> */}
        </>
      ) : (
        "Initializing..."
      )}
    </BrowserRouter>
  );
}

export default App;
