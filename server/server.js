import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin'
import serviceAccountKey from './auth_google_json/blogging-website-5b71a-firebase-adminsdk-atisa-75f2b24169.json' assert { type: "json" }
import { getAuth } from 'firebase-admin/auth'

//schema below
import User from './Schema/User.js';


const server = express();
let PORT = 3002;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
})

const formateDataSend = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    }
}

const generateUsername = async (email) => {
    let username = email.split('@')[0];
    let isUsernameNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result)
    isUsernameNotUnique ? username += nanoid().substring(0, 5) : "";

    return username;
}


server.post("/signup", (req, res) => {

    let { fullname, email, password } = req.body;

    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Full name must be at least 3 characters" })
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" });
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "The email is invalid" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 character long with a number, 1 lowercase, 1 upercase" })
    }
    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email);
        let user = new User({
            personal_info: {
                fullname, email, password: hashed_password,
                username,
            }
        })

        user.save().then((u) => {
            return res.status(200).json(formateDataSend(u))
        })
            .catch((err) => {

                if (err.code == 11000) {
                    return res.status(403).json({ "error": "Email already exists" });
                }

                return res.status(500).json({ "error": err.message })
            })



    })

})

server.post('/signin', (req, res) => {
    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": "Email not found" })

            }

            if (!user.google_auth) {
                bcrypt.compare(password, user.personal_info.password, (err, result) => {
                    if (err) {
                        return res.status(403).json({ "error": "Error occured while login plese try again" })
                    }
                    if (!result) {
                        return res.status(403).json({ "error": "Incorrect password" })
                    }
                    else {
                        return res.status(200).json(formateDataSend(user))
                    }
                })
            } else {
                return res.status(403).json({ "error": "Account was created using google. Try logging in with google" });
            }



        }).catch((err) => {
            console.log(err.message);
            return res.status(500).json({ "error": err.message })

        })
})

server.post('/google-auth', async (req, res) => {
    let { access_token } = req.body;
    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUder) => {
            let { email, name, picture } = decodedUder;

            picture = picture.replace("s96-c", "s384-c");

            let user = await User.findOne({ "personal_info.email": email }).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
                return u || null;
            }).catch((err) => {
                return res.status(500).json({ "error": err.message });
            })

            if (user) { // login
                if (!user.google_auth) {
                    return res.status(403).json({ "error": "This email was signed up without google. Please log in with password to access the account" });
                }
            }
            else { //sign up
                let username = await generateUsername(email)

                user = new User({
                    personal_info: { fullname: name, email, username },
                    google_auth: true
                })
                await user.save().then((u) => {
                    user = u;
                })
                    .catch((err) => {
                        return res.status(500).json({ "error": err.message });
                    })
            }
            return res.status(200).json(formateDataSend(user))
        }).catch((err) => {
            return res.status(500).json({ "error": "fail to authenticate you with google. Try with another google account" });
        });

})

server.listen(PORT, () => {
    console.log(`Lisening on port ${PORT}`);
})