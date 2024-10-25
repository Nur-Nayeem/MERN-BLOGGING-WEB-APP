////alternative of aws for image upload
import axios from "axios";
export const UploadImg = async (file) => {
    let url = null;
    if (file) {
        const data = new FormData();
        data.append("my_file", file);
        const res = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/upload-img`,
            data
        );
        url = res.data.fileUrl;

    }

    return url;
}