import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, type Variants } from 'framer-motion';

/* ─── animation helpers ──────────────────────────────────────────────── */

const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: EASE_OUT },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── data ───────────────────────────────────────────────────────────── */

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface Step {
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    title: 'Task Orchestration',
    desc: 'Create, assign, and schedule deployment tasks with an Excel-like grid interface.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Dependency Management',
    desc: 'Define task dependencies with automatic cycle detection and blocking resolution.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    title: 'Email Notifications',
    desc: 'Automatic email alerts with secure one-click acknowledgement links.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Real-time Dashboard',
    desc: 'Live overview of deployment status, task progress, and team activity.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
];

const steps: Step[] = [
  { title: 'Create Tasks', desc: 'Add deployment tasks with schedules, teams, and descriptions.' },
  { title: 'Set Dependencies', desc: 'Link tasks together so they execute in the right order.' },
  { title: 'Auto-Orchestrate', desc: 'The scheduler triggers tasks, sends emails, and tracks completion.' },
];

/* ─── main component ─────────────────────────────────────────────────── */

export default function LandingPage() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-stone-100"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <motion.span
            className="text-xl font-bold text-stone-900 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Deploy<span className="text-teal-700">Flow</span>
          </motion.span>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-teal-900"
      >
        <div
          className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-20 text-center"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="text-sm text-stone-300 font-medium">
              Deployment Orchestration Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: EASE_OUT }}
          >
            Deploy with confidence,
            <br />
            not spreadsheets
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="mt-6 text-lg sm:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            Replace fragile spreadsheets with an automated, event-driven platform.
            Manage tasks, resolve dependencies, and track deployments in real time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="group px-8 py-3.5 bg-white text-teal-800 font-semibold rounded-xl hover:bg-teal-50 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Go to Dashboard
                <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="group px-8 py-3.5 bg-white text-teal-800 font-semibold rounded-xl hover:bg-teal-50 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Get Started Free
                  <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="relative py-24 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <AnimatedSection className="text-center">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold text-primary uppercase tracking-wider"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight"
            >
              Everything you need
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-stone-500 max-w-lg mx-auto"
            >
              Powerful features to manage your deployment pipeline end-to-end.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group relative p-6 rounded-card border border-border bg-white hover:border-primary-muted hover:shadow-card-hover transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center group-hover:bg-primary-muted transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-4xl mx-auto px-8">
          <AnimatedSection className="text-center">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-sm font-semibold text-primary uppercase tracking-wider"
            >
              How it works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-3 text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight"
            >
              Three simple steps
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* connector line (desktop) */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200" />

            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <div
                  className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-lg font-bold shadow-md"
                >
                  {i + 1}
                </div>
                <h3 className="mt-5 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <AnimatedSection className="max-w-4xl mx-auto px-8 text-center">
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight"
          >
            Ready to streamline your deployments?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="mt-4 text-stone-500 max-w-lg mx-auto"
          >
            Stop juggling spreadsheets. Start orchestrating with confidence.
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-8"
          >
            <Link
              to={isLoggedIn ? '/dashboard' : '/signup'}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-8 text-center text-sm text-text-muted border-t border-border">
        &copy; {new Date().getFullYear()} Tilli-go. All rights reserved.
      </footer>
    </div>
  );
}
