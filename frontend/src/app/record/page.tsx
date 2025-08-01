// Next.js 13+ App Router 기준: /app/main/page.tsx

import React from "react";

export default function MainPage() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f0f0f0",
      color: "#333",
      padding: "2rem"
    }}>
      <h1>Site is working!</h1>
      <p>Welcome to the /main page.</p>
    </main>
  );
}
