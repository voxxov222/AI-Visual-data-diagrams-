
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highcharts3d from 'highcharts/highcharts-3d';
import { CryptoMarketData, NeuralViewMode, TransactionPacket, DetailedTransaction } from '../types';

// Initialize Highcharts 3D module
if (typeof Highcharts === 'object') {
  highcharts3d(Highcharts);
}

interface NeuralLandscapeProps {
  activeNode: string;
  isFullScreen?: boolean;
}

const NeuralLandscape: React.FC<NeuralLandscapeProps> = ({ activeNode, isFullScreen }) => {
  const [data, setData] = useState<CryptoMarketData | null>(null);
  const [viewMode, setViewMode] = useState<NeuralViewMode>('TERRAIN');
  const [rotation, setRotation] = useState({ x: 65, y: 0, z: 45 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [points, setPoints] = useState<number[]>(new Array(400).fill(0).map(() => Math.random() * 50));
  const [packets, setPackets] = useState<TransactionPacket[]>([]);
  const [selectedTx, setSelectedTx] = useState<DetailedTransaction | null>(null);
  const [investigatedNode, setInvestigatedNode] = useState<number | null>(null);
  
  const lastPos = useRef({ x: 0, y: 0 });
  const gridSize = 20;

  // WASD Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 10;
      switch(e.key.toLowerCase()) {
        case 'w': setCameraPos(prev => ({ ...prev, y: prev.y + speed })); break;
        case 's': setCameraPos(prev => ({ ...prev, y: prev.y - speed })); break;
        case 'a': setCameraPos(prev => ({ ...prev, x: prev.x + speed })); break;
        case 'd': setCameraPos(prev => ({ ...prev, x: prev.x - speed })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time Simulation Loop
  useEffect(() => {
    const dataInterval = setInterval(() => {
      setPoints(prev => prev.map(p => Math.max(5, Math.min(120, p + (Math.random() - 0.5) * 10))));
      
      if (Math.random() > 0.4) {
        const id = Math.random().toString(36).substr(2, 6).toUpperCase();
        const startIdx = Math.floor(Math.random() * points.length);
        const endIdx = Math.floor(Math.random() * points.length);
        
        const newPacket: TransactionPacket = {
          id,
          value: Math.random() * 50,
          startX: startIdx % gridSize,
          startY: Math.floor(startIdx / gridSize),
          endX: endIdx % gridSize,
          endY: Math.floor(endIdx / gridSize),
          progress: 0,
          color: Math.random() > 0.5 ? '#60a5fa' : '#a78bfa',
          hash: `0x${Math.random().toString(16).substr(2, 32)}`
        };
        setPackets(prev => [...prev.slice(-20), newPacket]);
      }

      setData({
        symbol: activeNode,
        price: 52000 + Math.random() * 2000,
        change24h: (Math.random() * 6) - 3,
        volume: points,
        lastUpdate: new Date()
      });
    }, 1000);

    const physicsInterval = setInterval(() => {
      setPackets(prev => prev.map(p => ({ ...p, progress: p.progress + 0.02 })).filter(p => p.progress < 1));
    }, 32);

    return () => {
      clearInterval(dataInterval);
      clearInterval(physicsInterval);
    };
  }, [activeNode]);

  const handleNodeInvestigate = (index: number) => {
    setInvestigatedNode(index);
    const id = `NODE-${index}-${activeNode}`;
    setSelectedTx({
      id,
      from: `0x${Math.random().toString(16).substr(2, 10)}...`,
      to: `Node_${index}`,
      amount: points[index],
      timestamp: new Date().toLocaleTimeString(),
      status: 'confirmed'
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;
    setRotation(prev => ({
      ...prev,
      z: prev.z + deltaX * 0.4,
      x: Math.max(5, Math.min(175, prev.x - deltaY * 0.4))
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleWheel = (e: React.WheelEvent) => {
    setZoom(prev => Math.max(0.2, Math.min(5, prev - e.deltaY * 0.001)));
  };

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      options3d: {
        enabled: true,
        alpha: 15,
        beta: 15,
        depth: 50,
        viewDistance: 25
      }
    },
    title: { text: null },
    xAxis: {
      categories: ['Flux', 'Density', 'Latency', 'Resonance'],
      labels: { style: { color: '#94a3b8' } }
    },
    yAxis: {
      title: { text: null },
      gridLineColor: '#1e293b'
    },
    series: [{
      name: 'Node Telemetry',
      data: [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ],
      colorByPoint: true,
      colors: ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981']
    }],
    legend: { enabled: false },
    credits: { enabled: false }
  }), [investigatedNode]);

  return (
    <div 
      className={`relative w-full ${isFullScreen ? 'h-screen' : 'h-[750px]'} bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-700`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      style={{ perspective: '2000px' }}
    >
      {/* Background HUD Layers */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none"></div>
      
      {/* Navigation Instruction HUD */}
      <div className="absolute top-6 left-8 z-40 space-y-4 pointer-events-none">
        <div className="flex items-center space-x-3 bg-slate-900/60 backdrop-blur-md p-3 rounded-lg border border-slate-700/50">
           <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center rotate-45 border border-blue-400">
             <i className="fas fa-compass text-white -rotate-45"></i>
           </div>
           <div>
             <h2 className="text-sm font-black text-white italic tracking-tighter uppercase">{activeNode} System Dive</h2>
             <p className="text-[8px] text-blue-400 font-mono tracking-[0.2em]">POSITION_X: {cameraPos.x} // Y: {cameraPos.y}</p>
           </div>
        </div>

        <div className="flex flex-col space-y-1">
          <div className="flex gap-2">
            {(['TERRAIN', 'VORTEX', 'NETWORK', 'CLUSTER', 'FLOW'] as NeuralViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
                className={`px-3 py-1.5 rounded text-[9px] font-black tracking-widest uppercase transition-all border pointer-events-auto ${
                  viewMode === mode 
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)]' 
                  : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="text-[8px] text-slate-500 font-mono italic mt-2">
            [WASD] TO NAVIGATE // [DRAG] TO ORBIT // [SCROLL] TO ZOOM // [CLICK] NODE TO INVESTIGATE
          </div>
        </div>
      </div>

      {/* Transaction Investigator (Highcharts Integration) */}
      {selectedTx && (
        <div className="absolute top-6 right-8 z-50 w-96 bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right duration-300 pointer-events-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Node Interrogation</h4>
              <p className="text-lg font-black text-white italic">{selectedTx.id}</p>
            </div>
            <button onClick={() => setSelectedTx(null)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
          </div>
          
          <div className="h-48 mb-6">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>

          <div className="space-y-3 font-mono text-[10px]">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-500">ORIGIN_LINK</span>
              <span className="text-blue-300">{selectedTx.from}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-500">TARGET_LINK</span>
              <span className="text-purple-300">{selectedTx.to}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-500">MAGNITUDE</span>
              <span className="text-emerald-400">{selectedTx.amount.toFixed(4)} GWh</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 uppercase font-black">Verified Stream</span>
              <span className="text-slate-600">{selectedTx.timestamp}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Visualizer Core */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
        style={{ 
          transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg) translate3d(${cameraPos.x}px, ${cameraPos.y}px, ${viewMode === 'DIVE' ? '300px' : '0'})`,
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="relative w-[800px] h-[800px]" style={{ transformStyle: 'preserve-3d' }}>
          {/* Floor Wireframe */}
          <div className="absolute inset-0 border border-blue-500/10" style={{ transform: 'translateZ(-10px)' }}>
            <div className="w-full h-full opacity-[0.05]" style={{ 
              backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Data Nodes */}
          {points.map((val, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            let tx = col * 40 - 400;
            let ty = row * 40 - 400;
            let tz = val;
            let scale = 1;
            let opacity = 0.8;

            if (viewMode === 'VORTEX') {
              const angle = (i / points.length) * Math.PI * 15 + (Date.now() * 0.0002);
              const radius = 10 + (i * 0.9);
              tx = Math.cos(angle) * radius;
              ty = Math.sin(angle) * radius;
              tz = val * 0.4 + (i * 0.05);
            } else if (viewMode === 'CLUSTER') {
              const clusterX = Math.floor(i / 100) * 200 - 300;
              const clusterY = (i % 4) * 200 - 300;
              tx = clusterX + (col % 10) * 12;
              ty = clusterY + (row % 10) * 12;
              tz = val * 1.8;
            }

            return (
              <div 
                key={i}
                onClick={() => handleNodeInvestigate(i)}
                className={`absolute w-2 h-2 rounded-full cursor-pointer transition-all duration-1000 node-pulse ${
                  investigatedNode === i ? 'bg-white scale-[4] z-50' : ''
                }`}
                style={{
                  left: `${tx + 400}px`,
                  top: `${ty + 400}px`,
                  transform: `translateZ(${tz}px) scale(${scale})`,
                  backgroundColor: val > 100 ? '#f87171' : val > 50 ? '#60a5fa' : '#334155',
                  boxShadow: val > 100 ? '0 0 15px #ef4444' : 'none',
                  opacity
                }}
              >
                {investigatedNode === i && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-white/20"></div>
                )}
              </div>
            );
          })}

          {/* Mesh Lines for Terrain Mode */}
          {viewMode === 'TERRAIN' && points.map((val, i) => {
            if (i % gridSize === gridSize - 1 || i >= points.length - gridSize) return null;
            return (
              <React.Fragment key={`mesh-${i}`}>
                <div 
                  className="absolute bg-blue-500/20 pointer-events-none"
                  style={{
                    width: '40px',
                    height: '1px',
                    left: `${(i % gridSize) * 40}px`,
                    top: `${Math.floor(i / gridSize) * 40}px`,
                    transform: `translateZ(${val}px) rotateY(${(points[i+1] - val) * 0.6}deg)`,
                    transformOrigin: 'left'
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Animated Transaction Packets (Flow) */}
          <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
            {packets.map(p => {
              const curX = (p.startX + (p.endX - p.startX) * p.progress) * 40;
              const curY = (p.startY + (p.endY - p.startY) * p.progress) * 40;
              const curZ = 40 + Math.sin(p.progress * Math.PI) * 120;
              return (
                <div 
                  key={p.id}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: `${curX}px`,
                    top: `${curY}px`,
                    transform: `translateZ(${curZ}px)`,
                    backgroundColor: p.color,
                    boxShadow: `0 0 20px ${p.color}`,
                    opacity: 1 - Math.abs(p.progress - 0.5) * 2
                  }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-8 w-px bg-gradient-to-t from-white/40 to-transparent"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Status Widgets */}
      <div className="absolute bottom-8 left-8 z-40 pointer-events-none">
        <div className="flex space-x-4">
          <div className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800 w-40">
             <div className="text-[8px] text-slate-500 uppercase font-black mb-1">Global Volume</div>
             <div className="text-sm font-black text-white italic">4.18M TX/hr</div>
             <div className="mt-2 flex space-x-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex-1 h-6 bg-slate-800 rounded-sm overflow-hidden flex items-end">
                    <div className="w-full bg-blue-500/50" style={{ height: `${Math.random()*100}%` }}></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800 w-40">
             <div className="text-[8px] text-slate-500 uppercase font-black mb-1">Stream Health</div>
             <div className="text-sm font-black text-emerald-400 italic">NOMINAL_LINK</div>
             <div className="mt-2 text-[10px] text-slate-400 font-mono">LAT: 14ms // JIT: 2ms</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-40 flex flex-col items-end pointer-events-none">
        <div className="bg-slate-900/40 border border-slate-700/50 px-4 py-2 rounded text-[10px] font-mono text-slate-500 uppercase tracking-widest backdrop-blur-sm">
          HW_ACCEL: ON // REFRESH: 60Hz
        </div>
      </div>
    </div>
  );
};

export default NeuralLandscape;
