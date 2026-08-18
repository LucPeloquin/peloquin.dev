export default function Contact() {
    return (
      <section id="contact" className="py-16 bg-dark-light text-white">
        <div className="container mx-auto px-4 text-center">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-primary">Contact Me</h2>
          </header>
          <ul className="flex justify-center space-x-6">
            <li>
              <a href="https://github.com/LucPeloquin" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/jean-luc-peloquin" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="mailto:lucpeloquin77@gmail.com" className="text-primary hover:text-secondary">
                Email
              </a>
            </li>
          </ul>
        </div>
      </section>
    );
  }