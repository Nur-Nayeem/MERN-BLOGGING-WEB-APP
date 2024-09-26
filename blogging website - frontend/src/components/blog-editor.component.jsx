import { Link, useNavigate } from "react-router-dom";
import logo4 from "../imgs/logo4.png";
import Animationwrapper from "../common/page-animation";
import axios from "axios";
import defaultBannerfrom from "../imgs/blog banner.png";
import toast, { Toaster } from 'react-hot-toast';
import { useContext, useEffect, useRef, useState } from "react";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import { UserContext } from "../App";



const BlogEditor = () => {

    const [file, setFile] = useState(null);
    const [uploaded, setUploaded] = useState(false);
    const imgRef = useRef(null); // Reference for your img element

    let { blog, blog: { title, banner, content, tags, des }, setBlog, textEditor, setTextEditor, setEditorState } = useContext(EditorContext)


    let { userAuth: { access_token } } = useContext(UserContext);

    let navigate = useNavigate();

    console.log(blog);


    const handleUpload = (e) => {
        try {
            setFile(e.target.files[0]); // Setting the file state
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        const uploadFile = async () => {
            if (file && !uploaded) {
                try {
                    let loading = toast.loading("Uploading...")
                    // const url = UploadImg(file)
                    const data = new FormData();
                    data.append("my_file", file);
                    const res = await axios.post(
                        `${import.meta.env.VITE_SERVER_DOMAIN}/upload-img`,
                        data
                    );
                    let url = res.data.fileUrl;

                    toast.dismiss(loading);
                    toast.success("Uploaded 👍");

                    setBlog({ ...blog, banner: url })

                    setUploaded(true);

                } catch (error) {
                    console.error(error);
                    toast.dismiss(loading);
                    toast.error("Failed to upload file");
                }
            }
        };


        uploadFile(); // Call the async upload function
    }, [file]);


    const handleTitleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    }
    const handleTitleChange = (e) => {
        let input = e.target;
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';

        setBlog({ ...blog, title: input.value })

    }

    const handleError = (e) => {
        let img = e.target;
        img.src = defaultBannerfrom
    }

    useEffect(() => {
        if (textEditor.isReady) {
            setTextEditor(new EditorJS({
                holderId: "textEditor",
                data: content,
                tools: tools,
                placeholder: "Let's write an awesome story..."
            }))
        }

    }, [])

    const handlePublishEvent = () => {
        if (!banner.length) {
            return toast.error("Upload a blog banner to publish..")
        }
        if (!title.length) {
            return toast.error("Write blog title to publish..")
        }
        if (textEditor.isReady) {
            textEditor.save().then(data => {
                if (data.blocks.length) {
                    setBlog({ ...blog, content: data })
                    setEditorState("publish")
                }
                else {
                    return toast.error("Write something in your blog to publish")
                }

            }).catch((err) => {
                console.log(err);

            })
        }
    }

    const handleSaveDraft = (e) => {
        if (e.target.className.includes("disable")) {
            return;
        }
        if (!title.length) {
            return toast.error("whrite blog title before saving it as a draft");
        }

        let loadingToast = toast.loading('Saving Draft...');

        e.target.classList.add('disable');


        if (textEditor.isReady) {
            textEditor.save().then(content => {
                let blogObj = {
                    title, banner, des, content, tags, draft: true
                }

                axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", blogObj, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                }).then(() => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast);
                    toast.success("Saved 👍");

                    setTimeout(() => {
                        navigate("/");
                    }, 500);

                }).catch(({ response }) => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast);

                    return toast.error(response.data.error);
                })
            })
        }
    }

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-20">
                    <img src={logo4} alt="" />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1 w-full">
                    {title.length ? title : "New Blog"}

                </p>
                <div className="flex gap-4 ml-auto">
                    <button className="btn-blue py-2"
                        onClick={handlePublishEvent}
                    >Publish</button>
                    <button className="btn-light py-2"
                        onClick={handleSaveDraft}
                    >Save Draft</button>
                </div>

            </nav>
            <Animationwrapper>
                <section>
                    <Toaster />
                    <div className="mx-auto max-w[900px] w-full">
                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey ">
                            <label htmlFor="uploadBanner">
                                <img
                                    ref={imgRef} // Reference to 
                                    src={banner} // Preview the 
                                    className="z-20"
                                    onError={handleError}
                                    alt="Banner Preview"
                                />
                                <input
                                    id="uploadBanner"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleUpload}

                                />
                            </label>
                        </div>

                        <textarea
                            defaultValue={title}
                            placeholder="Blog Title"
                            className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                        >

                        </textarea>

                        <hr className="w-full opacity-10 my-5" />

                        <div id="textEditor" className="font-gelasio ">

                        </div>

                    </div>
                </section>
            </Animationwrapper>
        </>

    )
}
export default BlogEditor;