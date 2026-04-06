// frontend/src/store/root-reducer.js
import { combineReducers } from "@reduxjs/toolkit";
import { authReducer as auth } from "./slices/auth";
import { userReducer as user } from "./slices/user";
import { postReducer as post } from "./slices/post";

export const reducers = {
  auth,
  user,
  post,
};

export const rootReducer = combineReducers(reducers);

