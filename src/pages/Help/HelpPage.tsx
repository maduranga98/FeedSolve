import { useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { InstructionsAndGuidance } from '../../components/Help/InstructionsAndGuidance';

export function HelpPage() {
  useEffect(() => {
    document.title = 'Help & Support | FeedSolve';
  }, []);

  return (
    <div className="min-h-screen bg-[#E1E8EF]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center">
              <HelpCircle size={20} className="text-[#2E86AB]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Help & Support</h1>
              <p className="text-sm text-[#6B7B8D] mt-0.5">
                Get started with FeedSolve and find answers to common questions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InstructionsAndGuidance />
      </div>
    </div>
  );
}
