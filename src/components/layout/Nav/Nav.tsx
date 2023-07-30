import { Link, useNavigate } from "react-router-dom";
import { styled } from "styled-components";
import avatar from "../../../assets/img/avatar-icon.png";
{
}
interface NavProps {}

const Nav = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const goToLogin = () => {
    if (!userInfo) {
      alert("로그인을 해주세요");
      navigate("/login");
      // refreshUser();
      // window.location.reload();
    }
  };

  return (
    <NavContainer>
      <Container>
        <NavbarLogo>
          <Link to="/">
            {/* <img></img> */}
            Mind Oasis
          </Link>
        </NavbarLogo>
        <NavbarMenu>
          <li>
            <Link to="/content">목록</Link>
          </li>
          <li onClick={goToLogin}>
            <Link to="/postupload">새 글 쓰기</Link>
          </li>

          {userInfo ? (
            <li>
              <Link to="/mypage/updateprofile">
                <AvatarContainer>
                  {userInfo.photoURL ? (
                    <img src={userInfo.photoURL} alt="profile photo" />
                  ) : (
                    <BasicAvatarIcon />
                  )}
                </AvatarContainer>
              </Link>
            </li>
          ) : (
            <li>
              <Link to="/login">로그인</Link>
            </li>
          )}
        </NavbarMenu>
      </Container>
    </NavContainer>
  );
};

export default Nav;

const NavContainer = styled.div`
  /* width: 100vw; */
`;

const Container = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: auto;
  height: 4rem;
  padding: 0 6rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.borderGray};
`;

const NavbarLogo = styled.div`
  font-size: ${(props) => props.theme.fontSizes.xl};
  font-weight: 600;
`;

const NavbarMenu = styled.ul`
  display: flex;
  justify-content: space-between;
  height: inherit;
  /* background-color: red; */

  li {
    display: flex;
    align-items: center;
    font-size: 1rem;
    font-weight: 500;
    color: ${(props) => props.theme.colors.black};
    padding-left: 2rem;
    /* background-color: blue; */
  }
`;

const AvatarContainer = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;

  img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const BasicAvatarIcon = styled.img.attrs({
  src: avatar,
})`
  width: 2.5rem;
  height: 2.5rem;
  object-fit: cover;
  border-radius: 50%;
`;
