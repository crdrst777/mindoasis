import React from "react";
import { styled } from "styled-components";

const Home = () => {
  return <Container></Container>;
};

export default Home;

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: ${(props) => props.theme.colors.backgroundGray};
`;
