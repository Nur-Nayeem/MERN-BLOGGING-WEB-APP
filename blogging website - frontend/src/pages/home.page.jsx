import axios from "axios";
import Animationwrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";

const HomePage = () => {

    let [blogs, setBlogs] = useState(null);

    const fetchLatestBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
            .then(({ data }) => {
                setBlogs(data.blogs);
            })
            .catch(err => {
                console.log(err);

            })
    }

    useEffect(() => {
        fetchLatestBlogs();
    }, []);

    return (
        <Animationwrapper>
            <section className="h-cover flex justify-center gap-10 ">
                {/* lattest blogs */}
                <div className="w-full">
                    <InPageNavigation routes={["home", "tranding blogs"]} defaultHidden={["tranding blogs"]}>

                        <>
                            {
                                blogs == null ? <Loader /> :
                                    blogs.map((blog, i) => {
                                        return <Animationwrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info} />
                                        </Animationwrapper>
                                    })
                            }
                        </>

                        <h1>Tranding blogs here</h1>

                    </InPageNavigation>
                </div>

                {/* filter and tranding blog */}
                <div>

                </div>

            </section>
        </Animationwrapper>
    )
}

export default HomePage;