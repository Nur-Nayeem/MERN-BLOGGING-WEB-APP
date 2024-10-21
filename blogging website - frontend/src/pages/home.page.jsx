import axios from "axios";
import Animationwrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoStateMessage from "../components/nodata.component";
const HomePage = () => {

    let [blogs, setBlogs] = useState(null);
    let [trendingBlogs, setTrendingBlogs] = useState(null);
    let [pageState, setPageState] = useState("home");
    let categories = ["programming", "social media", "health", "technology", "marketing", "fruits", "travel", "nature"]


    const fetchLatestBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
            .then(({ data }) => {
                setBlogs(data.blogs);
            })
            .catch(err => {
                console.log(err);

            })
    }

    const fetchBlogsByCategory = () => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", { tag: pageState })
            .then(({ data }) => {
                setBlogs(data.blogs);
            })
            .catch(err => {
                console.log(err);

            })
    }

    const fetchTrandingBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
            .then(({ data }) => {
                setTrendingBlogs(data.blogs);
            })
            .catch(err => {
                console.log(err);

            })
    }

    const loadBlogByCategory = (e) => {
        let category = e.target.innerText.toLowerCase();

        setBlogs(null);

        if (pageState == category) {
            setPageState("home");
            return;
        }
        setPageState(category);

    }

    useEffect(() => {
        activeTabRef.current.click();

        if (pageState == "home") {
            fetchLatestBlogs();
        }
        else {
            fetchBlogsByCategory();
        }
        if (!trendingBlogs) {
            fetchTrandingBlogs();

        }
    }, [pageState]);

    return (
        <Animationwrapper>
            <section className="h-cover flex justify-center gap-10 ">
                {/* lattest blogs */}
                <div className="w-full">
                    <InPageNavigation routes={[pageState, "tranding blogs"]} defaultHidden={["tranding blogs"]}>

                        <>
                            {
                                blogs == null ? <Loader /> :
                                    (
                                        blogs.length ?
                                            blogs.map((blog, i) => {
                                                return <Animationwrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                                    <BlogPostCard content={blog} author={blog.author.personal_info} />
                                                </Animationwrapper>
                                            })
                                            :
                                            <NoStateMessage message="No Blog Published" />
                                    )
                            }
                        </>

                        {
                            trendingBlogs == null ? <Loader /> :
                                (
                                    trendingBlogs.length ?
                                        trendingBlogs.map((blog, i) => {
                                            return <Animationwrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                                <MinimalBlogPost blog={blog} index={i} />
                                            </Animationwrapper>
                                        })
                                        :
                                        <NoStateMessage message="No trending blogs" />
                                )

                        }

                    </InPageNavigation>
                </div>

                {/* filter and tranding blog */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>
                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return <button onClick={loadBlogByCategory} className={"tag" + (pageState == category ? " bg-black text-white " : " ")} key={i}>
                                            {category}
                                        </button>
                                    })
                                }


                            </div>

                        </div>


                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending <i className="fi fi-rr-arrow-trend-up"></i></h1>

                            {
                                trendingBlogs == null ? <Loader /> :
                                    (
                                        trendingBlogs.length ?
                                            trendingBlogs.map((blog, i) => {
                                                return <Animationwrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                                    <MinimalBlogPost blog={blog} index={i} />
                                                </Animationwrapper>
                                            })
                                            :
                                            <NoStateMessage message="No trending blogs" />
                                    )

                            }

                        </div>
                    </div>
                </div>

            </section>
        </Animationwrapper>
    )
}

export default HomePage;