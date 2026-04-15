import { useState } from "react";
import { useMfa } from "../hooks/useMfa";

export const MfaChallengeForm = () => {
  const { challenge } = useMfa();
  const [code, setCode] = useState("");

  return (
    <form
      className="card card-body"
      onSubmit={async (event) => {
        event.preventDefault();
        await challenge(async () => ({ code }));
      }}
    >
      <label className="form-label">Authenticator code</label>
      <input className="form-control mb-3" value={code} onChange={(event) => setCode(event.target.value)} />
      <button type="submit" className="btn btn-primary">Verify</button>
    </form>
  );
};
