import { Link, useNavigate, useParams } from "react-router-dom";
import logo4 from "../imgs/logo4.png";
import Animationwrapper from "../common/page-animation";
import axios from "axios";
import defaultBannerfrom from "../imgs/blog banner.png";
import toast, { Toaster } from "react-hot-toast";
import { useContext, useEffect, useRef, useState } from "react";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import { UserContext } from "../App";

const BlogEditor = () => {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const editorInstance = useRef(null);

  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  let { blog_id } = useParams();

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let navigate = useNavigate();

  /* -------------------- Handle Banner Selection -------------------- */
  const handleUpload = (e) => {
    try {
      const imgFile = e.target.files[0];

      if (imgFile) {
        setFile(imgFile);
        const url = URL.createObjectURL(imgFile);
        setPreviewImg(url);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  /* -------------------- Upload File Function -------------------- */
  const uploadFile = async () => {
    if (file && !uploaded) {
      const loading = toast.loading("Uploading...");

      try {
        const data = new FormData();
        data.append("my_file", file);

        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/upload-img`,
          data
        );

        const url = res.data.fileUrl;

        toast.dismiss(loading);
        toast.success("Uploaded 👍");

        setUploaded(true);

        // Correct function-style state update
        setBlog((prev) => ({ ...prev, banner: url }));

        return url;
      } catch (error) {
        console.error(error);
        toast.dismiss(loading);
        toast.error("Failed to upload file");
        return null;
      }
    }

    return banner; // Return existing banner if no upload necessary
  };

  const handleTitleChange = (e) => {
    const input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    setBlog((prev) => ({ ...prev, title: input.value }));
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) e.preventDefault();
  };

  /* -------------------- Initialize EditorJS -------------------- */
  useEffect(() => {
    if (editorInstance.current) return;

    let editorData = content;

    if (Array.isArray(content)) editorData = content[0] || { blocks: [] };

    if (!editorData || typeof editorData !== "object") {
      editorData = { blocks: [] };
    }

    const editor = new EditorJS({
      holderId: "textEditor",
      data: editorData,
      tools: tools,
      placeholder: "Let's write an awesome story...",
    });

    editorInstance.current = editor;
    setTextEditor(editor);

    return () => {
      if (editorInstance.current?.destroy) {
        editorInstance.current.destroy();
      }
      editorInstance.current = null;
    };
  }, []);

  /* -------------------- HANDLE PUBLISH -------------------- */
  const handlePublishEvent = async () => {
    if (!banner && !file) {
      return toast.error("Upload a blog banner to publish..");
    }

    if (!title.length) {
      return toast.error("Write blog title to publish..");
    }

    let finalBanner = banner;

    // Upload if necessary
    if (file && !uploaded) {
      const uploadedUrl = await uploadFile();
      if (uploadedUrl) finalBanner = uploadedUrl;
    }

    if (!editorInstance.current) {
      return toast.error("Editor is not ready, please wait...");
    }

    try {
      const data = await editorInstance.current.save();

      if (!data.blocks.length) {
        return toast.error("Write something in your blog to publish");
      }

      const updatedBlog = {
        ...blog,
        banner: finalBanner,
        content: data,
      };

      setBlog(updatedBlog);

      setTimeout(() => {
        setEditorState("publish");
      }, 0);
    } catch (err) {
      console.log(err);
      toast.error("Error saving content");
    }
  };

  /* -------------------- HANDLE SAVE DRAFT -------------------- */
  const handleSaveDraft = async (e) => {
    if (e.target.className.includes("disable")) return;

    if (!title.length) {
      return toast.error("Write blog title before saving draft");
    }

    const loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");

    let finalBannerUrl = banner;

    // Upload banner file if needed
    if (file && !uploaded) {
      const uploadedUrl = await uploadFile();
      if (uploadedUrl) finalBannerUrl = uploadedUrl;
    }

    if (editorInstance.current) {
      editorInstance.current.save().then((content) => {
        let blogObj = {
          title,
          banner: finalBannerUrl,
          des,
          content,
          tags,
          draft: true,
        };

        axios
          .post(
            import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
            { ...blogObj, id: blog_id },
            { headers: { Authorization: `Bearer ${access_token}` } }
          )
          .then(() => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.success("Saved 👍");

            setTimeout(() => {
              navigate("/dashboard/blogs?tab=draft");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.error(response.data.error);
          });
      });
    }
  };

  return (
    <>
      <style>
        {`
          #textEditor .ce-block__content,
          #textEditor .ce-toolbar__content {
            max-width: 100% !important;
            margin: 0 !important;
          }
          #textEditor .codex-editor__redactor {
            padding-bottom: 0 !important;
          }
        `}
      </style>

      <nav className="navbar">
        <Link to="/" className="flex-none w-20">
          <img src={logo4} alt="" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-blue py-2" onClick={handlePublishEvent}>
            Publish
          </button>

          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>

      <Animationwrapper>
        <section>
          <Toaster />

          <div className="mx-auto max-w[900px] w-full">
            <div className="flex gap-10 flex-col sm:flex-row">
              {/* Banner Image */}
              <div
                className="relative aspect-video hover:opacity-80 bg-white 
                border-4 border-grey flex-1"
              >
                <label htmlFor="uploadBanner">
                  <img
                    src={previewImg || banner || defaultBannerfrom}
                    alt="Banner Preview"
                    onError={(e) => (e.currentTarget.src = defaultBannerfrom)}
                    className="z-20"
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

              {/* Title */}
              <textarea
                value={title}
                placeholder="Blog Title"
                className="text-3xl font-medium w-full h-20 outline-none 
                  resize-none mt-10 leading-tight placeholder:opacity-40 flex-1"
                onKeyDown={handleTitleKeyDown}
                onChange={handleTitleChange}
              ></textarea>
            </div>

            <hr className="w-full opacity-10 my-5" />

            {/* EditorJS */}
            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </Animationwrapper>
    </>
  );
};

export default BlogEditor;
