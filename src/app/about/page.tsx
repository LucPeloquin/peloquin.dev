export default function About() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">About Me</h1>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Background</h2>
        <p className="text-lg mb-4">
          I am a passionate data scientist and software developer with expertise in machine learning, 
          data analysis, and web development. With several years of experience in the field, I&apos;ve worked
          on projects ranging from predictive analytics to full-stack web applications.
        </p>
        <p className="text-lg mb-4">
          My academic background includes advanced degrees in Computer Science with a focus on 
          artificial intelligence and data science. I&apos;m constantly learning and exploring new
          technologies to expand my knowledge and skill set.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-medium mb-2">Programming Languages</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Python</li>
              <li>JavaScript/TypeScript</li>
              <li>R</li>
              <li>SQL</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Frameworks & Libraries</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>TensorFlow/PyTorch</li>
              <li>React/Next.js</li>
              <li>Node.js</li>
              <li>pandas/NumPy</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="text-lg mb-4">
          I&apos;m always open to discussing new projects, opportunities, or just having a chat about
          data science and software development.
        </p>
        <div className="space-y-2">
          <p><strong>Email:</strong> <a href="mailto:contact@jeanlucpeloquin.com" className="text-blue-500 hover:underline">contact@jeanlucpeloquin.com</a></p>
          <p><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/jeanlucpeloquin" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">linkedin.com/in/jeanlucpeloquin</a></p>
          <p><strong>GitHub:</strong> <a href="https://github.com/jeanlucpeloquin" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">github.com/jeanlucpeloquin</a></p>
        </div>
      </section>
    </div>
  );
}
