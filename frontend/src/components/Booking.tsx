import React, { useEffect } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { getCalApi } from '@calcom/embed-react';
import type { Settings } from '../types';

interface BookingProps {
  settings: Settings;
}

export const Booking: React.FC<BookingProps> = ({ settings }) => {
  const username = settings.calcom_username || 'portfolio-admin';
  const eventSlug = settings.calcom_event_slug || 'consultation';

  useEffect(() => {
    (async function () {
      try {
        const cal = await getCalApi({ namespace: eventSlug });
        cal('ui', {
          styles: { branding: { brandColor: '#06b6d4' } },
          hideEventTypeDetails: false,
          layout: 'month_view',
        });
      } catch (err) {
        console.error('Failed to load Cal.com embed API', err);
      }
    })();
  }, [eventSlug]);

  return (
    <section id="booking" className="py-24 bg-slate-900/60 relative border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consultation</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Schedule a 1-on-1 Consultation
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Discuss architecture, code reviews, technical advisory, or custom software development directly via Cal.com.
          </p>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Flexible Scheduling</h3>
              <p className="text-slate-400 text-xs">Pick a time that fits your timezone.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">30 &amp; 60 Min Sessions</h3>
              <p className="text-slate-400 text-xs">Focused deep-dives &amp; Q&amp;A.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Actionable Outcomes</h3>
              <p className="text-slate-400 text-xs">Clear next steps &amp; architecture notes.</p>
            </div>
          </div>
        </div>

        {/* Cal.com Embed Container */}
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-8 min-h-[600px] flex flex-col items-center justify-center">
          {settings.calcom_enabled ? (
            <div className="w-full flex flex-col items-center space-y-6">
              <div
                style={{ width: '100%', height: '100%', minHeight: '600px' }}
                data-cal-namespace={eventSlug}
                data-cal-link={`${username}/${eventSlug}`}
                data-cal-config='{"layout":"month_view"}'
              />
              <div className="text-center pt-4">
                <a
                  href={`https://cal.com/${username}/${eventSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition shadow-lg shadow-cyan-500/20"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Consultation on Cal.com</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 py-16">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-white font-semibold text-lg">Consultation Scheduling Currently Disabled</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Direct booking is temporarily unavailable. Please reach out via the contact form below to schedule a meeting.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
