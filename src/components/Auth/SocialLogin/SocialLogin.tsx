import React from "react";
import { authService } from "../../../fbase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

const SocialLogin = () => {
  const onSocialClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const name = e.currentTarget.name;
    let provider;
    if (name === "google") {
      provider = new GoogleAuthProvider();
    } else if (name === "github") {
      provider = new GithubAuthProvider();
    }
    if (provider) {
      const data = await signInWithPopup(authService, provider);
      console.log("signInWithPopupData", data);
    }
  };

  return (
    <div>
      <button name="google" onClick={onSocialClick}>
        구글 로그인
      </button>
    </div>
  );
};

export default SocialLogin;
