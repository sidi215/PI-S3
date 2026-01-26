'use client';

import { motion } from 'framer-motion';
import { Droplets, TrendingUp, Handshake, Brain } from 'lucide-react';

const impacts = [
  {
    icon: <Droplets className="h-8 w-8" />,
    title: "Économie d'eau",
    description:
      "Réduction du gaspillage de l'eau grâce à une irrigation optimisée",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Revenus augmentés',
    description:
      'Augmentation des revenus des agriculteurs grâce à la vente directe',
  },
  {
    icon: <Handshake className="h-8 w-8" />,
    title: 'Commerce équitable',
    description:
      'Circuits courts et commerce équitable entre producteurs et consommateurs',
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: 'Décisions éclairées',
    description:
      "Meilleure prise de décision grâce aux données et à l'intelligence artificielle",
  },
];

export function ImpactSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-emerald-900/20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Un impact réel sur
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {' '}
              l'agriculture locale
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            BetterAgri contribue à une agriculture plus durable, plus productive
            et plus juste en Mauritanie.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {impacts.map((impact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-lg mb-6">
                <div className="text-emerald-600 dark:text-emerald-400">
                  {impact.icon}
                </div>
              </div>
              <h3 className="font-bold text-xl mb-3">{impact.title}</h3>
              <p className="text-muted-foreground">{impact.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
