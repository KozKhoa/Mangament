import LoginRegisterForm from "@/components/forms/login-register";

function Register() {
  return (
    <div className="flex justify-center items-center w-full mb-20">
      <LoginRegisterForm type="register" className="mt-5"></LoginRegisterForm>
    </div>
  );
}

export default Register;
