import React, { useState } from 'react';
import { Award, BookOpen, ChevronDown, ChevronUp, Layers, Sparkles } from 'lucide-react';
import type { Skill } from '../types';

interface SkillsProps {
  skills: Skill[];
}

export const Skills: React.FC<SkillsProps> = ({ skills }) => {
  const [expandedStoryId, setExpandedStoryId] = useState<number | null>(null);

  const categories = Array.from(new Set(skills.map((s) => s.category || 'General')));

  const toggleStory = (id: number) => {
    setExpandedStoryId(expandedStoryId === id ? null : id);
  };

  return (
    <section id="skills" className="py-24 bg-slate-950 relative border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Technical Expertise</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Skills & Real-World Mastery
          </h2>
          <p className="text-slate-400 text-lg">
            A breakdown of my core technical stack, proficiency levels, and the hands-on learning stories behind each capability.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category) => {
            const categorySkills = skills.filter((s) => (s.category || 'General') === category);

            return (
              <div key={category} className="space-y-6">
                <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white tracking-wide">{category}</h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {categorySkills.length} skills
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categorySkills.map((skill) => {
                    const isExpanded = expandedStoryId === skill.id;

                    return (
                      <div
                        key={skill.id}
                        className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white font-semibold text-lg">{skill.name}</span>
                            <div className="flex items-center space-x-1.5 text-cyan-400 text-sm font-mono font-medium">
                              <Award className="w-4 h-4" />
                              <span>{skill.proficiency}%</span>
                            </div>
                          </div>

                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                              style={{ width: `${skill.proficiency}%` }}
                            />
                          </div>
                        </div>

                        {skill.learning_story && (
                          <div className="mt-2 pt-4 border-t border-slate-800/80">
                            <button
                              onClick={() => toggleStory(skill.id)}
                              className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                              <div className="flex items-center space-x-1.5">
                                <BookOpen className="w-4 h-4 text-cyan-400" />
                                <span>How I Learned It & Real-World Projects</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/60 text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {skill.learning_story}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
