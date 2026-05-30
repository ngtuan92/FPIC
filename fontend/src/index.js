import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Accessory from "./Accessory";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ManageAccount from "./components/ManageAccount";
import Layout from "./Layout";
import AdminHomePage from "./components/AdminHomePage";
import MicrochipList from "./components/MicrochipList";
import WeakPoint from "./components/WeakPoint";
import BlockDiagram from "./components/BlockDiagram";
import MainBoard from "./components/MainBoard";
import { AuthProvider } from "./context/AuthContext";
import Identification from "./components/Identification";
import ListIdentificationResult from "./components/ListIdentificationResult";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />}></Route>

          <Route
            path="/page/:currentPage"
            element={
              <Layout>
                <Accessory />
              </Layout>
            }
          ></Route>

          <Route path="/login" element={<Login />}></Route>

          <Route
            path="/identification"
            element={
              <Layout>
                <Identification />
              </Layout>
            }
          ></Route>
          <Route
            path="/dashboard"
            element={
              <Layout>
                <AdminHomePage />
              </Layout>
            }
          ></Route>
          <Route
            path="/admin/manager-account/:type"
            element={
              <Layout>
                <ManageAccount />
              </Layout>
            }
          ></Route>
          <Route
            path="/microchip"
            element={
              <Layout>
                <MicrochipList />
              </Layout>
            }
          ></Route>
          <Route
            path="/weak-point"
            element={
              <Layout>
                <WeakPoint />
              </Layout>
            }
          ></Route>
          <Route
            path="/block-diagram"
            element={
              <Layout>
                <BlockDiagram />
              </Layout>
            }
          ></Route>
          <Route
            path="/main-board"
            element={
              <Layout>
                <MainBoard />
              </Layout>
            }
          ></Route>
          <Route
            path="/reviewed-product-catalog"
            element={
              <Layout>
                <ListIdentificationResult />
              </Layout>
            }
          ></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
