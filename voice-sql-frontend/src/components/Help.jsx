import  { useState } from "react";
import "./Help.css";

const faqs = [
  {
    question: "How do I create a query?",
    answer:
      "Go to New Query, click the microphone button, and speak your question naturally. VoiceSQL AI will convert your request into an SQL query."
  },
  {
    question: "Can I type my query instead of speaking?",
    answer:
      "Yes. You can type your question manually if you do not want to use the microphone."
  },
  {
    question: "Which databases are supported?",
    answer:
      "The application currently supports the database configured in your project. PostgreSQL can be used with the current VoiceSQL AI setup."
  },
  {
    question: "Where can I see previous queries?",
    answer:
      "Open Query History from the sidebar to view previously generated and executed queries."
  },
  {
    question: "Why didn't my query execute?",
    answer:
      "Check your database connection and make sure the generated SQL query is valid. Also verify that the selected database is connected properly."
  }
];

const troubleshooting = [
  {
    icon: "🎙️",
    title: "Microphone not working",
    description: "Allow microphone permission in your browser.",
    className: "mic"
  },
  {
    icon: "🗄️",
    title: "Database connection failed",
    description: "Check your database credentials and connection.",
    className: "database"
  },
  {
    icon: "</>",
    title: "SQL generation failed",
    description: "Try asking your question more clearly.",
    className: "sql"
  },
  {
    icon: "▦",
    title: "No results",
    description: "Check whether your query returns any records.",
    className: "results"
  }
];

function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="help-page">

      {/* Header */}
      <div className="help-header">
        <div>
          <h1>Help & Support</h1>
          <p>
            Learn how to use VoiceSQL AI and get answers to common questions.
          </p>
        </div>

        <div className="help-illustration">
          <div className="question-bubble">?</div>
          <div className="chat-bubble">•••</div>
        </div>
      </div>

      {/* How VoiceSQL AI Works */}
      <section className="how-section">
        <h2>How VoiceSQL AI Works</h2>

        <div className="steps-container">

          {/* Step 1 */}
          <div className="step-card">
            <div className="step-top">
              <div className="step-icon database-icon">▤</div>
              <span className="step-number">1</span>
            </div>

            <h3>Select Database</h3>

            <p>
              Choose the database you want to work with.
            </p>
          </div>

          <div className="step-arrow">→</div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-top">
              <div className="step-icon microphone-icon">♩</div>
              <span className="step-number">2</span>
            </div>

            <h3>Ask Your Question</h3>

            <p>
              Click the microphone and speak naturally or type your question.
            </p>
          </div>

          <div className="step-arrow">→</div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-top">
              <div className="step-icon code-icon">&lt;/&gt;</div>
              <span className="step-number">3</span>
            </div>

            <h3>Generate SQL</h3>

            <p>
              VoiceSQL AI converts your question into an SQL query.
            </p>
          </div>

          <div className="step-arrow">→</div>

          {/* Step 4 */}
          <div className="step-card">
            <div className="step-top">
              <div className="step-icon table-icon">▦</div>
              <span className="step-number">4</span>
            </div>

            <h3>View Results</h3>

            <p>
              Execute the query and view the results in a beautiful table.
            </p>
          </div>

        </div>
      </section>

      {/* FAQ + Troubleshooting */}
      <div className="help-bottom-grid">

        {/* FAQ */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                className={`faq-item ${
                  openFaq === index ? "faq-open" : ""
                }`}
                key={index}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>

                  <span className="faq-arrow">
                    {openFaq === index ? "⌃" : "⌄"}
                  </span>
                </button>

                {openFaq === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="troubleshooting-section">
          <h2>Troubleshooting</h2>

          <div className="troubleshooting-list">
            {troubleshooting.map((item, index) => (
              <div
                className="troubleshooting-item"
                key={index}
              >
                <div className={`trouble-icon ${item.className}`}>
                  {item.icon}
                </div>

                <div className="trouble-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

    </div>
  );
}

export default Help;