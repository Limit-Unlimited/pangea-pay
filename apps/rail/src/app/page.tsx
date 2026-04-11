import { NextResponse } from "next/server";

export default function Home() {
  return (
    <div style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>Pangea Payment Rail</h1>
      <p>API documentation: <a href="/api/openapi">/api/openapi</a></p>
      <p>Token endpoint: <code>POST /api/oauth/token</code></p>
    </div>
  );
}
