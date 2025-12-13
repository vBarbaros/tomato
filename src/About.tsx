export default function About() {
  return (
    <div className="view about-view">
      <div className="about-hero">
        <h2>🍅 Transform Your Productivity</h2>
        <p className="hero-text">
          Welcome to your journey of focused work and intentional breaks. This simple timer can revolutionize
          how you approach tasks, helping you build sustainable productivity habits that last.
        </p>
      </div>

      <div className="about-sections">
        <section className="about-section">
          <h3>✨ How This Changes Your Life</h3>
          <ul>
            <li><strong>Break the overwhelm:</strong> Large tasks become manageable 25-minute chunks</li>
            <li><strong>Build focus muscle:</strong> Train your brain to concentrate deeply</li>
            <li><strong>Prevent burnout:</strong> Regular breaks keep you energized all day</li>
            <li><strong>Track progress:</strong> See your productivity patterns and celebrate wins</li>
            <li><strong>Create momentum:</strong> Small consistent sessions compound into big results</li>
          </ul>
        </section>

        <section className="about-section">
          <h3>🎯 The Science Behind It</h3>
          <p>
            The Pomodoro Technique leverages your brain's natural attention cycles. By working in focused
            25-minute intervals followed by short breaks, you maintain peak mental performance while
            avoiding the fatigue that comes from marathon work sessions.
          </p>
        </section>

        <section className="about-section">
          <h3>🚀 More Productivity Tools</h3>
          <p>
            Enjoying this timer? I'm building more tools to help you work smarter, not harder.
            Check out my other productivity projects and join a community of focused achievers.
          </p>
          <a
            href="https://vbarbaros.github.io/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="developer-link"
          >
            Explore More Tools →
          </a>
        </section>

        <section className="about-section">
          <h3>🔒 Your Privacy Matters</h3>
          <p>
            This app is completely <strong>free</strong> and respects your privacy. All your data stays
            on your device - no tracking, no analytics, no data collection. Your productivity journey
            is yours alone.
          </p>
        </section>

        <section className="about-section">
          <h3>📜 Copyright & License</h3>
          <p>
            © 2025 Tomato Timer. This software is provided free of charge for personal use. 
            Built with care for the productivity community.
          </p>
        </section>

        <section className="about-section disclaimer">
          <h3>⚖️ Legal Disclaimer</h3>
          <p>
            Pomodoro® and The Pomodoro Technique® are trademarks of Francesco Cirillo.
            Tomato Timer is not affiliated with, associated with, or endorsed by Pomodoro®,
            The Pomodoro Technique®, or Francesco Cirillo. This is an independent implementation
            of time management principles for educational and productivity purposes.
          </p>
        </section>
      </div>

      <div className="about-footer">
        <p>Made with 🍅 ⏰ and dedication to help you achieve your 🎯</p>
      </div>
    </div>
  );
}
