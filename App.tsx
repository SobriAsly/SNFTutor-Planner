
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, ClassSession, ViewType } from './types';
import { INITIAL_STUDENTS } from './constants';
import { MONTH_NAMES, getDaysInMonth, getFirstDayOfMonth, formatTime } from './utils/dateUtils';
import ClassModal from './components/ClassModal';
import StudentModal from './components/StudentModal';
import * as htmlToImage from 'html-to-image';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Settings,
  Star,
  Edit2,
  Download,
  Check,
  X as CloseIcon,
  Camera,
  Menu,
  X
} from 'lucide-react';

const App: React.FC = () => {
  // State for data
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('tutor_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [classes, setClasses] = useState<ClassSession[]>(() => {
    const saved = localStorage.getItem('tutor_classes');
    return saved ? JSON.parse(saved) : [];
  });

  const [plannerName, setPlannerName] = useState(() => {
    return localStorage.getItem('tutor_planner_name') || 'SNFTutor';
  });

  const [plannerIcon, setPlannerIcon] = useState(() => {
    return localStorage.getItem('tutor_planner_icon') || '';
  });

  // UI State
  const [currentView, setCurrentView] = useState<ViewType>('MASTER');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassSession> | undefined>(undefined);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(plannerName);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tutor_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('tutor_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('tutor_planner_name', plannerName);
  }, [plannerName]);

  useEffect(() => {
    localStorage.setItem('tutor_planner_icon', plannerIcon);
  }, [plannerIcon]);

  // Derived Values
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const currentMonthName = MONTH_NAMES[month];

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const [cYear, cMonth] = c.date.split('-').map(Number);
      const [eYear, eMonth] = (c.endDate || c.date).split('-').map(Number);
      
      const startInMonth = cYear === year && (cMonth - 1) === month;
      const endInMonth = eYear === year && (eMonth - 1) === month;
      const spansMonth = (cYear < year || (cYear === year && (cMonth - 1) <= month)) && 
                         (eYear > year || (eYear === year && (eMonth - 1) >= month));
      
      const isRelevantMonth = startInMonth || endInMonth || spansMonth;
      
      if (currentView === 'MASTER') return isRelevantMonth;
      // Include master events OR sessions for this specific student
      return isRelevantMonth && (c.type === 'EVENT' || (c.type === 'SESSION' && c.studentId === currentView));
    });
  }, [classes, year, month, currentView]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // Handlers
  const handlePrevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  const addOrUpdateClass = (data: Partial<ClassSession>) => {
    if (data.id) {
      setClasses(prev => prev.map(c => c.id === data.id ? { ...c, ...data } as ClassSession : c));
    } else {
      const newClass: ClassSession = {
        ...data as Omit<ClassSession, 'id'>,
        id: Math.random().toString(36).substr(2, 9)
      };
      setClasses(prev => [...prev, newClass]);
    }
    setEditingClass(undefined);
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const addStudent = (name: string, color: string) => {
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setClasses(prev => prev.filter(c => c.studentId !== id));
    if (currentView === id) setCurrentView('MASTER');
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (currentView !== 'MASTER') {
      const existingClassIdx = classes.findIndex(c => c.date === dateStr && c.studentId === currentView && c.type === 'SESSION');
      if (existingClassIdx > -1) {
        setClasses(prev => prev.filter((_, i) => i !== existingClassIdx));
      } else {
        const newClass: ClassSession = {
          id: Math.random().toString(36).substr(2, 9),
          studentId: currentView,
          type: 'SESSION',
          date: dateStr
        };
        setClasses(prev => [...prev, newClass]);
      }
    } else {
      setEditingClass({ date: dateStr, type: 'SESSION' });
      setIsClassModalOpen(true);
    }
  };

  const handleClassDetailsClick = (e: React.MouseEvent, c: ClassSession) => {
    e.stopPropagation();
    setEditingClass(c);
    setIsClassModalOpen(true);
  };

  const savePlannerName = () => {
    setPlannerName(tempName.trim() || 'SNFTutor');
    setIsEditingName(false);
  };

  const handleIconClick = () => {
    if (isEditingName) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlannerIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportToImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setIsSidebarOpen(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const captureWidth = 1600;
      const captureHeight = 900;
      
      const options = {
        backgroundColor: '#f8fafc',
        cacheBust: true,
        pixelRatio: 2, 
        width: captureWidth,
        height: captureHeight,
        style: {
          padding: '40px 60px',
          borderRadius: '0px',
          width: `${captureWidth}px`,
          height: `${captureHeight}px`,
          margin: '0',
          transform: 'none',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden'
        }
      };
      
      const dataUrl = await htmlToImage.toPng(exportRef.current, options);
      
      const link = document.createElement('a');
      const filename = currentView === 'MASTER' 
        ? `${plannerName}_Master_${currentMonthName}_${year}.png`
        : `${plannerName}_${studentMap.get(currentView)?.name}_${currentMonthName}_${year}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Could not generate the image. Please try taking a manual screenshot.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderCalendar = () => {
    const days = [];
    const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50 h-24 md:h-32 border border-gray-100"></div>);
    }

    const numRows = Math.ceil((startDay + daysInMonth) / 7);
    const cellClass = isExporting 
      ? (numRows > 5 ? 'h-24' : 'h-28') 
      : 'h-24 md:h-32';

    const currentStudent = currentView === 'MASTER' ? null : studentMap.get(currentView);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayClasses = filteredClasses.filter(c => {
        if (c.type === 'EVENT' && c.endDate) {
          return dateStr >= c.date && dateStr <= c.endDate;
        }
        return c.date === dateStr;
      });

      const isStudentView = currentView !== 'MASTER';
      const hasStudentSession = isStudentView && dayClasses.some(c => c.type === 'SESSION' && c.studentId === currentView);
      
      // Theme colors for active student view
      const studentBgClass = hasStudentSession ? currentStudent?.color?.split(' ')[0] : 'bg-white';
      const studentTextColorClass = hasStudentSession ? currentStudent?.color?.split(' ')[1] : 'text-gray-400';

      days.push(
        <div 
          key={d} 
          onClick={() => handleDayClick(d)}
          className={`${cellClass} border border-gray-100 transition-colors cursor-pointer group relative flex flex-col ${isStudentView ? (hasStudentSession ? `${studentBgClass} p-0` : 'bg-white hover:bg-indigo-50/30 p-1 md:p-2') : 'bg-white hover:bg-gray-50 p-1 md:p-2'} overflow-hidden`}
        >
          {/* Day Number Header */}
          <div className={`flex justify-between items-start mb-0.5 md:mb-1 ${hasStudentSession ? 'p-1 md:p-2' : ''}`}>
            <span className={`text-[10px] md:text-sm font-bold ${hasStudentSession ? studentTextColorClass : 'text-gray-400'} group-hover:text-indigo-600 transition-colors`}>{d}</span>
            {isStudentView && !hasStudentSession && !isExporting && (
              <Plus className="w-3 md:w-3.5 h-3 md:h-3.5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          <div className={`flex-1 flex flex-col ${hasStudentSession ? 'justify-center items-center px-1 pb-2 w-full' : 'space-y-0.5 md:space-y-1'}`}>
            {dayClasses
              .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))
              .map(c => {
                if (c.type === 'EVENT') {
                  const isStart = dateStr === c.date;
                  const isEnd = dateStr === c.endDate;
                  return (
                    <div 
                      key={c.id + dateStr}
                      onClick={(e) => handleClassDetailsClick(e, c)}
                      className={`px-1 md:px-1.5 py-0.5 md:py-1 transition-transform active:scale-95 border-gray-900 shadow-sm ${c.color || 'bg-gray-800 text-white'} ${isStart && isEnd ? 'rounded border' : isStart ? 'rounded-l border-l border-t border-b' : isEnd ? 'rounded-r border-r border-t border-b' : 'border-t border-b'} ${hasStudentSession ? 'w-[90%] mb-1' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-0.5 md:gap-1 min-w-0">
                        <div className="flex items-center gap-0.5 md:gap-1 min-w-0">
                          <Star className="w-1.5 md:w-2 h-1.5 md:h-2 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <div className="text-[8px] md:text-[10px] font-bold truncate">
                            {c.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Student Session Logic - Uses high-contrast theme color and explicit centering
                if (isStudentView && hasStudentSession) {
                    return (
                        <div 
                            key={c.id} 
                            className="w-full text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-1 duration-300 px-1"
                        >
                            <div className="flex flex-col items-center justify-center leading-none w-full">
                              <span className={`text-[9px] md:text-xs font-black ${studentTextColorClass} opacity-80 uppercase tracking-tighter mb-0.5 whitespace-nowrap text-center w-full`}>
                                  {c.startTime ? formatTime(c.startTime) : ''}
                              </span>
                              <span className={`text-[10px] md:text-sm font-black ${studentTextColorClass} leading-[1.1] break-words uppercase text-center w-full whitespace-normal`}>
                                  {currentStudent?.name}
                              </span>
                            </div>
                            {c.duration && (
                                <span className={`text-[7px] md:text-[8px] font-bold ${studentTextColorClass} opacity-70 uppercase mt-0.5 whitespace-nowrap text-center w-full`}>
                                    {c.duration}
                                </span>
                            )}
                        </div>
                    );
                }

                // Master View Logic
                const s = studentMap.get(c.studentId || '');
                const studentName = s?.name || 'Unknown Student';
                
                return (
                  <div 
                    key={c.id}
                    onClick={(e) => handleClassDetailsClick(e, c)}
                    className={`px-1 md:px-1.5 py-0.5 md:py-1 rounded border shadow-sm transition-transform active:scale-95 ${s?.color || 'bg-gray-100 text-gray-800'}`}
                  >
                    <div className="flex items-center justify-between gap-0.5 md:gap-1 min-w-0">
                      <div className="text-[8px] md:text-[10px] font-bold truncate">
                        {c.startTime ? `${formatTime(c.startTime)} ${studentName}` : studentName}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-l border-t border-gray-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm bg-white">
        {dayLabels.map(label => (
          <div key={label} className="bg-gray-50 py-2 md:py-5 border-r border-b border-gray-100 text-center text-[8px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] md:tracking-[0.2em]">
            {label}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const currentStudent = currentView === 'MASTER' ? null : studentMap.get(currentView);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white p-6">
      <div className="flex items-center gap-3 mb-10 group relative">
        <div 
          className={`w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200 overflow-hidden relative group/icon ${isEditingName ? 'cursor-pointer ring-2 ring-indigo-500 ring-offset-2' : ''}`}
          onClick={handleIconClick}
        >
          {plannerIcon ? (
            <img src={plannerIcon} alt="Planner Logo" className="w-full h-full object-cover" />
          ) : (
            <CalendarIcon className="w-5 h-5" />
          )}
          {isEditingName && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />

        {isEditingName ? (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-1">
              <input
                autoFocus
                className="text-sm font-bold text-gray-900 border-b-2 border-indigo-500 outline-none w-full bg-transparent"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePlannerName()}
              />
              <button onClick={savePlannerName} className="p-1 hover:bg-green-50 text-green-600 rounded-md">
                <Check className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">PLANNER</span>
          </div>
        ) : (
          <div className="cursor-pointer group/title flex flex-col" onClick={() => setIsEditingName(true)}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 leading-none">{plannerName}</h1>
              <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">PLANNER</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">VIEW</p>
        <button 
          onClick={() => { setCurrentView('MASTER'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${currentView === 'MASTER' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Users className="w-5 h-5 opacity-70" />
          <span className="text-sm">Master</span>
        </button>
      </div>

      <div className="mt-12 flex-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">ROSTER</p>
          <button 
            onClick={() => setIsStudentModalOpen(true)}
            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap md:flex-col gap-2">
          {students.map(s => (
            <button 
              key={s.id}
              onClick={() => { setCurrentView(s.id); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${currentView === s.id ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <div className={`w-2 h-2 rounded-full border border-white ${s.color.split(' ')[0]}`} />
              <span className="text-sm truncate">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
        <button 
          onClick={() => {
            setEditingClass({ 
              studentId: currentView === 'MASTER' ? undefined : currentView,
              type: currentView === 'MASTER' ? 'EVENT' : 'SESSION'
            });
            setIsClassModalOpen(true);
          }}
          className="w-full bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">New Entry</span>
        </button>

        <button 
          onClick={exportToImage}
          disabled={isExporting}
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
        >
          <Download className="w-5 h-5" />
          <span className="text-sm">{isExporting ? 'Generating...' : 'Export Schedule'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden md:flex w-64 border-r border-gray-200 flex-col flex-shrink-0 z-10 bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <div className={`no-print fixed inset-0 z-50 md:hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <div className={`absolute top-0 bottom-0 left-0 w-72 bg-white shadow-2xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Button rendered after content to stay on top */}
          {sidebarContent}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-20"
            aria-label="Close sidebar"
          >
             <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <header className="no-print bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-indigo-100 rounded-lg">
                <Menu className="w-5 h-5" />
             </button>
             <div className="bg-[#f0f3ff] p-1.5 md:p-2 rounded-lg overflow-hidden flex items-center justify-center">
                {plannerIcon ? (
                  <img src={plannerIcon} alt="Logo" className="w-4 h-4 md:w-6 md:h-6 object-cover" />
                ) : (
                  <CalendarIcon className="w-4 h-4 md:w-6 md:h-6 text-[#6366f1]" />
                )}
             </div>
             <div>
                <h2 className="text-sm md:text-lg font-black text-slate-800 leading-none mb-0.5">
                  {currentView === 'MASTER' ? `${plannerName} Master` : currentStudent?.name}
                </h2>
                <div className="text-gray-400 text-[9px] md:text-[11px] font-black uppercase tracking-widest">
                  {currentMonthName} {year}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-50 rounded-xl p-0.5 border border-gray-100">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-[10px] md:text-xs font-black text-gray-700 min-w-[80px] md:min-w-[100px] text-center uppercase tracking-widest">
                {currentMonthName}
              </div>
              <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Persistent Content-Area Navigation Bar */}
        {!isExporting && (
          <nav className="no-print bg-white border-b border-gray-100 flex items-center px-4 py-2 gap-2 overflow-x-auto hide-scrollbar flex-shrink-0">
            <button 
              onClick={() => setCurrentView('MASTER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-tight transition-all flex-shrink-0 ${currentView === 'MASTER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-95' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:scale-95'}`}
            >
              <Users className="w-3 h-3" />
              Master
            </button>
            <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
            {students.map(s => (
              <button 
                key={s.id}
                onClick={() => setCurrentView(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-tight transition-all flex-shrink-0 ${currentView === s.id ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 shadow-sm active:scale-95' : 'bg-white border border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 active:scale-95'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${s.color.split(' ')[0]}`} />
                {s.name}
              </button>
            ))}
          </nav>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className={`${isExporting ? 'w-full h-full' : 'max-w-6xl mx-auto'} flex flex-col`} ref={exportRef}>
            
            <div className={`flex flex-col gap-6 mb-8 ${isExporting ? 'block' : 'hidden'}`}>
              <div className="flex items-center gap-8">
                <div className="bg-[#f0f3ff] w-24 h-24 rounded-3xl shadow-xl shadow-[#eaedff] flex items-center justify-center">
                   {plannerIcon ? (
                     <img src={plannerIcon} alt="Logo" className="w-14 h-14 object-cover rounded-xl" />
                   ) : (
                     <CalendarIcon className="w-12 h-12 text-[#6366f1]" />
                   )}
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                    {currentView === 'MASTER' ? `${plannerName} Master` : currentStudent?.name}
                  </h1>
                  <p className="text-base font-black text-gray-400 uppercase tracking-[0.4em]">
                    {currentMonthName} {year}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center bg-[#f8fafc] rounded-full px-4 py-2 border border-gray-100 shadow-sm w-fit min-w-[280px] justify-between">
                 <div className="p-2 text-gray-300">
                    <ChevronLeft className="w-6 h-6" />
                 </div>
                 <div className="px-8 text-xs font-black text-gray-700 uppercase tracking-[0.4em]">
                    {currentMonthName}
                 </div>
                 <div className="p-2 text-gray-300">
                    <ChevronRight className="w-6 h-6" />
                 </div>
              </div>
            </div>

            <div className="print:m-0 w-full overflow-hidden flex-grow">
               {renderCalendar()}
            </div>

            <footer className="mt-8 md:mt-12 text-center pb-8">
               <p className="text-gray-300 text-[7px] md:text-[9px] font-black tracking-[0.5em] uppercase flex items-center justify-center gap-1">
                 <span>© DESIGNED BY SOBRI ASLY</span>
               </p>
            </footer>
          </div>
        </div>
      </main>

      <ClassModal 
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClass(undefined);
        }}
        onSave={addOrUpdateClass}
        onDelete={deleteClass}
        students={students}
        initialData={editingClass}
      />

      <StudentModal 
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        onAdd={addStudent}
        onDelete={deleteStudent}
      />
    </div>
  );
};

export default App;
