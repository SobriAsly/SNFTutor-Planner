
import React, { useState, useEffect } from 'react';
import { Student, ClassSession } from '../types';
import { COLORS } from '../constants';
import { X, GraduationCap, Calendar as CalendarIcon, ArrowRight, Clock } from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Partial<ClassSession>) => void;
  onDelete?: (id: string) => void;
  students: Student[];
  initialData?: Partial<ClassSession>;
}

const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  students,
  initialData
}) => {
  const [type, setType] = useState<'SESSION' | 'EVENT'>('SESSION');
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[16]); // Default to a grey/slate for events
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durHrs, setDurHrs] = useState('');
  const [durMins, setDurMins] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      const isNew = !initialData.id;
      setType(initialData.type || (initialData.studentId ? 'SESSION' : 'EVENT'));
      setStudentId(initialData.studentId || '');
      setTitle(initialData.title || '');
      setColor(initialData.color || COLORS[16]);
      setDate(initialData.date || '');
      setEndDate(initialData.endDate || initialData.date || '');
      
      if (isNew) {
        setStartTime(initialData.startTime || '');
        setDurHrs('');
        setDurMins('');
      } else {
        setStartTime(initialData.startTime || '');
        if (initialData.duration) {
          const [h, m] = initialData.duration.split(':');
          setDurHrs(h);
          setDurMins(m);
        } else {
          setDurHrs('');
          setDurMins('');
        }
      }
      
      setNotes(initialData.notes || '');
    }
  }, [initialData, isOpen]);

  const handleDateChange = (val: string) => {
    setDate(val);
    if (!endDate || endDate < val) {
      setEndDate(val);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationStr = (durHrs || durMins) 
      ? `${(durHrs || '0').padStart(2, '0')}:${(durMins || '0').padStart(2, '0')}`
      : undefined;

    onSave({
      id: initialData?.id,
      type,
      studentId: type === 'SESSION' ? studentId : undefined,
      title: type === 'EVENT' ? title : undefined,
      color: type === 'EVENT' ? color : undefined,
      date,
      endDate: type === 'EVENT' ? endDate : undefined,
      startTime: startTime || undefined,
      duration: durationStr,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData?.id ? 'Edit Entry' : 'Add to Schedule'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex p-1 bg-gray-100 mx-6 mt-6 rounded-xl">
          <button
            type="button"
            onClick={() => setType('SESSION')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${type === 'SESSION' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Class
          </button>
          <button
            type="button"
            onClick={() => setType('EVENT')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${type === 'EVENT' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarIcon className="w-4 h-4" />
            General Event
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === 'SESSION' ? (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Student</label>
              <select
                required
                className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">Select a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Math Workshop, School Holiday"
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Event Color</label>
                <div className="grid grid-cols-10 gap-2 p-1 border border-gray-100 rounded-xl bg-gray-50/50">
                  {COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${c.split(' ')[0]} ${color === c ? 'border-gray-800 scale-125 shadow-sm' : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'EVENT' ? (
            <div className="grid grid-cols-[1fr,auto,1fr] items-end gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">From</label>
                <input
                  type="date"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-xs"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div className="pb-4 text-gray-300">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">To</label>
                <input
                  type="date"
                  required
                  min={date}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Date</label>
              <input
                type="date"
                required
                className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 text-gray-400">Start Time</label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 text-gray-400">Duration (HH:MM)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="HH"
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={durHrs}
                  onChange={(e) => setDurHrs(e.target.value)}
                />
                <span className="font-bold text-gray-400">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="30"
                  placeholder="MM"
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={durMins}
                  onChange={(e) => setDurMins(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 text-gray-400">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
            />
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
            >
              Save to Schedule
            </button>
            {initialData?.id && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id!);
                  onClose();
                }}
                className="w-full text-rose-600 hover:bg-rose-50 font-bold py-2 rounded-xl transition-all"
              >
                Delete Entry
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassModal;
