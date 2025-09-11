"use client";
import { useState } from "react";
import Button from "./Button";

export default function QuickDecisionEntry({ onSubmit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "personal",
    options: [{ title: "", pros: [], cons: [] }, { title: "", pros: [], cons: [] }],
    confidenceLevel: 50,
    reviewDate: "",
    isPublic: false,
    seekingAdvice: false,
    tags: [],
    expectedOutcome: ""
  });
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0]; // Precompute outside render

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || 
        !formData.description.trim() || 
        formData.options.some(opt => !opt.title.trim()) ||
        !formData.reviewDate) {
      return;
    }

    setLoading(true);
    try {
      const decisionData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        options: formData.options.map(opt => ({
          title: opt.title,
          pros: opt.pros || [],
          cons: opt.cons || []
        })),
        confidenceLevel: formData.confidenceLevel,
        reviewDate: formData.reviewDate,
        expectedOutcome: formData.expectedOutcome,
        isPublic: formData.isPublic,
        seekingAdvice: formData.seekingAdvice,
        tags: formData.tags,
        poll: { enabled: false }
      };

      await onSubmit(decisionData);
      
      setFormData({
        title: "",
        description: "",
        category: "personal",
        options: [{ title: "", pros: [], cons: [] }, { title: "", pros: [], cons: [] }],
        confidenceLevel: 50,
        reviewDate: "",
        isPublic: false,
        seekingAdvice: false,
        tags: [],
        expectedOutcome: ""
      });
      setIsExpanded(false);
    } catch (error) {
      console.error("Error submitting decision:", error);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { title: "", pros: [], cons: [] }]
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const addTag = (tag) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isExpanded) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium">+</span>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 text-left text-gray-400 hover:text-white transition-colors"
          >
            Share a decision you're facing...
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="What decision are you facing?"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <textarea
            placeholder="Add some context about your situation..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="career">Career</option>
              <option value="personal">Personal</option>
              <option value="financial">Financial</option>
              <option value="health">Health</option>
              <option value="relationships">Relationships</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Confidence: {formData.confidenceLevel}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.confidenceLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, confidenceLevel: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Review Date *</label>
            <input
              type="date"
              value={formData.reviewDate}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewDate: e.target.value }))}
              className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min={today}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Expected Outcome</label>
            <input
              type="text"
              placeholder="What do you hope to achieve?"
              value={formData.expectedOutcome}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedOutcome: e.target.value }))}
              className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Options *</label>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option.title}
                  onChange={(e) => updateOption(index, "title", e.target.value)}
                  className="flex-1 bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add another option
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-600/10 text-blue-400 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-300 hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a tag and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">Make public</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.seekingAdvice}
              onChange={(e) => setFormData(prev => ({ ...prev, seekingAdvice: e.target.checked }))}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">Seeking advice</span>
          </label>
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Share Decision"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}