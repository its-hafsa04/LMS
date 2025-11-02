import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn } from "../auth/authSlice";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // make sure we send cookies and have a sane default
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URI || "http://localhost:8000/api/v1",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    refreshToken: builder.query({
      query: () => ({
        // server route is /refresh
        url: "refresh",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    loadUser: builder.query({
      query: () => ({
        // server route is /me
        url: "me",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data?.accessToken,
              user: result.data?.user,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
  }),
});

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;