import React from 'react';
import { Download, CheckCircle2, Code, Server, Cpu, Shield } from 'lucide-react';
import type { Settings } from '../types';

interface AboutProps {
  settings: Settings;
}

export const About: React.FC<AboutProps> = ({ settings }) => {
  const handleDownloadCV = () => {
    window.open('/api/cv/download', '_blank');
  };

  const highlights = [
    'Clean, maintainable architecture & rigorous testing',
    'High-throughput backend services in Go & Node.js',
    'Responsive, accessible, and performant React interfaces',
    'Secure database modeling & cloud infrastructure deployment',
  ];

  return (
    <section id="about" className="py-24 bg-slate-900/50 relative border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Bio & Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              About Me
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineering robust digital products with precision and scale.
            </h2>

            <div className="text-slate-300 space-y-4 leading-relaxed text-base sm:text-lg">
              <p>
                {settings.about_text ||
                  'I am a passionate software engineer with deep expertise in backend systems, distributed architectures, and full-stack web applications. I focus on building reliable software that solves complex real-world problems.'}
              </p>
              <p>
                Whether designing RESTful APIs in Go, optimizing database queries, or crafting fluid React user experiences, I prioritize performance, security, and developer ergonomics.
              </p>
            </div>

            {/* Highlights checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* CV Download CTA */}
            <div className="pt-4">
              <button
                onClick={handleDownloadCV}
                className="inline-flex items-center space-x-3 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-600/20 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span>Download Complete CV (PDF)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Feature Cards / Stats */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-cyan-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Backend Architecture</h3>
              <p className="text-slate-400 text-sm">
                Designing scalable microservices and APIs with Go, PostgreSQL, and SQLite.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Frontend Engineering</h3>
              <p className="text-slate-400 text-sm">
                Crafting intuitive, responsive UIs with React, TypeScript, and Tailwind CSS.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">System Performance</h3>
              <p className="text-slate-400 text-sm">
                Profiling bottlenecks, optimizing queries, and ensuring high availability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Security & Auth</h3>
              <p className="text-slate-400 text-sm">
                Implementing secure JWT sessions, rate limiting, and robust input validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
