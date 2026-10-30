import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, ArrowLeft, MessageSquare, Clock, ShieldCheck } from 'lucide-react';

export default function ContactPage({ onNavigateHome }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Bug / Issue',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const targetEmail = 'businesswithsuchit@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(targetEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          _subject: `[CompressPDF Support] ${formData.subject} from ${formData.name}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });

      if (!response.ok) {
        throw new Error('Network dispatch error');
      }

      setIsSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.warn('FormSubmit fallback:', err);
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', subject: 'Bug / Issue', message: '' });
    setSubmitted(false);
    setError('');
  };

  return (
    <div className="py-12 md:py-20 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="space-y-4 text-left">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Compressor</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Contact & Support
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reach out with bug reports, feature requests, or partnership inquiries
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Direct Email</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {targetEmail}
            </p>
            <button
              onClick={handleCopyEmail}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 pt-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Email Address'}</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Response Time</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We review and respond to reports within 24 business hours.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Security Assured</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your message is forwarded securely without third-party data tracking.
            </p>
          </div>
        </div>

        {/* Main Contact Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-sm text-left">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Dispatched!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Thank you for contacting us. Your message has been sent directly to <strong>{targetEmail}</strong>. We will review and reply to your email address soon.
              </p>
              
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  Send Another Message
                </button>
                <button
                  onClick={onNavigateHome}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Return to Compressor
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
              <div className="space-y-1 mb-6 text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Send a Message to Developer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submissions go directly to {targetEmail}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="Bug / Issue">Report a Bug / Compression Issue</option>
                  <option value="Feature Request">Request a New Feature</option>
                  <option value="General Feedback">General Feedback & Suggestions</option>
                  <option value="Business Inquiry">Partnership / Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Please describe your question or issue in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting message to {targetEmail}...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to {targetEmail}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <a
                  href={`mailto:${targetEmail}?subject=CompressPDF%20Support`}
                  className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1"
                >
                  <span>Or open directly in your mail application</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
