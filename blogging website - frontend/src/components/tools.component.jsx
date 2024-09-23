//import tools
import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Link from "@editorjs/link";
import { UploadImg } from "../common/cloudinary";

const uploadImageByFile = (e) => {
    return UploadImg(e).then(url => {
        if (url) {
            return {
                success: 1,
                file: { url }
            }
        }
    })


}

const uploadImageByUrl = (e) => {
    let link = new Promise((resolve, reject) => {
        try {
            resolve(e)
        } catch (error) {
            reject(error)
        }
    })
    return link.then(url => {
        return {
            success: 1,
            file: { url }
        }
    })
}

export const tools = {
    embed: Embed,
    link: Link,
    list: {
        class: List,
        inlineToolbar: true
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByUrl,
                uploadByFile: uploadImageByFile,
            }
        }
    },
    header: {
        class: Header,
        config: {
            placeholder: "Type Heading...",
            levels: [2, 3],
            defaultLevel: 2
        }
    },
    quote: {
        class: Quote,
        inlineToolbar: true
    },
    marker: Marker,
    inlineCode: InlineCode,
}