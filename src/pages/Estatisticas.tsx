
import React, { useState } from "react";
import { ArrowLeft, BellDot } from "lucide-react";
import { Link } from "react-router-dom";
import { ChartLine } from "@/components/ui-custom/ChartLine";
import { ChartCircle } from "@/components/ui-custom/ChartCircle";
import { monthlyData, teamPerformance } from "@/data/mockData";

const Estatisticas: React.FC = () => {
  const [activeMonth, setActiveMonth] = useState("Mai");
  
  return (
    <div className="min-h-screen p-4 page-transition">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Estatísticas</h1>
        <button className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <BellDot size={18} />
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg text-muted-foreground">Atendimento de chamados</h2>
        <div className="text-2xl font-bold">74 instalações</div>
        
        <ChartLine data={monthlyData} activeMonth={activeMonth} />
        
        <div className="flex justify-between mt-2">
          {monthlyData.map(month => (
            <button
              key={month.name}
              className={`px-2 py-1 rounded-full text-sm transition-all ${
                activeMonth === month.name 
                  ? "bg-primary text-white" 
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveMonth(month.name)}
            >
              {month.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg">Acompanhamento</h2>
          <button className="text-sm text-primary">Mais detalhes</button>
        </div>
        
        <div className="flex justify-center mt-4">
          <ChartCircle value={55} size={160} />
        </div>
        
        <div className="mt-6 space-y-2">
          {teamPerformance.map((member, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: member.color }}
              />
              <span>{member.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Estatisticas;
