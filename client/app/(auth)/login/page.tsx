import LoginRegisterForm from "@/components/forms/login-register";

function Login() {
  return (
    <div className="flex justify-center items-center w-full mb-20">
      <LoginRegisterForm type="login" className="mt-5"></LoginRegisterForm>
    </div>
  );
}

export default Login;
