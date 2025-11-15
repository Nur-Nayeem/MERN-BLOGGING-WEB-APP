const InputBox = ({ name, type, id, value, placeholder, icon, disable = false }) => {
    return (
        <div className="relative w-[100%] mb-4">
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                defaultValue={value}
                id={id}
                disabled={disable}
                className="input-box"
            />
            <i className={"fi " + icon + " input-icon"}></i>
        </div>
    )
}
export default InputBox;