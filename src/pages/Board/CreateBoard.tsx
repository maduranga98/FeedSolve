import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createBoard } from '../../lib/firestore';
import { Button, Input } from '../../components/Shared';
import type { BoardFormInput } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

export function CreateBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<BoardFormInput>({
    name: '',
    description: '',
    categories: ['Bug Report', 'Feature Request', 'Complaint'],
    isAnonymousAllowed: false,
  });
  const [newCategory, setNewCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Board name is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (formData.categories.length === 0)
      newErrors.categories = 'At least one category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setFormData({
        ...formData,
        categories: [...formData.categories, newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      await createBoard(user.companyId, formData);
      navigate('/dashboard');
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create board',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">Create Board</h1>
        <p className="text-[#6B7B8D] mb-8">
          Set up a new feedback board to start collecting feedback
        </p>

        {errors.submit && (
          <div className="mb-4 p-4 bg-[#FFE5E5] border border-[#E74C3C] rounded-lg">
            <p className="text-sm text-[#E74C3C]">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Board Name"
            placeholder="Product Feedback"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={errors.name}
          />

          <Input
            label="Description"
            placeholder="Collect feedback about your product"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            error={errors.description}
          />

          <div>
            <label className="block text-sm font-medium text-[#1E3A5F] mb-3">
              Feedback Categories
            </label>

            <div className="space-y-2 mb-4">
              {formData.categories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#F8FAFB] p-3 rounded-lg border border-[#D3D1C7]"
                >
                  <span className="text-[#1E3A5F]">{category}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="text-[#E74C3C] hover:text-[#C0392B]"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {errors.categories && (
              <p className="text-sm text-[#E74C3C] mb-3">{errors.categories}</p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                className="flex-1 px-4 py-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCategory}
                className="flex items-center gap-2"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAnonymousAllowed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isAnonymousAllowed: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-[#D3D1C7] text-[#2E86AB] focus:ring-[#2E86AB]"
            />
            <span className="text-[#1E3A5F] font-medium">
              Allow anonymous submissions
            </span>
          </label>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="flex-1"
            >
              Create Board
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
