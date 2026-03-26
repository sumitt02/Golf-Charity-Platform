'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export default function HomeClient({ featured, charities }: { featured: any, charities: any[] }) {
  return (
    <div className="min-h-screen bg-black text-white">

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-4 border-b border-zinc-800"
      >
        <h1 className="text-xl font-bold text-green-400">GolfGives</h1>
        <div className="flex items-center gap-4">
          <Link href="/charities" className="text-gray-400 hover:text-white text-sm transition">Charities</Link>
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition">Sign in</Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition inline-block">
              Get started
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-1 rounded-full mb-6"
        >
          Play. Win. Give.
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl font-bold leading-tight mb-6"
        >
          Golf that changes<br />
          <span className="text-green-400">lives.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-400 text-lg mb-10 max-w-xl mx-auto"
        >
          Enter your Stableford scores, join monthly prize draws, and automatically support the charity of your choice.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-xl transition text-lg inline-block">
              Start for free
            </Link>
          </motion.div>
          <Link href="/pricing" className="text-gray-400 hover:text-white transition border border-zinc-700 px-8 py-3 rounded-xl">
            View pricing
          </Link>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="border-y border-zinc-800 py-12"
      >
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '£40K+', label: 'Prize pool distributed' },
            { value: String(charities.length), label: 'Charities supported' },
            { value: 'Monthly', label: 'Prize draws' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <p className="text-3xl font-bold text-green-400">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Featured charity */}
      {featured && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-6 py-16"
        >
          <p className="text-green-400 text-sm font-medium mb-2">Featured charity</p>
          <div className="bg-zinc-900 rounded-2xl p-8 border border-green-500/20">
            <h3 className="text-2xl font-bold mb-2">{featured.name}</h3>
            <p className="text-gray-400">{featured.description}</p>
          </div>
        </motion.section>
      )}

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-center mb-16"
        >
          How it works
        </motion.h3>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { step: '1', title: 'Subscribe', desc: 'Choose a monthly or yearly plan and get full access to the platform.' },
            { step: '2', title: 'Enter your scores', desc: 'Log your latest Stableford scores after each round. Your top 5 are always tracked.' },
            { step: '3', title: 'Win & give', desc: 'Monthly draws give you a chance to win big while your subscription supports charity.' },
          ].map((item) => (
            <motion.div
              key={item.step}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 font-bold">{item.step}</span>
              </div>
              <h4 className="font-semibold mb-2">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Charities */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold mb-4"
          >
            Supporting causes that matter
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-400 mb-12"
          >
            A portion of every subscription goes directly to your chosen charity.
          </motion.p>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {charities.map((charity) => (
              <motion.div
                key={charity.id}
                variants={staggerItem}
                whileHover={{ scale: 1.03, y: -2 }}
                className={`rounded-xl p-4 border cursor-pointer transition ${
                  charity.is_featured
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <Link href={`/charities/${charity.id}`}>
                  <p className="text-sm text-gray-300 font-medium">{charity.name}</p>
                  {charity.is_featured && (
                    <p className="text-xs text-green-400 mt-1">Featured</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-3xl font-bold mb-4">Ready to play with purpose?</h3>
          <p className="text-gray-400 mb-8">Join golfers making every round count.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-xl transition text-lg inline-block">
              Create your account
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-gray-500 text-sm">
        © 2026 GolfGives. All rights reserved.
      </footer>

    </div>
  )
}