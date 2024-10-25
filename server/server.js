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
import multer from 'multer';
import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary';


dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_sectret: process.env.API_KEY_SECRET
})




//schema below
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';


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



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


server.post("/upload-img", upload.single("my_file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const cloudinaryUploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (uploadError, cloudinaryResult) => {
                if (uploadError) {
                    return res.status(500).json({
                        success: false,
                        message: "File upload failed",
                        error: uploadError.message,
                    });
                }
                res.json({
                    success: true,
                    message: "File uploaded successfully",
                    fileUrl: cloudinaryResult.secure_url,
                    public_id: cloudinaryResult.public_id,
                });

            }
        );

        cloudinaryUploadStream.end(req.file.buffer);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "File upload failed",
            error: error.message,
        });
    }
});

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).json({ "error": "No access token" });
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Access token is invalid" })
        }

        req.user = user.id
        next()
    })
}

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
//get blog
server.post("/latest-blogs", (req, res) => {

    let { page } = req.body;

    let maxLimit = 5;

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id ")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})
//filterPagination
server.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })

        })
})

//tranding blogs
server.get("/trending-blogs", (req, res) => {
    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id ")
        .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
        .select("blog_id title publishedAt -_id")
        .limit(5)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })

})

//category wais filter blogs

server.post("/search-blogs", (req, res) => {

    let { tag, query, author, page } = req.body;
    let findQuery;
    if (tag) {
        findQuery = { tags: tag, draft: false };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    } else if (author) {
        findQuery = { author, draft: false };
    }
    let maxLimit = 2;

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id ")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })

})

server.post("/search-blogs-count", (req, res) => {
    let { tag, author, query } = req.body;
    let findQuery;
    if (tag) {
        findQuery = { tags: tag, draft: false };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') }
    } else if (author) {
        findQuery = { author, draft: false };
    }
    Blog.countDocuments(findQuery)
        .then(count => {
            return res.status(200).json({ totalDocs: count })

        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message })

        })

})

//search users
server.post("/search-users", (req, res) => {
    let { query } = req.body;
    User.find({ "personal_info.username": new RegExp(query, 'i') })
        .limit(50)
        .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
        .then(users => {
            return res.status(200).json({ users })

        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

//user profile

server.post("/get-profile", (req, res) => {
    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updatedAt -blogs")
        .then(user => {
            return res.status(200).json(user)
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ error: err.message })

        })
})


//create a new user
server.post('/create-blog', verifyJWT, (req, res) => {
    let authorId = req.user;

    let { title, des, banner, tags, content, draft } = req.body;


    if (!title.length) {
        return res.status(403).json({ error: "You must provide a title" });

    }

    if (!draft) {
        if (!des.length || des.length > 200) {
            return res.status(403).json({ error: "You must provide blog description under 200 characrer" });
        }
        if (!banner.length) {
            return res.status(403).json({ error: "You must provide blog banner to publish it" });

        }
        if (!content.blocks.length) {
            return res.status(403).json({ error: "You must provide blog content to publish it" });

        }
        if (!tags.length || tags.length > 5) {
            return res.status(403).json({ error: "Provide tags in order to publish the blog, maximum 5" });
        }
    }




    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();

    let blog = new Blog({
        title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft),
    })

    blog.save().then(blog => {
        let incrementVal = draft ? 0 : 1;

        User.findOneAndUpdate({ _id: authorId }, { $inc: { "account_info.total_posts": incrementVal }, $push: { "blogs": blog._id } }).then(user => {
            return res.status(200).json({ id: blog.blog_id })
        }).catch(err => {
            return res.status(500).json({ error: "Fail to update total posts number " })
        })

    }).catch(err => {
        return res.status(500).json({ error: err.message })
    })


})

server.listen(PORT, () => {
    console.log(`Lisening on port ${PORT}`);
})