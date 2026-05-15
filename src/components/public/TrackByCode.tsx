import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button, Input } from "../Shared";

export function TrackByCode() {
  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCode.trim().replace(/^#/, "");
    if (trimmed) navigate(`/track/${trimmed}`);
  };

  return (
    <div className="space-y-5 text-left">
      <div className="rounded-xl border border-[#E3EDF4] bg-[#F1F5F8] p-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBF5FB]">
          <Search size={22} className="text-[#2E86AB]" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F]">Track by Code</h2>
        <p className="mt-1 text-sm text-[#6B7B8D]">
          Enter the tracking code you received after submitting feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Tracking code"
          placeholder="Enter tracking code (e.g. #FSV-1234)"
          value={inputCode}
          onChange={e => setInputCode(e.target.value)}
          autoFocus
        />
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Track Submission
        </Button>
      </form>
    </div>
  );
}
