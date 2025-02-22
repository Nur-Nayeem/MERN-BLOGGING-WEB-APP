import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { FacebookShareButton, WhatsappShareButton, TwitterShareButton, FacebookIcon, TwitterIcon, WhatsappIcon, XIcon } from "react-share";


const BlogInteraction = () => {
    let { blog, blog: { _id, title, blog_id, activity, activity: { total_likes, total_comments }, author: {
        personal_info: { username: author_username }
    } }, setBlog, isLikedByuser, setIsLikedByuser, setCommentWrapper } = useContext(BlogContext);

    let { userAuth: { username, access_token } } = useContext(UserContext);

    const shareUrl = window.location.href;
    // const shareUrl = "https://bloggerthoughts.netlify.app";

    useEffect(() => {
        if (access_token) {
            //make request to server to liked information
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user", { _id }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
                .then(({ data: { result } }) => {
                    setIsLikedByuser(Boolean(result))

                })
                .catch(err => {
                    console.log(err);

                })
        }
    }, [])

    const handleLike = () => {
        if (access_token) {
            //like the blog
            setIsLikedByuser(preVal => !preVal);

            !isLikedByuser ? total_likes++ : total_likes--;

            setBlog({ ...blog, activity: { ...activity, total_likes } })
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/like-blog", { _id, isLikedByuser }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
                .then(({ data }) => {
                    console.log(data);

                })
                .catch(err => {
                    console.log(err);

                })

        }
        else {
            //not logged in
            toast.error("please login to like this blog");
        }
    }

    return (
        <>
            <Toaster />
            <hr className="border-grey my-2" />

            <div className="flex gap-6 justify-between">
                <div className="flex gap-3 items-center">
                    <button
                        onClick={handleLike}
                        className={"w-10 h-10 rounded-full flex items-center justify-center " + (isLikedByuser ? "bg-red/20 text-red" : "bg-grey/80")}>
                        <i className={"fi " + (isLikedByuser ? "fi-sr-heart" : "fi-rr-heart")}></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>

                    <button
                        onClick={() => setCommentWrapper(perVal => !perVal)}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                        <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>
                <div className="flex gap-6 items-center">

                    {
                        username == author_username ?
                            <Link to={`/editor/${blog_id}`} className="underline hover:text-purple">Edit</Link> : ""
                    }
                    <div>
                        <FacebookShareButton url={shareUrl} className="mr-3">
                            <FacebookIcon size={30} round={true} />
                        </FacebookShareButton >
                        <WhatsappShareButton url={shareUrl} className="mr-3">
                            <WhatsappIcon size={30} round={true} />
                        </WhatsappShareButton>
                        <TwitterShareButton url={shareUrl} className="mr-3">
                            <XIcon size={30} round={true} />
                        </TwitterShareButton>
                    </div>

                    {/* <Link to={`https://x.com/intent/post?text=Read ${title}&url=${location.href} `}><i className="fi fi-brands-twitter text-xl hover:text-twitter"></i></Link> */}
                </div>
            </div>

            <hr className="border-grey my-2" />

        </>
    )
}
export default BlogInteraction;