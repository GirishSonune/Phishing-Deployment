import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShieldCheckIcon, MagnifyingGlassIcon, ChartBarIcon, ExclamationTriangleIcon, BoltIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-primary-500 selection:text-white overflow-hidden">
      <Navbar variant="landing" />

      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-600/20 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary-600/20 blur-[120px] mix-blend-screen animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-accent-500/20 blur-[100px] mix-blend-screen animate-pulse-slow delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in-up">
              <span className="px-3 py-1 text-sm font-medium text-primary-300">New Feature</span>
              <span className="ml-2 text-sm text-gray-300">SHAP-powered Threat Analysis</span>
            </div>

            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-primary-400 text-6xl md:text-8xl font-bold tracking-tight mb-8 animate-fade-in-up delay-100">
              AEGIS
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Advanced Engine for Guarded Internet Surfing.
              <br />
              <span className="text-gray-400 text-lg md:text-xl mt-4 block">
                Real-time AI protection against phishing, scams, and digital threats.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in-up delay-300">
              <Link
                to="/home"
                className="group relative px-8 py-4 bg-primary-600 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:bg-primary-500 transition-all duration-300 w-full sm:w-auto"
              >
                <span className="flex items-center justify-center">
                  Get Started
                  <BoltIcon className="ml-2 h-5 w-5 group-hover:animate-sizzle" />
                </span>
                <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 rounded-xl font-bold text-lg text-white border border-white/10 hover:bg-white/5 hover:border-white/20 backdrop-blur-sm transition-all duration-300 w-full sm:w-auto"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Floating UI Elements (Decorative) */}
        <div className="absolute top-1/4 left-10 hidden lg:block animate-float">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl shadow-2xl transform -rotate-6">
            <ShieldCheckIcon className="h-12 w-12 text-primary-400" />
            <div className="mt-2 h-2 w-20 bg-white/20 rounded-full"></div>
            <div className="mt-2 h-2 w-12 bg-white/10 rounded-full"></div>
          </div>
        </div>

        <div className="absolute bottom-1/4 right-10 hidden lg:block animate-float delay-1000">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl shadow-2xl transform rotate-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-danger-500" />
            <div className="mt-2 h-2 w-20 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 bg-dark-bg/50 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Why Choose AEGIS?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Powered by advanced machine learning models (Random Forest) and Explainable AI (SHAP) to provide transparent and accurate protection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<MagnifyingGlassIcon className="h-8 w-8 text-primary-400" />}
              title="Real-time Analysis"
              description="Instant URL scanning with sub-second response times using optimized ML models."
              delay="0"
            />
            <FeatureCard
              icon={<ExclamationTriangleIcon className="h-8 w-8 text-danger-500" />}
              title="Threat Blocking"
              description="Proactive blocking of malicious domains before they can load in your browser."
              delay="100"
            />
            <FeatureCard
              icon={<ChartBarIcon className="h-8 w-8 text-success-500" />}
              title="Detailed Analytics"
              description="Visual insights into your browsing habits and blocked threats history."
              delay="200"
            />
            <FeatureCard
              icon={<GlobeAltIcon className="h-8 w-8 text-secondary-500" />}
              title="Global Intelligence"
              description="Continuously updated threat database sourced from global security networks."
              delay="300"
            />
          </div>
        </div>
      </section>

      {/* OTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900/50 to-secondary-900/50 border border-white/10 p-12 text-center">
            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to secure your digital footprint?</h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Join thousands of users who have made the switch to safer, smarter browsing with AEGIS.
              </p>
              <Link
                to="/register"
                className="inline-block px-8 py-4 bg-white text-primary-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary-500/30 hover:bg-white/10 transition-all duration-300 group`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 p-3 rounded-xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}