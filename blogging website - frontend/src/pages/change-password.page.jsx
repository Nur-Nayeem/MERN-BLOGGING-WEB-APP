import { useRef } from "react";
import Animationwrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import toast, { Toaster } from "react-hot-toast"

const ChangePassword = () => {

    let changePasswordForm = useRef();

    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password



    const handleSubmit = (e) => {
        e.preventDefault();
        let form = new FormData(changePasswordForm.current);
        let formData = {};

        for (let [key, value] of form.entries()) {
            formData[key] = value;
        }

        let { currentPassword, newPassword } = formData;

        if (!currentPassword.length || !newPassword.length) {
            return toast.error("Fill all the inputs");
        }
        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
            return toast.error("Password should be 6 to 20 character long with a number, 1 lowercase, 1 upercase")
        }

    }

    return (
        <Animationwrapper>
            <Toaster />
            <form ref={changePasswordForm}>
                <h1 className="mx-md:hidden">Change Password</h1>
                <div className="py-10 w-full md:max-w-[400px] ">
                    <InputBox name="currentPassword" type="password"
                        className="profile-edit-input" placeholder="Current Password"
                        icon="fi-rr-unlock"
                    />
                    <InputBox name="newPassword" type="password"
                        className="profile-edit-input" placeholder="New Password"
                        icon="fi-rr-unlock"
                    />
                    <button
                        onClick={handleSubmit}
                        className="btn-dark px-10">Change Password</button>
                </div>
            </form>
        </Animationwrapper>
    )
}
export default ChangePassword;