import { Frame } from "../frame";

// The public page at / on the deployed site. Participants arrive at /p through their personal links instead.
// Plain HTML on Ring's colors and type, so it renders on the server and needs no JavaScript.
export default function Landing() {
  return (
    <Frame>
      <main className="page-narrow">
        <h1>Group cards in the way that makes sense to you.</h1>
        <p>
          mPile is a card-sorting tool for community and research activities. Each person sorts on their own
          phone or computer. No account is needed.
        </p>
        <section className="panel">
          <h2>Were you invited to a sort?</h2>
          <p>
            Open the personal link the study team sent you, exactly as it was sent, then enter your six-digit passcode.
            If the link doesn&apos;t open, ask the person who sent it to send it again.
          </p>
        </section>
        <section>
          <h2>For research teams</h2>
          <p className="secondary-text">
            Sessions are created and collected on the researcher&apos;s own computer. Responses are sealed in each
            participant&apos;s browser, so this site stores only data it cannot read, and deletes it when the session is
            closed and deleted or expires.
          </p>
          <p>
            <a className="ring-link" href="https://github.com/MalverdeSoftware" target="_blank" rel="noreferrer">
              About the project
            </a>
          </p>
        </section>
      </main>
    </Frame>
  );
}
