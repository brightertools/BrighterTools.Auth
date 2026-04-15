import { useState } from "react";
import { useSignup } from "../hooks/useSignup";

export const SignupForm = () => {
  const signup = useSignup();
  const [email, setEmail] = useState("");

  return (
    <form
      className="card card-body"
      onSubmit={async (event) => {
        event.preventDefault();
        await signup(async () => ({ email }));
      }}
    >
      <label className="form-label">Email</label>
      <input className="form-control mb-3" value={email} onChange={(event) => setEmail(event.target.value)} />
      <button type="submit" className="btn btn-primary">Start signup</button>
    </form>
  );
};
