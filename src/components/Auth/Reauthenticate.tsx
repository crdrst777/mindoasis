import { styled } from "styled-components";
import { authService } from "../../fbase";
import {
  EmailAuthProvider,
  User,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { PasswordSchema } from "./ValidationSchemas";
import Validations from "./Validation";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface Props {
  inputLabel: string;
  btnText: string;
  setIsReauthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const Reauthenticate = ({
  inputLabel,
  btnText,
  setIsReauthenticated,
}: Props) => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(PasswordSchema),
    mode: "onChange",
  });

  // 소셜 로그인 여부 체크
  useEffect(() => {
    const user = authService.currentUser;
    if (user.providerData[0].providerId === "google.com") {
      alert("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
      navigate(-1);
    }
  }, []);

  const userRecertification = async (email: string, password: string) => {
    const user = authService.currentUser as User;
    const authCredential = EmailAuthProvider.credential(email, password);

    let bool;
    await reauthenticateWithCredential(user, authCredential)
      .then(() => {
        bool = true;
      })
      .catch((error) => {
        console.log(error);
        bool = false;
      });
    return bool;
  };

  const onSubmit = async (inputData: any) => {
    const result = await userRecertification(
      userInfo.email,
      inputData.password
    );

    // 재인증 여부에 따른 setState()
    if (result) {
      setIsReauthenticated(true);
    } else {
      setIsReauthenticated(false);
      alert("유효하지 않은 비밀번호입니다. 다시 입력해주세요.");
    }
  };

  const onError = (error: any) => {
    console.log(error);
  };

  return (
    <>
      <UpdateForm onSubmit={handleSubmit(onSubmit, onError)}>
        <InputBlock>
          <InputLabel>{inputLabel}</InputLabel>
          <NewPasswordInput
            type="password"
            placeholder="유저 인증을 위해 비밀번호를 입력해주세요."
            {...register("password")}
          />
          {errors.password && <Validations value={errors.password.message} />}
        </InputBlock>

        <BtnContainer>
          <SubmitBtn type="submit">{btnText}</SubmitBtn>
        </BtnContainer>
      </UpdateForm>
    </>
  );
};

export default Reauthenticate;

const UpdateForm = styled.form`
  width: 18rem;
`;

const InputBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
`;

const InputLabel = styled.label`
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.315rem;
  color: ${(props) => props.theme.colors.darkGray};
`;

const NewPasswordInput = styled.input`
  height: 3rem;
  font-size: 0.97rem;
  color: ${(props) => props.theme.colors.moreDarkGray};
  padding: 0 0.8rem;
  border-radius: 6px;
  border: ${(props) => props.theme.borders.lightGray};
  &::placeholder {
    color: ${(props) => props.theme.colors.gray1};
    font-size: 0.9rem;
  }
  &:hover {
    outline: 1px solid #d3d3d3;
  }
  &:focus {
    border: 1px solid ${(props) => props.theme.colors.darkYellow};
    outline: 1px solid ${(props) => props.theme.colors.darkYellow};
  }
`;

const BtnContainer = styled.div`
  margin: 1.6rem 0;
`;

const SubmitBtn = styled.button`
  width: 100%;
  height: 3rem;
  color: ${(props) => props.theme.colors.white};
  background-color: ${(props) => props.theme.colors.lightBlack};
  border-radius: 6px;
  padding: 0.1rem 0 0 0;
  font-size: 0.92rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${(props) => props.theme.colors.darkGray};
  }

  @media ${(props) => props.theme.mobile} {
    /* width: 15rem;
    height: 3rem; */
  }
`;
