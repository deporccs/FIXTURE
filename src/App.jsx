import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Dribbble, 
  Download, 
  FileText, 
  CheckCircle2,
  LayoutDashboard,
  Settings as SettingsIcon
} from 'lucide-react';

/**
 * Aplicación Principal: Gestor de Torneos Universitarios
 * Permite configurar universidades, deportes y generar fixtures automáticos
 * con exportación a CSV y optimización para impresión (PDF).
 */
const App = () => {
  // --- ESTADOS PRINCIPALES ---
  const [universities, setUniversities] = useState([
    { id: 1, name: "Universidad Nacional", logo: null },
    { id: 2, name: "Instituto Tecnológico", logo: null },
    { id: 3, name: "Universidad de Ciencias", logo: null },
    { id: 4, name: "Facultad de Artes", logo: null }
  ]);
  
  const [sports, setSports] = useState([
    { id: 's1', name: "Fútbol", rounds: 1 },
    { id: 's2', name: "Vóley", rounds: 1 }
  ]);

  // Relación Universidad -> Deportes en los que participa
  const [enrollments, setEnrollments] = useState({
    1: ["Fútbol", "Vóley"],
    2: ["Fútbol"],
    3: ["Fútbol", "Vóley"],
    4: ["Vóley"]
  });

  const [activeTab, setActiveTab] = useState('config');
  const [generatedFixture, setGeneratedFixture] = useState(null);
  const [newUniName, setNewUniName] = useState('');
  const [newSportName, setNewSportName] = useState('');

  // --- FUNCIONES DE EXPORTACIÓN ---
  
  // Genera un archivo CSV descargable
  const exportToCSV = () => {
    if (!generatedFixture) return;
    let csvContent = "\uFEFF"; // BOM para asegurar compatibilidad con Excel (acentos)
    csvContent += "Jornada,Equipo A,Equipo B,Deportes\n";
    
    generatedFixture.forEach(match => {
      const sportsList = match.sports.map(s => s.name).join(" | ");
      csvContent += `${match.round},"${match.teamA.name}","${match.teamB.name}","${sportsList}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fixture_torneo.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Activa el diálogo de impresión del navegador
  const exportToPDF = () => {
    window.print();
  };

  // --- GESTIÓN DE DATOS ---
  const handleAddUniversity = () => {
    if (newUniName.trim()) {
      const newId = Date.now();
      setUniversities([...universities, { id: newId, name: newUniName.trim(), logo: null }]);
      setEnrollments({ ...enrollments, [newId]: [] });
      setNewUniName('');
    }
  };

  const handleAddSport = () => {
    if (newSportName.trim()) {
      setSports([...sports, { id: `s-${Date.now()}`, name: newSportName.trim(), rounds: 1 }]);
      setNewSportName('');
    }
  };

  const toggleEnrollment = (uniId, sportName) => {
    const current = enrollments[uniId] || [];
    if (current.includes(sportName)) {
      setEnrollments({ ...enrollments, [uniId]: current.filter(s => s !== sportName) });
    } else {
      setEnrollments({ ...enrollments, [uniId]: [...current, sportName] });
    }
  };

  // --- ALGORITMO DE GENERACIÓN DE FIXTURE (ROUND ROBIN) ---
  const generateFixture = () => {
    const allMatches = [];
    
    sports.forEach(sportObj => {
      const participants = universities.filter(u => enrollments[u.id]?.includes(sportObj.name));
      if (participants.length < 2) return;

      let tempTeams = [...participants];
      // Si el número de equipos es impar, se añade un "descanso" (null)
      if (tempTeams.length % 2 !== 0) tempTeams.push(null);

      const n = tempTeams.length;
      const roundsPerVuelta = n - 1;

      for (let v = 0; v < sportObj.rounds; v++) {
        const rotation = [...tempTeams];
        for (let r = 0; r < roundsPerVuelta; r++) {
          for (let i = 0; i < n / 2; i++) {
            const home = rotation[i];
            const away = rotation[n - 1 - i];
            
            if (home && away) {
              allMatches.push({
                round: (v * roundsPerVuelta) + r + 1,
                home: v % 2 === 0 ? home : away,
                away: v % 2 === 0 ? away : home,
                sport: sportObj.name
              });
            }
          }
          // Rotación de equipos (Algoritmo de la cinta)
          rotation.splice(1, 0, rotation.pop());
        }
      }
    });

    // Agrupación de deportes por mismo enfrentamiento en la misma jornada
    const grouped = allMatches.reduce((acc, m) => {
      const sortedIds = [m.home.id, m.away.id].sort().join('-');
      const key = `R${m.round}-${sortedIds}`;
      
      if (!acc[key]) {
        acc[key] = {
          round: m.round,
          teamA: m.home,
          teamB: m.away,
          sports: []
        };
      }
      acc[key].sports.push({ name: m.sport });
      return acc;
    }, {});

    setGeneratedFixture(Object.values(grouped).sort((a, b) => a.round - b.round));
    setActiveTab('fixture');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { background: white !important; padding: 0 !important; width: 100% !important; }
          .card-match { break-inside: avoid; border: 1px solid #e2e8f0 !important; margin-bottom: 1rem; }
          body { background: white; }
        }
      `}</style>

      {/* Barra de Navegación */}
      <header className="bg-indigo-900 text-white shadow-xl no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Trophy className="text-indigo-900" size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase">Torneo Universitario</h1>
          </div>
          <div className="flex bg-indigo-950/50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800'}`}
            >
              <SettingsIcon size={16} /> Configuración
            </button>
            <button 
              onClick={() => setActiveTab('fixture')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'fixture' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800'}`}
            >
              <LayoutDashboard size={16} /> Ver Fixture
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {activeTab === 'config' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
            {/* Columna Universidades */}
            <section className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" /> Universidades
                </h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                  {universities.length}
                </span>
              </div>
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                {universities.map(u => (
                  <div key={u.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100">
                    <span className="font-semibold text-slate-700">{u.name}</span>
                    <button 
                      onClick={() => setUniversities(universities.filter(x => x.id !== u.id))} 
                      className="text-slate-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nombre de Univ..." 
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  className="flex-1 bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <button onClick={handleAddUniversity} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-md transition">
                  <Plus size={20} />
                </button>
              </div>
            </section>

            {/* Columna Deportes */}
            <section className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Dribbble size={20} className="text-orange-500" /> Deportes
                </h2>
              </div>
              <div className="space-y-4 mb-6">
                {sports.map(s => (
                  <div key={s.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">{s.name}</span>
                      <button onClick={() => setSports(sports.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Vueltas de torneo:</span>
                      <div className="flex gap-1 bg-white p-1 rounded-lg border">
                        {[1, 2].map(v => (
                          <button 
                            key={v}
                            onClick={() => setSports(sports.map(sp => sp.id === s.id ? {...sp, rounds: v} : sp))}
                            className={`w-8 h-8 rounded-md text-xs font-bold transition ${s.rounds === v ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  placeholder="Nuevo deporte..." 
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  className="flex-1 bg-slate-50 border-slate-200 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <button onClick={handleAddSport} className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 shadow-md transition">
                  <Plus size={20} />
                </button>
              </div>
              <button 
                onClick={generateFixture}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                Generar Calendario <Calendar size={18} />
              </button>
            </section>

            {/* Inscripciones */}
            <section className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <h2 className="text-lg font-bold mb-6">Matriz de Inscripción</h2>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b">
                      <th className="text-left pb-3 font-medium">Universidad</th>
                      {sports.map(s => <th key={s.id} className="text-center pb-3 px-2 font-medium">{s.name.substring(0,3)}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {universities.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 font-semibold text-slate-700">{u.name}</td>
                        {sports.map(s => (
                          <td key={s.id} className="text-center py-4">
                            <button 
                              onClick={() => toggleEnrollment(u.id, s.name)}
                              className={`w-8 h-8 rounded-xl transition flex items-center justify-center mx-auto ${enrollments[u.id]?.includes(s.name) ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* VISTA DEL FIXTURE GENERADO */
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Calendario de Juegos</h2>
                <p className="text-slate-500 mt-1 font-medium">Organización automática por jornadas y disciplinas.</p>
              </div>
              <div className="flex gap-3 no-print w-full md:w-auto">
                <button 
                  onClick={exportToCSV} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 transition"
                >
                  <Download size={18} /> Excel (CSV)
                </button>
                <button 
                  onClick={exportToPDF} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-100 transition"
                >
                  <FileText size={18} /> Imprimir PDF
                </button>
              </div>
            </div>

            {!generatedFixture || generatedFixture.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No hay fixture generado</h3>
                <p className="text-slate-400 mt-2 max-w-xs mx-auto">Configura universidades y deportes, luego presiona el botón "Generar Calendario".</p>
              </div>
            ) : (
              <div className="space-y-12">
                {[...new Set(generatedFixture.map(f => f.round))].sort((a,b) => a-b).map(roundNum => (
                  <div key={roundNum} className="print-area">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-tighter">
                        Jornada {roundNum}
                      </div>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {generatedFixture.filter(f => f.round === roundNum).map((match, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 card-match transition hover:shadow-md">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Encuentro</span>
                            <div className="flex items-center gap-1 text-slate-300">
                              <Clock size={14} />
                              <span className="text-[10px] font-bold">HORARIO PENDIENTE</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="flex-1 text-center">
                              <div className="text-sm font-black text-slate-800 break-words">{match.teamA.name}</div>
                              <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Local</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">VS</div>
                            </div>
                            <div className="flex-1 text-center">
                              <div className="text-sm font-black text-slate-800 break-words">{match.teamB.name}</div>
                              <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Visitante</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {match.sports.map((s, si) => (
                              <div key={si} className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Dribbble size={12} className="text-indigo-400" />
                                  <span>{s.name}</span>
                                </div>
                                <span className="bg-indigo-200/50 px-2 py-0.5 rounded text-[8px]">PROGRAMADO</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer informativo */}
      <footer className="max-w-7xl mx-auto px-6 mt-10 border-t border-slate-200 py-8 no-print">
        <p className="text-center text-slate-400 text-xs font-medium">
          Sistema de Gestión de Deportes Universitarios &copy; 2024. Diseñado para alta legibilidad e impresión.
        </p>
      </footer>
    </div>
  );
};

export default App;