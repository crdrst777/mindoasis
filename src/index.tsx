import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GlobalStyles from "./style/GlobalStyle";
import { ThemeProvider } from "styled-components";
import theme from "./style/Theme";
import { Provider } from "react-redux";
import store from "./store";
import firebaseApp from "./fbase";

// console.log("firebaseApp", firebaseApp);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <App />
    </ThemeProvider>
  </Provider>
  // </React.StrictMode>
);
