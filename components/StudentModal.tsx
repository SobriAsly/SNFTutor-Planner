
import React, { useState } from 'react';
import { Student } from '../types';
import { COLORS } from '../constants';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, students, onAdd, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && students.length < 20) {
      onAdd(newName.trim(), selectedColor);
      setNewName('');
      // Auto-pick next color for convenience
      const currentIndex = COLORS.indexOf(selectedColor);
      setSelectedColor(COLORS[(currentIndex + 1) % COLORS.length]);
    }
  };

  const isLimitReached = students.length >= 20;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manage Students</h2>
            <p className="text-xs text-gray-400 font-medium">{students.length} / 20 students added</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Add New Student</label>
              <input
                type="text"
                disabled={isLimitReached}
                placeholder={isLimitReached ? "Limit reached (20 students)" : "Student Full Name"}
                className={`w-full border rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isLimitReached ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white'}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              
              <div className="grid grid-cols-10 gap-2 p-1">
                {COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLimitReached}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${color.split(' ')[0]} ${selectedColor === color ? 'border-gray-800 scale-125 shadow-sm' : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'}`}
                    title={`Color option ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLimitReached || !newName.trim()}
                className={`w-full font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLimitReached || !newName.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100'}`}
              >
                <Plus className="w-5 h-5" /> Add to Roster
              </button>

              {isLimitReached && (
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-700 border border-indigo-100">
                   <AlertCircle className="w-3.5 h-3.5" />
                   Maximum of 20 students reached.
                </div>
              )}
            </div>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Current Roster</label>
            {students.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-sm text-gray-400 font-medium">Your roster is empty.</p>
              </div>
            ) : (
              students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${s.color.split(' ')[0]}`} />
                    <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                  </div>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;
