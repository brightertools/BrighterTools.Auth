import { useState } from "react";
import { useLogin } from "../hooks/useLogin";

export const LoginForm = () => {
  const login = useLogin();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="card card-body"
      onSubmit={async (event) => {
        event.preventDefault();
        await login({ login: loginValue, password });
      }}
    >
      <label className="form-label">Email</label>
      <input className="form-control mb-3" value={loginValue} onChange={(event) => setLoginValue(event.target.value)} />
      <label className="form-label">Password</label>
      <input className="form-control mb-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <button type="submit" className="btn btn-primary">Sign in</button>
    </form>
  );
};
