"use server"

import { auth } from "@/lib/auth"; //import the auth client

import { headers } from "next/headers"
// import { auth } from "@/lib/auth" // Auth từ Express server

export async function getSession() {
  const response = await fetch("http://localhost:8080/auth/get-session", {
    headers: {
      cookie: (await headers()).get("cookie") || "",
    },
  })

  return response.json()
}

// const { data, error } = await auth.signUp.email({
//   email, // user email address
//   password, // user password -> min 8 characters by default
//   name, // user display name
//   image, // User image URL (optional)
//   callbackURL: "/dashboard" // A URL to redirect to after the user verifies their email (optional)
// }, {
//   onRequest: (ctx) => {
//     //show loading
//   },
//   onSuccess: (ctx) => {
//     //redirect to the dashboard or sign in page
//   },
//   onError: (ctx) => {
//     // display the error message
//     alert(ctx.error.message);
//   },
// });
//
// const { data, error } = await authClient.signIn.email({
//   /**
//    * The user email
//    */
//   email,
//   /**
//    * The user password
//    */
//   password,
//   /**
//    * A URL to redirect to after the user verifies their email (optional)
//    */
//   callbackURL: "/dashboard",
//   /**
//    * remember the user session after the browser is closed.
//    * @default true
//    */
//   rememberMe: false
// }, {
//   //callbacks
// })

// import { authClient } from "@/lib/auth-client"; //import the auth client
//
// await authClient.signIn.social({
//   /**
//    * The social provider ID
//    * @example "github", "google", "apple"
//    */
//   provider: "github",
//   /**
//    * A URL to redirect after the user authenticates with the provider
//    * @default "/"
//    */
//   callbackURL: "/dashboard",
//   /**
//    * A URL to redirect if an error occurs during the sign in process
//    */
//   errorCallbackURL: "/error",
//   /**
//    * A URL to redirect if the user is newly registered
//    */
//   newUserCallbackURL: "/welcome",
//   /**
//    * disable the automatic redirect to the provider.
//    * @default false
//    */
//   disableRedirect: true,
// });
