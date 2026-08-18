'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function About() {
  return (
    <section id="about" className="py-16 bg-dark-light text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* About Me */}
          <motion.article
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <header>
              <h3 className="text-2xl font-bold mb-4 text-primary">About Me</h3>
            </header>
            <p className="text-gray-300">
              A 22-year-old Data Scientist and Software Developer from Las Vegas, Nevada, with a B.S. in Computer Science from UNLV.
              <br /><br />
              With strengths in analytical thinking, collaboration, and attention to detail, I deliver a product filled with passion and intention. My university journey has taught me many skillsets I look to bring into my work, including machine learning, image processing, cloud computing, statistical analysis, product development, and professional writing.
            </p>
            <footer className="mt-6">
              <button
                onClick={() => window.open('/documents/resume.pdf', '_blank')}
                className="bg-primary text-white px-6 py-2 rounded hover:bg-secondary"
              >
                View Resume
              </button>
            </footer>
          </motion.article>

          {/* Skills */}
          <motion.article
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <header>
              <h3 className="text-2xl font-bold mb-4 text-primary">Skills</h3>
            </header>
            <p className="text-gray-300">
              <strong>Proficient in:</strong> Python, C/C++/C#, .NET, Java, SQL, R, MATLAB, JavaScript<br />
              <strong>Familiar with:</strong> HTML, CSS, React, Node.js, Django, MongoDB, ASM<br />
              <strong>Platforms:</strong> AWS, Salesforce, Tableau, PowerBI, Visual Studio, Discord, Slack<br />
              <strong>Tools:</strong> Git, Excel, Photoshop, DaVinci Resolve<br />
              <strong>OS:</strong> Windows, macOS, Linux
            </p>
            <div className="text-center mt-6">
              <Image
                src="/images/luc.png"
                alt="Jean-Luc Peloquin"
                width={291}
                height={291}
                className="mx-auto max-w-full h-auto rounded-lg border-4 border-primary"
              />
            </div>
          </motion.article>

          {/* Education */}
          <motion.article
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <header>
              <h3 className="text-2xl font-bold mb-4 text-primary">Education</h3>
            </header>
            <p className="text-gray-300">
              <strong>University of Nevada, Las Vegas</strong><br />
              Bachelor of Science in Computer Science<br />
              Graduated Spring 2024 with a 3.5 GPA
            </p>
            <p className="text-gray-300 mt-4">
              <strong>Google</strong><br />
              Data Analytics Professional Certificate<br />
              Completed June 2024 - September 2024 (accelerated)
            </p>
            <header className="mt-6">
              <h3 className="text-2xl font-bold mb-4 text-primary">Academic Awards</h3>
            </header>
            <p className="text-gray-300">
              UNLV Howard R. Hughes College of Engineering Scholarship (2021)<br />
              Gilman and Bartlett Scholarship (2022)<br />
              Ralph Dippner Scholarship (2023)<br />
              3x Dean&apos;s List (FA 2020, SP 2021, SP 2023)
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
