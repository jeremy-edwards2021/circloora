"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="global-error-shell">
          <h1>Circloora needs a fresh start</h1>
          <p>Your saved device records have not been deleted.</p>
          <button onClick={reset} type="button">
            Reload Circloora
          </button>
        </main>
      </body>
    </html>
  );
}
