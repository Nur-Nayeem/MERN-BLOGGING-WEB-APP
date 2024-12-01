import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import { Toaster } from "react-hot-toast";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoStateMessage from "../components/nodata.component";
import Animationwrapper from "../common/page-animation";
import { ManagePublishedBlogsCard, ManageDraftBlogPost } from "../components/manage-blogcard.component";
import LoadMoreData from "../components/load-more.component";
import { useSearchParams } from "react-router-dom";

const ManageBlogs = () => {

    const [blogs, setBlogs] = useState(null);
    const [drafts, setDrafts] = useState(null);
    const [query, setQuery] = useState("");

    let activeTav = useSearchParams()[0].get("tab");

    let { userAuth: { access_token } } = useContext(UserContext);

    const getBlogs = ({ page, draft, deletedDocCount = 0 }) => {

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/user-written-blogs", {
            page, draft, query, deletedDocCount
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then(async ({ data }) => {

                let formatedData = await filterPaginationData({
                    state: draft ? drafts : blogs,
                    data: data.blogs, page,
                    user: access_token,
                    countRoute: "/user-written-blogs-count",
                    data_to_send: { draft, query }
                })

                console.log(formatedData);


                if (draft) {
                    setDrafts(formatedData)
                }
                else {
                    setBlogs(formatedData);
                }

            })
            .catch(err => {
                console.log(err);

            })

    }

    useEffect(() => {
        if (access_token) {
            if (blogs == null) {
                getBlogs({ page: 1, draft: false })
            }
            if (drafts == null) {
                getBlogs({ page: 1, draft: true })
            }
        }
    }, [access_token, blogs, drafts, query])

    const handleSearch = (e) => {
        let searchQuery = e.target.value;
        setQuery(searchQuery);

        if (e.keyCode == 13 && searchQuery.length) {
            setBlogs(null);
            setDrafts(null);
        }
    }

    const handleCjange = (e) => {
        if (!e.target.value.length) {
            setQuery("")
            setBlogs(null);
            setDrafts(null);
        }
    }

    return (
        <>
            <h1 className="max-md:hidden">Manage Blogs</h1>

            <Toaster />

            <div className="relative max-md:mt-5 md:mt-8 mb-10">
                <input
                    type="search"
                    className="w-full bg-grey p-4 pl-12 pr-6 rounder-full placeholder:text-dark-grey"
                    placeholder="Search Blogs"
                    onChange={handleCjange}
                    onKeyDown={handleSearch}
                />
                <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey "></i>

            </div>

            <InPageNavigation routes={["Published Blogs", "Drafts"]} defaultActiveIndex={activeTav != 'draft' ? 0 : 1}>

                {
                    //published blogs

                    blogs == null ? <Loader /> :
                        blogs.results.length ?
                            <>
                                {
                                    blogs.results.map((blog, i) => {
                                        return <Animationwrapper key={i} transition={{ delay: i * 0.04 }}>

                                            <ManagePublishedBlogsCard blog={{ ...blog, index: i, setStateFunc: setBlogs }} />

                                        </Animationwrapper>
                                    })

                                }

                                <LoadMoreData state={blogs} fetchDataFun={getBlogs} additionalParam={{ draft: false, deletedDocCount: blogs.deletedDocCount }} />


                            </>



                            :
                            <NoStateMessage message="No published blogs" />
                }

                {
                    //Draft blogs

                    drafts == null ? <Loader /> :
                        drafts.results.length ?
                            <>
                                {
                                    drafts.results.map((blog, i) => {
                                        return <Animationwrapper key={i} transition={{ delay: i * 0.04 }}>

                                            <ManageDraftBlogPost blog={{ ...blog, index: i, setStateFunc: setDrafts }} />

                                        </Animationwrapper>
                                    })
                                }

                                <LoadMoreData state={drafts} fetchDataFun={getBlogs} additionalParam={{ draft: true, deletedDocCount: drafts.deletedDocCount }} />

                            </>

                            :
                            <NoStateMessage message="No draft blogs" />
                }

            </InPageNavigation>

        </>
    )
}
export default ManageBlogs;