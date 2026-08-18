'use client';

import { motion } from 'framer-motion';

export default function Experience() {
  return (
    <section id="experience" className="py-16 bg-dark text-white">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary">Experience</h2>
        </header>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row gap-8"
        >
          <article className="flex-1">
            <header>
              <h3 className="text-2xl font-bold mb-4 text-primary">Sales Associate / OMNI</h3>
            </header>
            <strong>Kohl&apos;s - Centennial</strong><br />
            <p className="text-gray-300">
              May 2021 - July 2024<br />
              <br />
              - Experience in customer service and technical support<br />
              - Lead for inventory management and stockroom operations<br />
              - Maintained a top 1% efficiency for order fulfillment
            </p>
            <header className="mt-6">
              <h3 className="text-2xl font-bold mb-4 text-primary">Specialist</h3>
            </header>
            <strong>Apple</strong><br />
            <p className="text-gray-300">
              July 2024 - Present<br />
              <br />
              - Conducted advanced technical support for hardware and software issues across the Apple ecosystem<br />
              - Communicated within a large team to maximize efficiency and ensure a smooth customer experience
            </p>
          </article>
        </motion.div>
      </div>
    </section>
  );
}
