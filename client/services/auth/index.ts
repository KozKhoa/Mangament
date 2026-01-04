import me from "./me";
import login from "./login";
import register from "./register";
import logout from "./logout";
import { forgotPassword, resetPassword } from "./password";

const authService = { me, login, register, logout, forgotPassword, resetPassword };

export default authService;
