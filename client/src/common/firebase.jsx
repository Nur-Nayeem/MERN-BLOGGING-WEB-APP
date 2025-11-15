////google authentication using firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
const firebaseConfig = {
    apiKey: "AIzaSyDqqZLJCwrtK_dRXN-1r4ULgLg9rGL-rNA",
    authDomain: "blogging-website-5b71a.firebaseapp.com",
    projectId: "blogging-website-5b71a",
    storageBucket: "blogging-website-5b71a.appspot.com",
    messagingSenderId: "183813347975",
    appId: "1:183813347975:web:f9527674a3e6c38af33622"
};


const app = initializeApp(firebaseConfig);

//google auth

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {
    let user = null;
    await signInWithPopup(auth, provider)
        .then((result) => {
            user = result.user;
        })
        .catch((err) => {
            console.log(err);

        })
    return user;
}